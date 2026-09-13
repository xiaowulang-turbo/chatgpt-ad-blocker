'use strict';

// 国际化：按 chrome.i18n 填充 data-i18n / data-i18n-title 文案
function applyI18n() {
  document.querySelectorAll('[data-i18n]').forEach(function (el) {
    var msg = chrome.i18n.getMessage(el.getAttribute('data-i18n'));
    if (msg) el.textContent = msg;
  });
  document.querySelectorAll('[data-i18n-title]').forEach(function (el) {
    var msg = chrome.i18n.getMessage(el.getAttribute('data-i18n-title'));
    if (msg) el.setAttribute('title', msg);
  });
  var t = chrome.i18n.getMessage('popupTitle');
  if (t) document.title = t;
}

document.addEventListener('DOMContentLoaded', function () {
  applyI18n();

  var enabledEl = document.getElementById('enabled');
  var modeEls = document.querySelectorAll('input[name="mode"]');
  var totalEl = document.getElementById('total');
  var monthEl = document.getElementById('month');
  var pageEl = document.getElementById('page');

  // 读开关与模式
  chrome.storage.local.get(['enabled', 'mode'], function (cfg) {
    enabledEl.checked = cfg.enabled !== false;
    var mode = cfg.mode || 'clean';
    modeEls.forEach(function (r) { r.checked = (r.value === mode); });
  });

  // 读累计统计（向 SW 取实时值，与角标同源，避免 storage 滞后快照）
  chrome.runtime.sendMessage({ type: 'GET_STATS' }, function (res) {
    if (chrome.runtime.lastError || !res) return;
    totalEl.textContent = res.total;
    monthEl.textContent = res.monthCount;
  });

  // 读本页计数
  queryPageStats();

  enabledEl.addEventListener('change', function () {
    chrome.storage.local.set({ enabled: enabledEl.checked });
  });

  modeEls.forEach(function (r) {
    r.addEventListener('change', function () {
      if (r.checked) chrome.storage.local.set({ mode: r.value });
    });
  });

  function queryPageStats() {
    queryTab({ type: 'GET_PAGE_STATS' }, function (res) {
      if (res && typeof res.pageCount === 'number') pageEl.textContent = res.pageCount;
    });
  }

  // 不依赖 tab.url（其可见性需要 tabs 权限或宿主权限）；内容脚本只在 chatgpt.com 存在，
  // 目标页没有内容脚本时 sendMessage 会触发 lastError，静默忽略即可。
  function queryTab(msg, cb) {
    chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
      var tab = tabs[0];
      if (!tab || tab.id == null) return;
      chrome.tabs.sendMessage(tab.id, msg, function (res) {
        if (chrome.runtime.lastError) return;
        cb && cb(res);
      });
    });
  }
});
