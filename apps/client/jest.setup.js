// Optional: configure or set up a testing framework before each test.
// If you delete this file, remove `setupFilesAfterEnv` from `jest.config.js`

// Mock Next.js environment variables
process.env.NEXT_PUBLIC_APP_URL = 'http://localhost:3000'
process.env.AUTH_SECRET = 'test-secret'

// Mock console methods to reduce noise in tests
global.console = {
  ...console,
  log: jest.fn(),
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
}