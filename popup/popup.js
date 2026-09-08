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
  var restoreEl = document.getElementById('restore');

  // 读开关与模式
  chrome.storage.local.get(['enabled', 'mode'], function (cfg) {
    enabledEl.checked = cfg.enabled !== false;
    var mode = cfg.mode || 'clean';
    modeEls.forEach(function (r) { r.checked = (r.value === mode); });
  });

  // 读累计统计
  chrome.storage.sync.get('adBlockStats', function (data) {
    var s = data.adBlockStats || { total: 0, monthCount: 0 };
    totalEl.textContent = s.total;
    monthEl.textContent = s.monthCount;
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

  restoreEl.addEventListener('click', function () {
    queryTab({ type: 'RESTORE_ALL' }, function () { queryPageStats(); });
  });

  function queryPageStats() {
    queryTab({ type: 'GET_PAGE_STATS' }, function (res) {
      if (res && typeof res.pageCount === 'number') pageEl.textContent = res.pageCount;
    });
  }

  function queryTab(msg, cb) {
    chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
      var tab = tabs[0];
      if (!tab || !/^https:\/\/chatgpt\.com\//.test(tab.url || '')) return;
      chrome.tabs.sendMessage(tab.id, msg, function (res) {
        if (chrome.runtime.lastError) return;
        cb && cb(res);
      });
    });
  }
});
