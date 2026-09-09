# 商店素材 / Store Assets

本目录存放 Chrome Web Store 上架与官网展示所需的视觉素材。

## 目录结构

```
docs/assets/store/
├── screenshots/
│   ├── popup.png                 # popup 真实截图（2x）
│   ├── screenshot-compare.png    # ChatGPT 对话流屏蔽前后对比（1280×800，headless 截图）
│   ├── hero-ad-free.png          # AI 生成宣传图：盾牌守护无广告对话（1280×800）
│   ├── stats-dashboard.png       # AI 生成宣传图：统计弹窗仪表盘（1280×800）
│   ├── before-after.png          # AI 生成宣传图：屏蔽前后对比（1280×800）
│   ├── feature-popup-zh.png      # 功能总览场景·中文（1280×800，HTML mock 渲染）
│   ├── feature-popup-en.png      # 功能总览场景·English（1280×800）
│   ├── feature-chat-zh.png       # 对话流屏蔽效果·中文（1280×800）
│   └── feature-chat-en.png       # 对话流屏蔽效果·English（1280×800）
├── promo_small.png               # 小型宣传图（440×280）
└── promo_marquee.png             # 大型宣传图（1400×560）
```

## 重新生成方法

所有 PNG 都用 **headless Chrome 截图 HTML 模板**生成，文字零乱码、像素精确：

```bash
# 1. 启动本地服务（仓库根目录）
cd chatgpt-ad-blocker && python3 -m http.server 8766

# 2. 截图（另起终端）
CHROME="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"

# popup（2x 高清，窗口尺寸 280×360）
"$CHROME" --headless --disable-gpu --hide-scrollbars \
  --force-device-scale-factor=2 --window-size=280,360 \
  --screenshot=docs/assets/store/screenshots/popup.png \
  http://localhost:8766/popup/popup.html

# 对话流对比（1280×800，中文场景模板见 .temp/store-mock/）
"$CHROME" --headless --disable-gpu --hide-scrollbars \
  --window-size=1280,800 \
  --screenshot=docs/assets/store/screenshots/feature-chat-zh.png \
  http://localhost:8766/.temp/store-mock/scene-chat-zh.html

# 中英双语场景截图（功能总览 + 对话流，各中英两版）
for p in popup-zh popup-en chat-zh chat-en; do
  "$CHROME" --headless --disable-gpu --hide-scrollbars \
    --window-size=1280,800 \
    --screenshot=docs/assets/store/screenshots/feature-$p.png \
    "http://localhost:8766/.temp/store-mock/scene-$p.html"
done

# 宣传图 small（440×280）
"$CHROME" --headless --disable-gpu --hide-scrollbars \
  --window-size=440,280 \
  --screenshot=docs/assets/store/promo_small.png \
  http://localhost:8766/docs/_mock/promo_small.html

# 宣传图 marquee（1400×560）
"$CHROME" --headless --disable-gpu --hide-scrollbars \
  --window-size=1400,560 \
  --screenshot=docs/assets/store/promo_marquee.png \
  http://localhost:8766/docs/_mock/promo_marquee.html
```

> HTML 模板的当前版本已与截图同步，**修改模板后需重新截图**才能在商店生效。模板可放 `docs/_mock/` 或 `tools/promo-templates/` 自行维护。

## Chrome Web Store 上架素材清单

| 用途 | 文件 | 规格 | 必填 |
|---|---|---|---|
| 商店主截图（中文区） | `feature-popup-zh.png`、`feature-chat-zh.png`（另有 `popup.png`、`screenshot-compare.png`） | 1280×800 / 640×400，1-5 张 | ✅ |
| 商店主截图（English 区） | `feature-popup-en.png`、`feature-chat-en.png` | 1280×800 / 640×400，1-5 张 | ✅ |
| Small promo tile | `promo_small.png` | 440×280 | 推荐 |
| Marquee promo tile | `promo_marquee.png` | 1400×560 | 推荐 |
| 扩展图标 | `../icons/icon128.png` | 128×128 PNG | ✅ |
