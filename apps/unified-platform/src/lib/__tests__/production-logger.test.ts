import { logger } from '../production-logger';

// Mock Sentry
jest.mock('@sentry/nextjs', () => ({
  setContext: jest.fn(),
  setUser: jest.fn(),
  setTags: jest.fn(),
  captureException: jest.fn(),
  captureMessage: jest.fn(),
}));

// Mock Prisma
jest.mock('@prisma/client', () => ({
  PrismaClient: jest.fn().mockImplementation(() => ({
    errorLog: {
      findUnique: jest.fn().mockResolvedValue(null),
      create: jest.fn().mockResolvedValue({}),
      update: jest.fn().mockResolvedValue({}),
    },
    $disconnect: jest.fn().mockResolvedValue(undefined),
  })),
}));

describe('ProductionLogger Integration', () => {
  let originalEnv: string | undefined;

  beforeEach(() => {
    originalEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = 'development';
    jest.clearAllMocks();
  });

  afterEach(() => {
    process.env.NODE_ENV = originalEnv;
  });

  it('should be importable and have expected methods', () => {
    expect(logger).toBeDefined();
    expect(typeof logger.debug).toBe('function');
    expect(typeof logger.info).toBe('function');
    expect(typeof logger.warn).toBe('function');
    expect(typeof logger.error).toBe('function');
    expect(typeof logger.apiRequest).toBe('function');
    expect(typeof logger.apiError).toBe('function');
    expect(typeof logger.userAction).toBe('function');
    expect(typeof logger.componentError).toBe('function');
    expect(typeof logger.performanceWarning).toBe('function');
    expect(typeof logger.securityEvent).toBe('function');
    expect(typeof logger.databaseQuery).toBe('function');
  });

  it('should handle request ID management', () => {
    const customId = 'test-request-id';
    logger.setRequestId(customId);
    expect(logger.getRequestId()).toBe(customId);
  });

  it('should create child loggers', () => {
    const childLogger = logger.child({ component: 'test' });
    expect(childLogger).toBeDefined();
    expect(childLogger).not.toBe(logger);
  });

  it('should not throw errors when logging', () => {
    expect(() => {
      logger.debug('Test debug message');
      logger.info('Test info message');
      logger.warn('Test warning message');
      logger.error('Test error message', new Error('Test error'));
      logger.apiRequest('GET', '/test', 200, 100);
      logger.apiError('POST', '/test', 500, new Error('API Error'));
      logger.userAction('test_action', 'user123');
      logger.componentError('TestComponent', new Error('Component error'));
      logger.performanceWarning('test_metric', 2000, 1000);
      logger.securityEvent('test_event', 'medium');
      logger.databaseQuery('SELECT 1', 50);
    }).not.toThrow();
  });

  it('should handle convenience log functions', () => {
    const { log } = require('../production-logger');
    
    expect(() => {
      log.debug('Debug message');
      log.info('Info message');
      log.warn('Warning message');
      log.error('Error message', new Error('Test'));
    }).not.toThrow();
  });
});
