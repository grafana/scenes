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
];
