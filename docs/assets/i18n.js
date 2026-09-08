/* 官网首页 i18n：data-i18n(纯文本) / data-i18n-html(含标签) / data-i18n-alt(图片alt)
   默认中文（HTML 内即中文），JS 根据浏览器语言自动切换，用户手动选择写入 localStorage。 */
(function () {
  'use strict';

  var DICT = {
    docTitle: {
      zh: 'ChatGPT 广告屏蔽 · 彻底无痕的对话广告拦截',
      en: 'ChatGPT Ad Blocker · Seamless Ad Blocking for ChatGPT'
    },
    metaDesc: {
      zh: '自动屏蔽 ChatGPT 对话流内嵌的广告卡片，彻底无痕、零误伤，规则远程热更。',
      en: 'Blocks embedded ad cards in ChatGPT conversations. Seamless, zero false positives, remote rule updates.'
    },
    appName: {
      zh: 'ChatGPT 广告屏蔽',
      en: 'ChatGPT Ad Blocker'
    },
    navFeatures: { zh: '功能', en: 'Features' },
    navInstall: { zh: '安装', en: 'Install' },
    navPrivacy: { zh: '隐私政策', en: 'Privacy Policy' },
    heroSub: {
      zh: '自动屏蔽对话流内嵌的广告卡片。彻底无痕、零误伤，改版后规则远程热更，一次安装长期生效。',
      en: 'Blocks embedded ad cards in conversations. Seamless, zero false positives, remote rule updates after layout changes.'
    },
    ctaInstall: { zh: '立即安装', en: 'Install now' },
    ctaSource: { zh: '查看源码', en: 'Source code' },
    secWhyTitle: { zh: '为什么选择它', en: 'Why choose it' },
    secWhySub: {
      zh: '专为 ChatGPT 对话场景打造的轻量拦截方案',
      en: 'A lightweight blocker purpose-built for ChatGPT conversations'
    },
    f1t: { zh: '精确屏蔽', en: 'Precise blocking' },
    f1d: {
      zh: '按徽标文本 + 卡片容器复合识别，不误伤代码块、图片、搜索结果，或正文含"广告"二字的普通句子。',
      en: 'Composite detection via badge text plus card container. Never blocks code blocks, images, search results, or sentences that merely mention ads.'
    },
    f2t: { zh: '彻底无痕', en: 'Seamless' },
    f2d: {
      zh: '连广告上方的分隔线一并隐藏，视觉上"广告从未存在"，也可切换为安全模式保留分隔线。',
      en: 'Hides the divider above the ad too, so it looks like the ad never existed. Switch to Safe mode to keep the divider.'
    },
    f3t: { zh: '持续生效', en: 'Always on' },
    f3d: {
      zh: '监听 SPA 动态插入，新回复中的广告自动清除，无需刷新页面。',
      en: 'Watches for SPA-injected ads and clears them automatically, no page refresh needed.'
    },
    f4t: { zh: '规则热更', en: 'Remote rule updates' },
    f4d: {
      zh: 'ChatGPT 改版后，规则纯数据远程更新，无需重新下载安装，自动恢复拦截。',
      en: 'Rules update as pure data from remote after ChatGPT changes its layout. No reinstall required.'
    },
    f5t: { zh: '零追踪', en: 'Zero tracking' },
    f5d: {
      zh: '不收集、不上传任何个人信息，所有设置与匿名计数仅存于您的浏览器。',
      en: 'Collects and uploads no personal data. All settings and anonymous counters stay in your browser.'
    },
    f6t: { zh: '中英双语', en: 'Bilingual UI' },
    f6d: {
      zh: '界面跟随浏览器语言自动切换中文 / 英文，海外用户开箱即用。',
      en: 'The interface follows your browser language (Chinese / English). Ready for users worldwide.'
    },
    secShotTitle: { zh: '使用效果', en: 'In action' },
    secShotSub: { zh: '一个开关，屏蔽所有内嵌广告卡片', en: 'One toggle blocks every embedded ad card' },
    shotAlt: { zh: 'ChatGPT 广告屏蔽前后对比', en: 'Before and after blocking ads in ChatGPT' },
    shotCaption: {
      zh: '左侧为屏蔽前，右侧为开启「彻底无痕」后的效果',
      en: 'Left: before. Right: after enabling Seamless mode.'
    },
    secInstTitle: { zh: '三步安装', en: 'Install in 3 steps' },
    secInstSub: { zh: '开发者模式加载，约 30 秒完成', en: 'Developer-mode loading, about 30 seconds' },
    s1t: { zh: '打开扩展管理页', en: 'Open the extensions page' },
    s1d: {
      zh: '在 Chrome 地址栏输入 <code>chrome://extensions</code>，右上角开启「开发者模式」',
      en: 'Type <code>chrome://extensions</code> in Chrome and enable "Developer mode" (top right).'
    },
    s2t: { zh: '加载已解压的扩展程序', en: 'Load unpacked extension' },
    s2d: {
      zh: '点击「加载已解压的扩展程序」，选择本仓库目录 <code>chatgpt-ad-blocker/</code>',
      en: 'Click "Load unpacked" and select this repo folder <code>chatgpt-ad-blocker/</code>.'
    },
    s3t: { zh: '开始使用', en: 'Start using' },
    s3d: {
      zh: '打开或刷新 <code>chatgpt.com</code> 会话页，广告卡片即被自动屏蔽',
      en: 'Open or refresh a <code>chatgpt.com</code> page — ad cards are blocked automatically.'
    },
    footerCopyright: { zh: '© 2026 ChatGPT 广告屏蔽 · 开源免费', en: '© 2026 ChatGPT Ad Blocker · Free & open source' }
  };

  var STORE_KEY = 'cbad-site-lang';

  function getSavedLang() {
    // URL 参数 ?lang=zh|en 优先（用于预览特定语言 / 分享链接）
    try {
      var q = new URLSearchParams(location.search).get('lang');
      if (q === 'zh' || q === 'en') return q;
    } catch (e) { /* ignore */ }
    try {
      var saved = localStorage.getItem(STORE_KEY);
      if (saved === 'zh' || saved === 'en') return saved;
    } catch (e) { /* ignore */ }
    var nav = (navigator.language || '').toLowerCase();
    return nav.indexOf('en') === 0 ? 'en' : 'zh';
  }

  function apply(lang) {
    document.documentElement.lang = lang === 'en' ? 'en' : 'zh-CN';
    if (DICT.docTitle) document.title = DICT.docTitle[lang];
    var meta = document.querySelector('meta[name="description"]');
    if (meta && DICT.metaDesc) meta.setAttribute('content', DICT.metaDesc[lang]);

    var texts = document.querySelectorAll('[data-i18n]');
    for (var i = 0; i < texts.length; i++) {
      var t = DICT[texts[i].getAttribute('data-i18n')];
      if (t) texts[i].textContent = t[lang];
    }
    var htmls = document.querySelectorAll('[data-i18n-html]');
    for (var j = 0; j < htmls.length; j++) {
      var h = DICT[htmls[j].getAttribute('data-i18n-html')];
      if (h) htmls[j].innerHTML = h[lang];
    }
    var alts = document.querySelectorAll('[data-i18n-alt]');
    for (var k = 0; k < alts.length; k++) {
      var a = DICT[alts[k].getAttribute('data-i18n-alt')];
      if (a) alts[k].setAttribute('alt', a[lang]);
    }
    var buttons = document.querySelectorAll('[data-lang-to]');
    for (var b = 0; b < buttons.length; b++) {
      buttons[b].classList.toggle('active', buttons[b].getAttribute('data-lang-to') === lang);
    }
  }

  var lang = getSavedLang();
  apply(lang);

  var switchers = document.querySelectorAll('[data-lang-to]');
  for (var c = 0; c < switchers.length; c++) {
    switchers[c].addEventListener('click', function () {
      var next = this.getAttribute('data-lang-to');
      try { localStorage.setItem(STORE_KEY, next); } catch (e) { /* ignore */ }
      apply(next);
    });
  }
})();
