(function () {
  'use strict';

  var DEFAULT_RULES = window.__CBAD_DEFAULT_RULES__ || {
    version: "0",
    badgeTexts: ["广告", "Sponsored", "Ad", "Promoted", "Advertisement"],
    cardClassHints: ["image-card"],
    sdkAnchors: ["data-ad-card-root", "data-assistant-ads"],
    maxDepth: 6
  };

  var rules = DEFAULT_RULES;
  var enabled = true;
  var mode = 'clean'; // clean=彻底无痕(默认) | safe=仅隐藏卡片
  var pageCount = 0;

  function isBadgeText(t) {
    var s = (t || '').trim();
    return (rules.badgeTexts || []).indexOf(s) >= 0;
  }

  // 从徽标节点向上定位可安全隐藏的广告卡片容器
  function findAdCard(badge) {
    var hints = rules.cardClassHints || [];
    var anchors = rules.sdkAnchors || [];
    var maxDepth = rules.maxDepth || 6;
    var el = badge.parentElement;
    for (var i = 0; el && i < maxDepth; i++) {
      if (el.tagName !== 'DIV') { el = el.parentElement; continue; }
      var cls = typeof el.className === 'string' ? el.className : '';
      if (hints.some(function (h) { return cls.indexOf(h) >= 0; })) return el;
      if (anchors.some(function (a) { return el.hasAttribute(a); })) return el;
      if (cls.indexOf('agent-turn') >= 0) break; // 越出回复容器则放弃
      el = el.parentElement;
    }
    return badge.parentElement || badge;
  }

  // 彻底无痕：向上找广告块的上分隔线（含 border-t 的祖先）
  function findSeparator(card) {
    var el = card.parentElement;
    for (var i = 0; el && i < 4; i++) {
      var cls = typeof el.className === 'string' ? el.className : '';
      if (cls.indexOf('border-t') >= 0) return el;
      if (cls.indexOf('agent-turn') >= 0) break;
      el = el.parentElement;
    }
    return null;
  }

  function scanRoot() {
    return document.querySelector('main') || document.body;
  }

  function hide(card) {
    if (!card || card.getAttribute('data-cb-adhidden')) return;
    card.setAttribute('data-cb-adhidden', '1');
    pageCount += 1;
    if (mode === 'clean') {
      var sep = findSeparator(card);
      if (sep) sep.setAttribute('data-cb-adhidden-sep', '1');
    }
    try { chrome.runtime.sendMessage({ type: 'AD_HIDDEN' }); } catch (e) { /* ignore */ }
  }

  function restoreAll() {
    var root = scanRoot();
    if (!root) return;
    root.querySelectorAll('[data-cb-adhidden], [data-cb-adhidden-sep]').forEach(function (el) {
      el.removeAttribute('data-cb-adhidden');
      el.removeAttribute('data-cb-adhidden-sep');
    });
    pageCount = 0;
  }

  function ensureClean() {
    if (mode !== 'clean') return;
    var root = scanRoot();
    if (!root) return;
    root.querySelectorAll('[data-cb-adhidden]').forEach(function (card) {
      var sep = findSeparator(card);
      if (sep) sep.setAttribute('data-cb-adhidden-sep', '1');
    });
  }

  function setMode(m) {
    if (m !== 'clean' && m !== 'safe') return;
    if (m === mode) return;
    mode = m;
    if (m === 'clean') {
      ensureClean();
    } else {
      var root = scanRoot();
      if (root) root.querySelectorAll('[data-cb-adhidden-sep]').forEach(function (el) {
        el.removeAttribute('data-cb-adhidden-sep');
      });
    }
  }

  function scan() {
    if (!enabled) return;
    var root = scanRoot();
    if (!root) return;

    // 1) 文本节点找徽标 → 上溯定位卡片 → 隐藏
    var walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
    while (walker.nextNode()) {
      var node = walker.currentNode;
      if (!isBadgeText(node.textContent)) continue;
      var badge = node.parentElement;
      if (!badge) continue;
      hide(findAdCard(badge));
    }

    // 2) 兜底：SDK 锚点附近卡片
    (rules.sdkAnchors || []).forEach(function (a) {
      root.querySelectorAll('[' + a + ']').forEach(function (el) {
        var card = el.closest('[class*="image-card"]') || el;
        hide(card);
      });
    });
  }

  function applyConfig(cfg) {
    if (cfg.rules && cfg.rules.version) rules = cfg.rules;
    if (typeof cfg.enabled === 'boolean') enabled = cfg.enabled;
    if (cfg.mode === 'clean' || cfg.mode === 'safe') setMode(cfg.mode);
  }

  function loadConfig() {
    try {
      chrome.storage.local.get(['rules', 'enabled', 'mode'], function (cfg) {
        if (chrome.runtime.lastError) return;
        applyConfig(cfg || {});
        if (!enabled) restoreAll();
        scan();
      });
    } catch (e) { /* ignore */ }
  }

  try {
    chrome.storage.onChanged.addListener(function (changes, area) {
      if (area !== 'local') return;
      var cfg = {};
      if (changes.rules) cfg.rules = changes.rules.newValue;
      if (changes.enabled) cfg.enabled = changes.enabled.newValue;
      if (changes.mode) cfg.mode = changes.mode.newValue;
      applyConfig(cfg);
      if (!enabled) restoreAll();
      scan();
    });
  } catch (e) { /* ignore */ }

  try {
    chrome.runtime.onMessage.addListener(function (msg, sender, sendResponse) {
      if (!msg) return;
      if (msg.type === 'GET_PAGE_STATS') {
        sendResponse({ pageCount: pageCount });
      } else if (msg.type === 'RESTORE_ALL') {
        restoreAll();
        sendResponse({ ok: true });
      }
    });
  } catch (e) { /* ignore */ }

  // SPA 动态插入 → MutationObserver + rAF 节流持续拦截
  var scheduled = false;
  function scheduleScan() {
    if (scheduled) return;
    scheduled = true;
    requestAnimationFrame(function () {
      scheduled = false;
      scan();
    });
  }

  function start() {
    loadConfig();
    var target = document.body || document.documentElement;
    var mo = new MutationObserver(scheduleScan);
    mo.observe(target, { childList: true, subtree: true });
  }

  if (document.body) start();
  else document.addEventListener('DOMContentLoaded', start);
})();
