#!/usr/bin/env bash
# 一键打包 ChatGPT 广告屏蔽插件为 zip
# 用途：Chrome Web Store 上传 / 本地开发者模式分发
set -euo pipefail

cd "$(dirname "$0")"

VERSION=$(python3 -c "import json; print(json.load(open('manifest.json'))['version'])")
OUT="chatgpt-ad-blocker-v${VERSION}.zip"

# 只打包扩展运行所需文件；排除官网(docs)、文档、远程热更数据源(rules.json 由插件运行时远程拉取)
zip -r "$OUT" \
  manifest.json \
  background \
  content \
  popup \
  icons \
  _locales \
  -x "*.DS_Store" >/dev/null

echo "✓ 已生成 $OUT ($(du -h "$OUT" | cut -f1))"
echo ""
echo "下一步："
echo "  · 本地加载：chrome://extensions → 开发者模式 → 加载已解压的扩展程序"
echo "  · 商店上传：python3 ~/.codebuddy/skills/chrome-webstore-manager/scripts/cws_api.py upload --zip $OUT \\"
echo "              --publisher-id \$CWS_PUBLISHER_ID --item-id \$CWS_ITEM_ID"
