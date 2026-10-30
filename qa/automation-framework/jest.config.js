/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  rootDir: '.',
  testMatch: ['<rootDir>/tests/**/*.spec.ts'],
  moduleFileExtensions: ['ts', 'js', 'json'],
  transform: {
    '^.+\\.tsx?$': ['ts-jest', { tsconfig: '<rootDir>/tsconfig.json' }],
  },
  testTimeout: 20000,
  verbose: true,
  reporters: [
    'default',
    [
      '<rootDir>/../reporters/html-reporter.js',
      {
        outputFile: 'reports/api-test-report.html',
        pageTitle: 'Ella API — API Automation Test Execution Report',
      },
    ],
  ],
};
