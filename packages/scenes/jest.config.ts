const esModules = ['ol', 'd3', 'd3-color', 'd3-interpolate', 'delaunator', 'internmap', 'robust-predicates'].join('|');

module.exports = {
  moduleNameMapper: {
    // D3 exposes ESModules. To avoid issues with Jest, we need to point them to the CJS version.
    d3: '<rootDir>/../../node_modules/d3/dist/d3.min.js',
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
