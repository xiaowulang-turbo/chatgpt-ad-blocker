// 跨平台打包扩展为商店上传用的 zip（替代仅支持 *nix 的 package.sh）。
// 用法：npm run package
import { execFileSync } from 'node:child_process';
import { readFileSync, rmSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const manifest = JSON.parse(readFileSync(join(root, 'manifest.json'), 'utf8'));
const out = join(root, `chatgpt-ad-blocker-v${manifest.version}.zip`);

// 只打包扩展运行所需文件；排除官网(docs)、文档、远程热更数据源(rules.json 由插件运行时远程拉取)
const targets = ['manifest.json', 'background', 'content', 'popup', 'icons', '_locales'];

if (existsSync(out)) rmSync(out);

if (process.platform === 'win32') {
  const list = targets.map((t) => `'${t}'`).join(',');
  execFileSync('powershell', [
    '-NoProfile',
    '-Command',
    `Compress-Archive -Path ${list} -DestinationPath '${out}' -Force`
  ], { cwd: root, stdio: 'inherit' });
} else {
  execFileSync('zip', ['-r', out, ...targets, '-x', '*.DS_Store'], { cwd: root, stdio: 'inherit' });
}

console.log(`\n✓ 已生成 ${out}`);
console.log('下一步：chrome://extensions → 开发者模式 → 加载已解压的扩展程序，或上传至 Chrome Web Store');
