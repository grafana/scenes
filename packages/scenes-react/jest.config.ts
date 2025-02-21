const esModules = ['ol', 'd3', 'd3-color', 'd3-interpolate', 'delaunator', 'internmap', 'robust-predicates'].join('|');

module.exports = {
  moduleNameMapper: {
    '@grafana/scenes': '<rootDir>/../scenes/src',
    '\\.css$': '<rootDir>/utils/test/__mocks__/style.ts',
    'react-inlinesvg': '<rootDir>/../scenes/utils/test/__mocks__/react-inlinesvg.tsx',
  },
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['./utils/setupTests.ts'],
  testMatch: ['<rootDir>/src/**/*.{spec,test,jest}.{js,jsx,ts,tsx}'],
  transform: {
    '^.+\\.(t|j)sx?$': [
      '@swc/jest',
      {
        sourceMaps: true,
        jsc: {
          parser: {
            syntax: 'typescript',
            tsx: true,
            decorators: false,
            dynamicImport: true,
          },
        },
      },
    ],
  },
  transformIgnorePatterns: [`<rootDir>/node_modules/(?!${esModules})`],
};
