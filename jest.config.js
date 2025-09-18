/** @type {import('jest').Config} */
module.exports = {
  // Use ts-jest preset for TypeScript support
  preset: 'ts-jest',

  // Test environment
  testEnvironment: 'node',

  // Root directory for tests and modules
  rootDir: '.',

  // Test match patterns
  testMatch: [
    '<rootDir>/tests/**/*.test.ts',
    '<rootDir>/tests/**/*.spec.ts'
  ],

  // Module file extensions
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json'],

  // Transform files with ts-jest
  transform: {
    '^.+\\.ts$': ['ts-jest', {
      tsconfig: 'tsconfig.test.json'
    }]
  },

  // Coverage configuration
  collectCoverage: true,
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html'],
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/**/*.d.ts'
  ],

  // Coverage thresholds (80% target, but don't fail tests during development)
  coverageThreshold: {
    global: {
      branches: 60,
      functions: 60,
      lines: 60,
      statements: 60
    }
  },

  // Setup files
  setupFilesAfterEnv: ['<rootDir>/tests/setup.ts'],

  // Timeout for tests
  testTimeout: 30000,

  // Verbose output
  verbose: true,

  // Clear mocks between tests
  clearMocks: true,

  // Restore mocks after each test
  restoreMocks: true
};