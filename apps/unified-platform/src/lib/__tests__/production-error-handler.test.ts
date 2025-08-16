/**
 * @jest-environment node
 */
import { ProductionErrorHandler, errorHandler } from '../production-error-handler';
import { ApiResponseBuilder } from '../api-response';

// Mock NextRequest
const mockNextRequest = (url: string, options: any = {}) => ({
  url,
  method: options.method || 'GET',
  headers: new Map(Object.entries(options.headers || {})),
  json: async () => options.body ? JSON.parse(options.body) : {},
});

// Mock Sentry
jest.mock('@sentry/nextjs', () => ({
  setContext: jest.fn(),
  setUser: jest.fn(),
  setTags: jest.fn(),
  setExtra: jest.fn(),
  captureException: jest.fn(),
}));

// Mock logger
jest.mock('../production-logger', () => ({
  logger: {
    apiError: jest.fn(),
    componentError: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    setRequestId: jest.fn(),
  },
}));

describe('ProductionErrorHandler', () => {
  let handler: ProductionErrorHandler;
  let mockRequest: any;

  beforeEach(() => {
    handler = ProductionErrorHandler.getInstance();
    mockRequest = mockNextRequest('https://example.com/api/test', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'user-agent': 'test-agent',
        'authorization': 'Bearer secret-token',
      },
    });
    jest.clearAllMocks();
  });

  describe('handleAPIError', () => {
    it('should handle API errors with proper sanitization', () => {
      const error = new Error('Database connection failed');
      const response = handler.handleAPIError(error, mockRequest);

      expect(response.status).toBe(500);
      
      // Check that response is properly formatted
      const responseData = response.json();
      expect(responseData).toMatchObject({
        success: false,
        error: expect.any(String),
      });
    });

    it('should return appropriate status codes for different error types', () => {
      const testCases = [
        { error: new Error('unauthorized access'), expectedStatus: 401 },
        { error: new Error('access denied'), expectedStatus: 403 },
        { error: new Error('resource not found'), expectedStatus: 404 },
        { error: new Error('validation failed'), expectedStatus: 400 },
        { error: new Error('rate limit exceeded'), expectedStatus: 429 },
        { error: new Error('unknown error'), expectedStatus: 500 },
      ];

      testCases.forEach(({ error, expectedStatus }) => {
        const response = handler.handleAPIError(error, mockRequest);
        expect(response.status).toBe(expectedStatus);
      });
    });

    it('should sanitize sensitive information from headers', () => {
      const error = new Error('Test error');
      const response = handler.handleAPIError(error, mockRequest);

      // Verify that Sentry was called (mocked)
      const Sentry = require('@sentry/nextjs');
      expect(Sentry.setExtra).toHaveBeenCalled();
      
      // Check that the call doesn't contain sensitive headers
      const extraCalls = Sentry.setExtra.mock.calls;
      const contextCall = extraCalls.find(call => call[0] === 'context');
      if (contextCall) {
        const context = contextCall[1];
        expect(context.headers?.authorization).toBe('[REDACTED]');
      }
    });

    it('should include development details only in development mode', () => {
      const originalEnv = process.env.NODE_ENV;
      
      // Test production mode
      process.env.NODE_ENV = 'production';
      const error = new Error('Test error with sensitive info');
      let response = handler.handleAPIError(error, mockRequest);
      let responseData = response.json();
      expect(responseData.details).toBeUndefined();

      // Test development mode
      process.env.NODE_ENV = 'development';
      response = handler.handleAPIError(error, mockRequest);
      responseData = response.json();
      expect(responseData.details).toBeDefined();

      process.env.NODE_ENV = originalEnv;
    });
  });

  describe('handleClientError', () => {
    it('should handle client errors and return sanitized error info', () => {
      const error = new Error('Client-side error');
      const result = handler.handleClientError(error, {
        component: 'test-component',
      });

      expect(result).toMatchObject({
        message: expect.any(String),
        code: expect.any(String),
        type: 'Error',
        statusCode: expect.any(Number),
        timestamp: expect.any(String),
        requestId: expect.any(String),
      });
    });

    it('should sanitize error messages in production', () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'production';

      const error = new Error('Internal database connection string: postgres://user:pass@host');
      const result = handler.handleClientError(error);

      expect(result.message).not.toContain('postgres://');
      expect(result.message).toBe('Internal server error');

      process.env.NODE_ENV = originalEnv;
    });
  });

  describe('handleDatabaseError', () => {
    it('should handle database errors with query context', () => {
      const error = new Error('Connection timeout');
      const query = 'SELECT * FROM users WHERE id = $1';
      
      const result = handler.handleDatabaseError(error, query, {
        component: 'user-service',
      });

      expect(result).toMatchObject({
        message: expect.any(String),
        code: 'DATABASE_ERROR',
        type: 'Error',
        statusCode: 500,
        timestamp: expect.any(String),
        requestId: expect.any(String),
      });
    });

    it('should not expose query details in production', () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'production';

      const error = new Error('SELECT password FROM users failed');
      const result = handler.handleDatabaseError(error);

      expect(result.message).toBe('Database operation failed');
      expect(result.message).not.toContain('password');

      process.env.NODE_ENV = originalEnv;
    });
  });

  describe('handleValidationError', () => {
    it('should handle validation errors with details', () => {
      const error = new Error('Validation failed');
      const details = {
        email: 'Invalid email format',
        password: 'Password too short',
      };

      const response = handler.handleValidationError(error, details);
      expect(response.status).toBe(400);

      const responseData = response.json();
      expect(responseData).toMatchObject({
        success: false,
        code: 'VALIDATION_ERROR',
      });
    });

    it('should sanitize validation details', () => {
      const error = new Error('Validation failed');
      const details = {
        password: 'secret123',
        token: 'abc123',
        validField: 'safe-value',
      };

      const response = handler.handleValidationError(error, details);
      const responseData = response.json();
      
      expect(responseData.details.password).toBe('[REDACTED]');
      expect(responseData.details.token).toBe('[REDACTED]');
      expect(responseData.details.validField).toBe('safe-value');
    });
  });

  describe('wrapAPIRoute', () => {
    it('should wrap API routes and handle errors automatically', async () => {
      const mockHandler = jest.fn().mockRejectedValue(new Error('Handler error'));
      const wrappedHandler = handler.wrapAPIRoute(mockHandler);

      const response = await wrappedHandler(mockRequest);
      
      expect(response.status).toBe(500);
      expect(mockHandler).toHaveBeenCalledWith(mockRequest, undefined);
    });

    it('should pass through successful responses', async () => {
      const successResponse = ApiResponseBuilder.success({ data: 'test' });
      const mockHandler = jest.fn().mockResolvedValue(successResponse);
      const wrappedHandler = handler.wrapAPIRoute(mockHandler);

      const response = await wrappedHandler(mockRequest);
      
      expect(response).toBe(successResponse);
      expect(mockHandler).toHaveBeenCalledWith(mockRequest, undefined);
    });
  });

  describe('createErrorBoundaryHandler', () => {
    it('should create error boundary handlers with component context', () => {
      const boundaryHandler = handler.createErrorBoundaryHandler('test-component');
      const error = new Error('Component error');
      const errorInfo = { componentStack: 'Component stack trace' };

      // Should not throw
      expect(() => boundaryHandler(error, errorInfo)).not.toThrow();
    });
  });

  describe('data sanitization', () => {
    it('should sanitize nested objects', () => {
      const handler = ProductionErrorHandler.getInstance();
      const sensitiveData = {
        user: {
          name: 'John',
          password: 'secret123',
          profile: {
            email: 'john@example.com',
            api_key: 'key123',
          },
        },
        metadata: {
          token: 'token123',
          safe_field: 'safe_value',
        },
      };

      // Use reflection to access private method for testing
      const sanitizeData = (handler as any).sanitizeData.bind(handler);
      const sanitized = sanitizeData(sensitiveData);

      expect(sanitized.user.name).toBe('John');
      expect(sanitized.user.password).toBe('[REDACTED]');
      expect(sanitized.user.profile.email).toBe('john@example.com');
      expect(sanitized.user.profile.api_key).toBe('[REDACTED]');
      expect(sanitized.metadata.token).toBe('[REDACTED]');
      expect(sanitized.metadata.safe_field).toBe('safe_value');
    });

    it('should handle arrays and primitive values', () => {
      const handler = ProductionErrorHandler.getInstance();
      const sanitizeData = (handler as any).sanitizeData.bind(handler);

      expect(sanitizeData('string')).toBe('string');
      expect(sanitizeData(123)).toBe(123);
      expect(sanitizeData(null)).toBe(null);
      expect(sanitizeData([{ password: 'secret' }])).toEqual([{ password: '[REDACTED]' }]);
    });
  });
});

describe('Convenience functions', () => {
  it('should export convenience functions that work correctly', () => {
    const { handleAPIError, handleClientError } = require('../production-error-handler');
    
    expect(typeof handleAPIError).toBe('function');
    expect(typeof handleClientError).toBe('function');
    
    const error = new Error('Test error');
    const mockRequest = mockNextRequest('https://example.com/test');
    
    const apiResponse = handleAPIError(error, mockRequest);
    expect(apiResponse.status).toBeGreaterThanOrEqual(400);
    
    const clientError = handleClientError(error);
    expect(clientError).toHaveProperty('requestId');
    expect(clientError).toHaveProperty('timestamp');
  });
});