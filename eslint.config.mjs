import angular from '@angular-eslint/eslint-plugin';
import angularTemplate from '@angular-eslint/eslint-plugin-template';
import templateParser from '@angular-eslint/template-parser';
import tsPlugin from '@typescript-eslint/eslint-plugin';
import tsParser from '@typescript-eslint/parser';
import prettier from 'eslint-config-prettier';

const typescriptParser = tsParser.default ?? tsParser;
const angularTemplateParser = templateParser.default ?? templateParser;

export default [
  { ignores: ['dist/**', '.angular/**', 'node_modules/**', 'coverage/**'] },
  {
    files: ['src/**/*.ts'],
    languageOptions: {
      parser: typescriptParser,
      // These syntax-only rules do not need a TypeScript program for the whole app.
      // Strict type checking remains enforced by the Angular production build.
      parserOptions: { ecmaVersion: 'latest', sourceType: 'module' },
    },
    plugins: { '@angular-eslint': angular, '@typescript-eslint': tsPlugin },
    rules: {
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
    },
  },
  {
    files: ['src/**/*.html'],
    languageOptions: { parser: angularTemplateParser },
    plugins: { '@angular-eslint/template': angularTemplate },
    rules: {},
  },
  prettier,
];
