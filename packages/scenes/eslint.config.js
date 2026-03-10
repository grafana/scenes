// @ts-check
const path = require('path');
const importPlugin = require('eslint-plugin-import');
const grafanaConfig = require('@grafana/eslint-config/flat');
const grafanaI18nPlugin = require('@grafana/i18n/eslint-plugin');
const { includeIgnoreFile } = require('@eslint/compat');

/**
 * @type {Array<import('eslint').Linter.Config>}
 */
module.exports = [
  includeIgnoreFile(path.resolve(__dirname, '../../.gitignore')),
  ...grafanaConfig,
  {
    files: ['src/**/*.{ts,tsx}'],
    rules: {
      '@typescript-eslint/explicit-member-accessibility': [
        'error',
        {
          accessibility: 'explicit',

          overrides: {
            // previous version of the plugin has an incompatibility that meant that class properties weren't linted.
            // matching that for now, and it can be updated later.
            properties: 'off',
          },
        },
      ],
    },
  },
  {
    files: ['src/**/*.{ts,tsx}'],
    ignores: ['src/**/*.{test,spec,story}.{ts,tsx}'],
    plugins: {
      import: importPlugin,
    },
    rules: {
      'import/no-extraneous-dependencies': ['error', { devDependencies: false, packageDir: './' }],
    },
  },
  {
    // Sections of codebase that have all translation markup issues fixed
    name: 'grafana/i18n-overrides',
    plugins: {
      '@grafana/i18n': grafanaI18nPlugin,
    },
    files: ['src/**/*.{ts,tsx,js,jsx}'],
    ignores: ['src/**/*.{test,spec,story}.{ts,tsx}'],
    rules: {
      '@grafana/i18n/no-untranslated-strings': ['error', { calleesToIgnore: ['^css$', 'use[A-Z].*'] }],
      '@grafana/i18n/no-translation-top-level': 'error',
    },
  },
];
