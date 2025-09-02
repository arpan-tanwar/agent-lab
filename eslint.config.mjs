// @ts-check
import eslint from '@eslint/js';
import ts from 'typescript-eslint';
import prettier from 'eslint-config-prettier';

export default [
  {
    ignores: [
      'dist/**',
      'node_modules/**',
      'apps/ui/.next/**',
      'build/**',
      'coverage/**',
      'drizzle/**',
    ],
  },
  eslint.configs.recommended,
  ...ts.configs.recommended,
  prettier,
  {
    files: ['**/*.ts'],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'module',
      parser: ts.parser,
      parserOptions: { project: false },
    },
    rules: {},
  },
];
