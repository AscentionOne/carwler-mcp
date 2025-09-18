/**
 * Jest Test Setup
 * Global test configuration and setup
 */

import { beforeAll, afterAll, beforeEach, afterEach, jest } from '@jest/globals';

// Extend Jest matchers if needed
// import 'jest-extended';

// Global test timeout
jest.setTimeout(30000);

// Mock console methods for cleaner test output
const originalConsole = console;

beforeAll(() => {
  // Optionally suppress console output during tests
  // console.log = jest.fn();
  // console.error = jest.fn();
  // console.warn = jest.fn();
});

afterAll(() => {
  // Restore console methods
  console.log = originalConsole.log;
  console.error = originalConsole.error;
  console.warn = originalConsole.warn;
});

// Global test environment setup
beforeEach(() => {
  // Clear all mocks before each test
  jest.clearAllMocks();
});

afterEach(() => {
  // Cleanup after each test
  jest.restoreAllMocks();
});

// Environment variables for testing
process.env.NODE_ENV = 'test';
process.env.CACHE_DIR = '/tmp/test-cache';