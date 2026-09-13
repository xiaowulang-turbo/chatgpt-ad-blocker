// Service Worker：规则远程热更 + 累计统计 + badge 计数
'use strict';

// 远程规则地址（纯数据 JSON）。指向本仓库的 rules.json。
var RULES_URL = 'https://raw.githubusercontent.com/xiaowulang-turbo/chatgpt-ad-blocker/main/rules.json';
var RULES_KEY = 'rules';
var STATS_KEY = 'adBlockStats';
var RULES_ALARM = 'cbad-rules-update';
var UPDATE_PERIOD_MIN = 360; // 规则热更周期：6 小时
var STATS_FLUSH_MS = 3000;   // 统计写盘防抖：3 秒
var TAB_KEY = 'tabCounts';   // 各标签页的本页拦截数（storage.session）

// ---- 规则热更 ----

// schema 校验：只允许纯数据，杜绝任何函数/代码注入（商店合规红线）
function isValidRules(r) {
  if (!r || typeof r !== 'object') return false;
  if (typeof r.version !== 'string' || !r.version) return false;
  if (!Array.isArray(r.badgeTexts) || r.badgeTexts.length === 0) return false;
  if (!Array.isArray(r.cardClassHints)) return false;
  if (!Array.isArray(r.sdkAnchors)) return false;
  if (typeof r.maxDepth !== 'number') return false;
  return true;
}

async function updateRules() {
  try {
    var res = await fetch(RULES_URL, { cache: 'no-store' });
    if (!res.ok) return;
    var json = await res.json();
    if (!isValidRules(json)) return; // 非法数据，丢弃，沿用内置默认
    var data = await chrome.storage.local.get(RULES_KEY);
    var local = data[RULES_KEY];
    if (local && local.version === json.version) return; // 版本一致，跳过
    await chrome.storage.local.set({ [RULES_KEY]: json });
  } catch (e) {
    // 拉取失败/超时：静默回退内置默认规则，永不致盲
  }
}

// ---- 累计统计 ----
// 内存累加 + 防抖写盘：避免高频写 storage.sync 触发配额，并消除读-改-写竞态。

function monthKey() {
  var d = new Date();
  return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0');
}

var statsPromise = null; // 单例缓存：保证并发 bump 累加到同一对象，不丢计数
var statsDirty = false;
var statsTimer = null;

function loadStats() {
  if (!statsPromise) {
    statsPromise = chrome.storage.sync.get(STATS_KEY).then(function (data) {
      return data[STATS_KEY] || { total: 0, monthKey: monthKey(), monthCount: 0 };
    });
  }
  return statsPromise;
}

function flushStats() {
  statsTimer = null;
  if (!statsDirty) return;
  statsDirty = false;
  loadStats().then(function (s) {
    chrome.storage.sync.set({ [STATS_KEY]: s }).catch(function () {
      statsDirty = true; // 写失败（如配额）留待下次重试
    });
  });
}

// badge 显示「本页」拦截数；为 0 时不显示角标
function setBadge(count) {
  var text = count > 0 ? (count > 9999 ? '9999+' : String(count)) : '';
  try { chrome.action.setBadgeText({ text: text }); } catch (e) { /* ignore */ }
}

function bumpStats() {
  return loadStats().then(function (s) {
    var mk = monthKey();
    s.total += 1;
    if (s.monthKey === mk) {
      s.monthCount += 1;
    } else {
      s.monthKey = mk;
      s.monthCount = 1;
    }
    statsDirty = true;
    if (!statsTimer) statsTimer = setTimeout(flushStats, STATS_FLUSH_MS);
  });
}

// ---- 角标：当前标签页的「本页」拦截数 ----
// 角标整个扩展只有一个，而拦截数按标签页区分，故按 tabId 记录并跟随活动标签页切换。
// 用 storage.session 持久化：SW 被回收不丢，浏览器关闭自动清（与「本页」语义一致）。

var tabCountsPromise = null;

function loadTabCounts() {
  if (!tabCountsPromise) {
    tabCountsPromise = chrome.storage.session.get(TAB_KEY).then(function (d) {
      return d[TAB_KEY] || {};
    });
  }
  return tabCountsPromise;
}

function activeTabId() {
  return chrome.tabs.query({ active: true, lastFocusedWindow: true }).then(function (tabs) {
    return tabs.length ? tabs[0].id : null;
  }).catch(function () { return null; });
}

function persistTabCounts(counts) {
  chrome.storage.session.set({ [TAB_KEY]: counts }).catch(function () { /* ignore */ });
}

// 按活动标签页刷新角标（切换标签页 / SW 重启时调用）
function refreshBadge() {
  return Promise.all([activeTabId(), loadTabCounts()]).then(function (r) {
    setBadge(r[1][r[0]] || 0);
  });
}

// 某标签页新增一次拦截
function bumpTab(tabId) {
  if (tabId == null) return Promise.resolve();
  return loadTabCounts().then(function (counts) {
    counts[tabId] = (counts[tabId] || 0) + 1;
    persistTabCounts(counts);
    return activeTabId().then(function (id) {
      if (id === tabId) setBadge(counts[tabId]);
    });
  });
}

// 某标签页计数归零（页面重新加载 / 标签页关闭）
function resetTab(tabId) {
  return loadTabCounts().then(function (counts) {
    if (counts[tabId] == null) return;
    delete counts[tabId];
    persistTabCounts(counts);
    return activeTabId().then(function (id) {
      if (id === tabId) setBadge(0);
    });
  });
}

// ---- 消息 ----

chrome.runtime.onMessage.addListener(function (msg, sender, sendResponse) {
  if (!msg) return;
  if (msg.type === 'AD_HIDDEN') {
    var tabId = sender && sender.tab ? sender.tab.id : null;
    Promise.all([bumpStats(), bumpTab(tabId)]).then(function () {
      sendResponse({ ok: true });
    });
    return true; // 保持异步响应通道
  }
  if (msg.type === 'GET_STATS') {
    // popup 取「实时值」，避免读 storage 的滞后快照（写盘有防抖）
    loadStats().then(function (s) {
      sendResponse({ total: s.total, monthCount: s.monthCount });
    });
    return true;
  }
});

// ---- 启动与定时 ----
// MV3 Service Worker 会被回收，setInterval 不保证存活；改用 chrome.alarms 持久化周期任务。

function scheduleRulesUpdate() {
  chrome.alarms.create(RULES_ALARM, { periodInMinutes: UPDATE_PERIOD_MIN });
}

chrome.runtime.onInstalled.addListener(function () {
  updateRules();
  scheduleRulesUpdate();
  chrome.action.setBadgeBackgroundColor({ color: '#1a7f37' });
  refreshBadge();
});

chrome.runtime.onStartup.addListener(function () {
  updateRules();
  scheduleRulesUpdate();
  refreshBadge();
});

// 角标跟随活动标签页；页面重新加载则该页计数归零
chrome.tabs.onActivated.addListener(refreshBadge);
chrome.tabs.onUpdated.addListener(function (tabId, changeInfo) {
  if (changeInfo.status === 'loading') resetTab(tabId);
});
chrome.tabs.onRemoved.addListener(resetTab);

chrome.alarms.onAlarm.addListener(function (alarm) {
  if (alarm.name === RULES_ALARM) updateRules();
});
