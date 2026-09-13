import js from '@eslint/js';

// 扩展运行在浏览器 + MV3 环境，手动声明用到的全局（不引入 globals 依赖）
const browserGlobals = {
  window: 'readonly',
  document: 'readonly',
  navigator: 'readonly',
  location: 'readonly',
  localStorage: 'readonly',
  MutationObserver: 'readonly',
  NodeFilter: 'readonly',
  requestAnimationFrame: 'readonly',
  setTimeout: 'readonly',
  clearTimeout: 'readonly',
  fetch: 'readonly',
  console: 'readonly',
  URLSearchParams: 'readonly',
  chrome: 'readonly'
};

export default [
  {
    ignores: ['node_modules/**', '.codebuddy/**', '*.zip']
  },
  js.configs.recommended,
  {
    files: ['**/*.js'],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'script',
      globals: browserGlobals
    },
    rules: {
      // 本项目多处使用 `catch (e) { /* ignore */ }` 做防御性忽略，无需消费 error 对象
      'no-unused-vars': ['error', { caughtErrors: 'none' }]
    }
  },
  {
    files: ['**/*.mjs'],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'module',
      globals: { ...browserGlobals, process: 'readonly', console: 'readonly' }
    }
  }
];
