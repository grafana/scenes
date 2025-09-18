// @ts-check
const path = require('path');
const grafanaConfig = require('@grafana/eslint-config/flat');
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
      'react/prop-types': 'off',
      '@typescript-eslint/explicit-member-accessibility': 'off',
    },
  },
];
