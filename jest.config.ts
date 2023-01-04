module.exports = {
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
  transformIgnorePatterns: ['node_modules/(?!(ol)/)'],
};
