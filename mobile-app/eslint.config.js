/* global __dirname */
const { readdirSync } = require('node:fs');
const path = require('node:path');
const { defineConfig } = require('eslint/config');
const expoConfig = require('eslint-config-expo/flat');
const prettierConfig = require('eslint-config-prettier/flat');

function importRules(feature) {
  const ownFeature = feature?.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return [
    'error',
    {
      patterns: [
        {
          regex: '^\\.{1,2}(?:/|$)',
          message: 'Dùng alias @/ cho import và re-export nội bộ.',
        },
        {
          regex: ownFeature
            ? `^@/features/(?!${ownFeature}/)[^/]+/`
            : '^@/features/[^/]+/',
          message:
            'Import chéo feature phải qua public API (@/features/<name>).',
        },
      ],
    },
  ];
}

const features = readdirSync(path.join(__dirname, 'src/features'), {
  withFileTypes: true,
}).filter((entry) => entry.isDirectory());

module.exports = defineConfig([
  expoConfig,
  prettierConfig,
  {
    ignores: ['dist/*', '.expo/*', 'node_modules/*', 'scripts/*'],
  },
  {
    rules: {
      // axios/i18next là default export có kèm named export cùng tên — cảnh báo này chỉ là nhiễu
      'import/no-named-as-default-member': 'off',
      'no-restricted-imports': importRules(),
    },
  },
  // Trong cùng feature được trỏ thẳng tới file bằng alias, tránh tự import barrel.
  ...features.map(({ name }) => ({
    files: [`src/features/${name}/**/*.{ts,tsx}`],
    rules: { 'no-restricted-imports': importRules(name) },
  })),
]);
