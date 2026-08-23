// @ts-check
import eslint from '@eslint/js';
import eslintPluginPrettierRecommended from 'eslint-plugin-prettier/recommended';
import globals from 'globals';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  {
    ignores: ['eslint.config.mjs'],
  },
  eslint.configs.recommended,
  ...tseslint.configs.recommendedTypeChecked,
  eslintPluginPrettierRecommended,
  {
    languageOptions: {
      globals: {
        ...globals.node,
        ...globals.jest,
      },
      sourceType: 'commonjs',
      parserOptions: {
        projectService: {
          allowDefaultProject: ['scripts/*.js'],
        },
        tsconfigRootDir: import.meta.dirname,
      },
    },
  },
  {
    rules: {
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-floating-promises': 'warn',
      '@typescript-eslint/no-unsafe-argument': 'warn',
      '@typescript-eslint/no-unused-vars': ['error', { ignoreRestSiblings: true }],
      "prettier/prettier": ["error", { endOfLine: "auto" }],
    },
  },
  {
    files: ['scripts/**/*.js'],
    extends: [tseslint.configs.disableTypeChecked],
    rules: {
      '@typescript-eslint/no-require-imports': 'off',
    },
  },
  {
    // Processor tạo BullMQ Worker ngay tại module nạp nó. Chỉ worker.module.ts
    // được phép chạm vào, nếu không container `api` cũng tiêu thụ job.
    files: ['src/**/*.ts'],
    ignores: ['src/worker/worker.module.ts'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: ['**/*.processor'],
              message:
                'Processor chỉ được import từ src/worker/worker.module.ts. Import ở nơi khác sẽ khiến container api tiêu thụ job.',
            },
          ],
        },
      ],
    },
  },
);
