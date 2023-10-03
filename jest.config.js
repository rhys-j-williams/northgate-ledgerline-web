// Jest replaced Karma in LDG-412 (Oct 2023). Coverage thresholds are the Sonar gate numbers
// mirrored locally so a red build is caught before the push, not by the Jenkins Sonar stage.
// Do not lower them to get a branch green; raise a ticket with treasury-digital instead.
//
// Plain JS on purpose: a .ts config pulls ts-node into devDependencies for one file (LDG-1042).
/** @type {import('jest').Config} */
module.exports = {
  preset: 'jest-preset-angular',
  setupFilesAfterEnv: ['<rootDir>/src/test-setup.ts'],
  testEnvironment: 'jsdom',
  testMatch: ['<rootDir>/src/**/*.spec.ts'],
  moduleNameMapper: {
    '^@app/(.*)$': '<rootDir>/src/app/$1',
    '^@env/(.*)$': '<rootDir>/src/environments/$1'
  },
  transformIgnorePatterns: ['node_modules/(?!.*\\.mjs$)'],
  collectCoverageFrom: [
    'src/app/**/*.ts',
    '!src/app/**/*.spec.ts',
    '!src/app/**/index.ts',
    '!src/app/**/*.routes.ts',
    '!src/app/testing/**'
  ],
  coverageDirectory: 'coverage/ledgerline-web',
  coverageReporters: ['text-summary', 'lcov', 'cobertura'],
  coverageThreshold: {
    global: { statements: 58, branches: 45, functions: 55, lines: 58 }
  },
  reporters: ['default'],
  cacheDirectory: '<rootDir>/.jest-cache'
};
