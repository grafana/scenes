// @ts-check
const path = require('path');
const { defineConfig } = require('eslint/config');
const grafanaConfig = require('@grafana/eslint-config/flat');
const { includeIgnoreFile } = require('@eslint/compat');

/**
 * @type {Array<import('eslint').Linter.Config>}
 */
module.exports = [
  includeIgnoreFile(path.resolve(__dirname, '../../.gitignore')),
  grafanaConfig,
  {
    files: ['src/**/*.{ts,tsx}'],
    rules: {
      '@typescript-eslint/explicit-member-accessibility': [
        'error',
        {
          accessibility: 'explicit',
        },
      ],
    },
  },
];
