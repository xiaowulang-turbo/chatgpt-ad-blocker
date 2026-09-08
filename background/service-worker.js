// Service Worker：规则远程热更 + 累计统计 + badge 计数
'use strict';

// 远程规则地址（纯数据 JSON）。指向本仓库的 rules.json。
var RULES_URL = 'https://raw.githubusercontent.com/xiaowulang-turbo/chatgpt-ad-blocker/main/rules.json';
var RULES_KEY = 'rules';
var STATS_KEY = 'adBlockStats';
var UPDATE_INTERVAL_MS = 6 * 60 * 60 * 1000; // 6 小时

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

function monthKey() {
  var d = new Date();
  return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0');
}

async function bumpStats() {
  var mk = monthKey();
  var data = await chrome.storage.sync.get(STATS_KEY);
  var s = data[STATS_KEY] || { total: 0, monthKey: mk, monthCount: 0 };
  s.total += 1;
  if (s.monthKey === mk) {
    s.monthCount += 1;
  } else {
    s.monthKey = mk;
    s.monthCount = 1;
  }
  await chrome.storage.sync.set({ [STATS_KEY]: s });

  // badge 显示累计总数（>9999 截断显示）
  var text = s.total > 9999 ? '9999+' : String(s.total);
  try { await chrome.action.setBadgeText({ text: text }); } catch (e) { /* ignore */ }
}

// ---- 消息 ----

chrome.runtime.onMessage.addListener(function (msg, sender, sendResponse) {
  if (msg && msg.type === 'AD_HIDDEN') {
    bumpStats().then(function () { sendResponse({ ok: true }); });
    return true; // 保持异步响应通道
  }
});

// ---- 启动与定时 ----

chrome.runtime.onInstalled.addListener(function () {
  updateRules();
  chrome.action.setBadgeBackgroundColor({ color: '#1a7f37' });
});

chrome.runtime.onStartup.addListener(updateRules);
setInterval(updateRules, UPDATE_INTERVAL_MS);
