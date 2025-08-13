/**
 * Jest configuration for real data tests
 * 
 * This configuration is specifically designed for testing that the application
 * works correctly with real data and doesn't contain mock data fallbacks.
 */

const nextJest = require('next/jest');

const createJestConfig = nextJest({
  // Provide the path to your Next.js app to load next.config.js and .env files
  dir: './',
});

// Add any custom config to be passed to Jest
const customJestConfig = {
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  moduleNameMapping: {
    // Handle module aliases (this will be automatically configured for you based on your tsconfig.json paths)
    '^@/(.*)$': '<rootDir>/src/$1',
    '^@mounasabet/(.*)$': '<rootDir>/../../packages/$1/src',
  },
  testEnvironment: 'jest-environment-jsdom',
  
  // Specific configuration for real data tests
  testMatch: [
    '<rootDir>/src/__tests__/mock-data-detection.test.ts',
    '<rootDir>/src/__tests__/integration/empty-database.test.tsx',
    '<rootDir>/src/__tests__/empty-state-handling.test.tsx',
    '<rootDir>/src/__tests__/error-scenarios.test.tsx'
  ],
  
  // Collect coverage from relevant files
  collectCoverageFrom: [
    'src/**/*.{js,jsx,ts,tsx}',
    '!src/**/*.d.ts',
    '!src/**/*.test.{js,jsx,ts,tsx}',
    '!src/**/*.spec.{js,jsx,ts,tsx}',
    '!src/__tests__/**',
    '!src/app/api/**/*.test.{js,jsx,ts,tsx}',
  ],
  
  // Coverage thresholds for real data tests
  coverageThreshold: {
    global: {
      branches: 70,
      functions: 70,
      lines: 70,
      statements: 70,
    },
  },
  
  // Timeout for tests (some integration tests might take longer)
  testTimeout: 30000,
  
  // Clear mocks between tests
  clearMocks: true,
  
  // Restore mocks after each test
  restoreMocks: true,
  
  // Verbose output for better debugging
  verbose: true,
  
  // Transform configuration
  transform: {
    '^.+\\.(js|jsx|ts|tsx)$': ['babel-jest', { presets: ['next/babel'] }],
  },
  
  // Module file extensions
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
  
  // Setup files
  setupFiles: ['<rootDir>/jest.setup.js'],
  
  // Global setup for database tests
  globalSetup: '<rootDir>/src/__tests__/setup/global-setup.js',
  globalTeardown: '<rootDir>/src/__tests__/setup/global-teardown.js',
  
  // Test environment options
  testEnvironmentOptions: {
    url: 'http://localhost:3000',
  },
  
  // Ignore patterns
  testPathIgnorePatterns: [
    '<rootDir>/.next/',
    '<rootDir>/node_modules/',
    '<rootDir>/e2e/',
  ],
  
  // Transform ignore patterns
  transformIgnorePatterns: [
    '/node_modules/',
    '^.+\\.module\\.(css|sass|scss)$',
  ],
  
  // Mock certain modules that might interfere with real data tests
  moduleNameMapping: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '^@mounasabet/(.*)$': '<rootDir>/../../packages/$1/src',
    // Mock external services that we don't want to hit during tests
    '^stripe$': '<rootDir>/src/__tests__/mocks/stripe.js',
    '^socket.io-client$': '<rootDir>/src/__tests__/mocks/socket.io-client.js',
  },
};

// createJestConfig is exported this way to ensure that next/jest can load the Next.js config which is async
module.exports = createJestConfig(customJestConfig);