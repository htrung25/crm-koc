const { defineConfig } = require('eslint/config');
const expoConfig = require('eslint-config-expo/flat');
const prettierConfig = require('eslint-config-prettier/flat');

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
      // Chỉ cho phép import chéo qua public API của feature, không thọc vào ruột
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: ['@/features/*/*'],
              message:
                'Import từ public API của feature (@/features/<name>) thay vì file bên trong.',
            },
          ],
        },
      ],
    },
  },
]);
