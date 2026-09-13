// 将打包产物发布为 GitHub Release（tag = v<manifest.version>）。
// 前置：已安装并登录 GitHub CLI（gh auth login）。
// 用法：npm run release
import { execFileSync } from 'node:child_process';
import { readFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const run = (cmd, args, opts) => execFileSync(cmd, args, { cwd: root, stdio: 'inherit', ...opts });
const probe = (cmd, args) => {
  try { execFileSync(cmd, args, { cwd: root, stdio: 'ignore' }); return true; }
  catch { return false; }
};

const manifest = JSON.parse(readFileSync(join(root, 'manifest.json'), 'utf8'));
const tag = `v${manifest.version}`;
const zip = join(root, `chatgpt-ad-blocker-v${manifest.version}.zip`);

// 1) 前置校验：gh 已登录
if (!probe('gh', ['auth', 'status'])) {
  console.error('✗ 未登录 GitHub CLI，请先运行：gh auth login');
  process.exit(1);
}

// 2) 提示本地状态（发布 tag 指向远端分支 HEAD，未推送的提交不会包含在 release 中）
if (execFileSync('git', ['status', '--porcelain'], { cwd: root }).toString().trim()) {
  console.warn('⚠ 工作区有未提交改动，release 将基于远端分支 HEAD 创建');
}

// 3) 打包
run(process.execPath, [join(root, 'tools', 'pack.mjs')]);
if (!existsSync(zip)) {
  console.error(`✗ 未找到打包产物：${zip}`);
  process.exit(1);
}

// 4) 创建或更新 Release 并上传 zip
if (probe('gh', ['release', 'view', tag])) {
  console.log(`→ Release ${tag} 已存在，覆盖上传 zip`);
  run('gh', ['release', 'upload', tag, zip, '--clobber']);
} else {
  console.log(`→ 创建 Release ${tag}`);
  run('gh', ['release', 'create', tag, zip, '--title', tag, '--generate-notes']);
}

console.log(`\n✓ 已发布：https://github.com/xiaowulang-turbo/chatgpt-ad-blocker/releases/tag/${tag}`);
