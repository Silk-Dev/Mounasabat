/**
 * @jest-environment node
 */
import { 
  withApiMiddleware, 
  withAuth, 
  withAdminAuth, 
  withValidation,
  createValidator,
  combineMiddleware 
} from '../api-middleware';
import { ApiResponseBuilder } from '../api-response';

// Mock NextRequest
const mockNextRequest = (url: string, options: any = {}) => ({
  url,
  method: options.method || 'GET',
  headers: new Map(Object.entries(options.headers || {})),
  json: async () => options.body ? JSON.parse(options.body) : {},
});

// Mock dependencies
jest.mock('../production-logger', () => ({
  logger: {
    apiRequest: jest.fn(),
    performanceWarning: jest.fn(),
    setRequestId: jest.fn(),
  },
}));

jest.mock('../production-error-handler', () => ({
  errorHandler: {
    handleAPIError: jest.fn().mockReturnValue({
      status: 500,
      json: () => ({ success: false, error: 'Internal server error' }),
    }),
  },
}));

jest.mock('../auth', () => ({
  auth: {
    api: {
      getSession: jest.fn(),
    },
  },
}));

describe('API Middleware', () => {
  let mockRequest: any;

  beforeEach(() => {
    mockRequest = mockNextRequest('https://example.com/api/test', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'user-agent': 'test-agent',
      },
    });
    jest.clearAllMocks();
  });

  describe('withApiMiddleware', () => {
    it('should wrap handlers and provide error handling', async () => {
      const mockHandler = jest.fn().mockResolvedValue(
        ApiResponseBuilder.success({ data: 'test' })
      );

      const wrappedHandler = withApiMiddleware(mockHandler, {
        component: 'test-api',
      });

      const response = await wrappedHandler(mockRequest);
      
      expect(mockHandler).toHaveBeenCalledWith(mockRequest, undefined);
      expect(response.status).toBe(200);
    });

    it('should handle errors thrown by handlers', async () => {
      const mockHandler = jest.fn().mockRejectedValue(new Error('Handler error'));
      const wrappedHandler = withApiMiddleware(mockHandler);

      const response = await wrappedHandler(mockRequest);
      
      expect(response.status).toBe(500);
    });

    it('should log requests when enabled', async () => {
      const mockHandler = jest.fn().mockResolvedValue(
        ApiResponseBuilder.success({ data: 'test' })
      );

      const wrappedHandler = withApiMiddleware(mockHandler, {
        logRequests: true,
      });

      await wrappedHandler(mockRequest);
      
      const { logger } = require('../production-logger');
      expect(logger.apiRequest).toHaveBeenCalled();
    });

    it('should not log requests when disabled', async () => {
      const mockHandler = jest.fn().mockResolvedValue(
        ApiResponseBuilder.success({ data: 'test' })
      );

      const wrappedHandler = withApiMiddleware(mockHandler, {
        logRequests: false,
      });

      await wrappedHandler(mockRequest);
      
      const { logger } = require('../production-logger');
      expect(logger.apiRequest).not.toHaveBeenCalled();
    });

    it('should log performance warnings for slow requests', async () => {
      const mockHandler = jest.fn().mockImplementation(
        () => new Promise(resolve => 
          setTimeout(() => resolve(ApiResponseBuilder.success({ data: 'test' })), 2100)
        )
      );

      const wrappedHandler = withApiMiddleware(mockHandler);
      await wrappedHandler(mockRequest);
      
      const { logger } = require('../production-logger');
      expect(logger.performanceWarning).toHaveBeenCalled();
    });
  });

  describe('withAuth', () => {
    it('should allow authenticated requests', async () => {
      const { auth } = require('../auth');
      auth.api.getSession.mockResolvedValue({
        user: { id: '1', role: 'user' },
      });

      const mockHandler = jest.fn().mockResolvedValue(
        ApiResponseBuilder.success({ data: 'authenticated' })
      );

      const wrappedHandler = withAuth(mockHandler);
      const response = await wrappedHandler(mockRequest);

      expect(response.status).toBe(200);
      expect(mockHandler).toHaveBeenCalled();
    });

    it('should reject unauthenticated requests', async () => {
      const { auth } = require('../auth');
      auth.api.getSession.mockResolvedValue(null);

      const mockHandler = jest.fn();
      const wrappedHandler = withAuth(mockHandler);
      const response = await wrappedHandler(mockRequest);

      expect(response.status).toBe(401);
      expect(mockHandler).not.toHaveBeenCalled();
    });

    it('should check role requirements', async () => {
      const { auth } = require('../auth');
      auth.api.getSession.mockResolvedValue({
        user: { id: '1', role: 'user' },
      });

      const mockHandler = jest.fn();
      const wrappedHandler = withAuth(mockHandler, {
        roles: ['admin'],
      });
      const response = await wrappedHandler(mockRequest);

      expect(response.status).toBe(403);
      expect(mockHandler).not.toHaveBeenCalled();
    });

    it('should allow requests with correct roles', async () => {
      const { auth } = require('../auth');
      auth.api.getSession.mockResolvedValue({
        user: { id: '1', role: 'admin' },
      });

      const mockHandler = jest.fn().mockResolvedValue(
        ApiResponseBuilder.success({ data: 'admin-only' })
      );

      const wrappedHandler = withAuth(mockHandler, {
        roles: ['admin'],
      });
      const response = await wrappedHandler(mockRequest);

      expect(response.status).toBe(200);
      expect(mockHandler).toHaveBeenCalled();
    });
  });

  describe('withAdminAuth', () => {
    it('should only allow admin users', async () => {
      const { auth } = require('../auth');
      auth.api.getSession.mockResolvedValue({
        user: { id: '1', role: 'user' },
      });

      const mockHandler = jest.fn();
      const wrappedHandler = withAdminAuth(mockHandler);
      const response = await wrappedHandler(mockRequest);

      expect(response.status).toBe(403);
      expect(mockHandler).not.toHaveBeenCalled();
    });

    it('should allow admin users', async () => {
      const { auth } = require('../auth');
      auth.api.getSession.mockResolvedValue({
        user: { id: '1', role: 'admin' },
      });

      const mockHandler = jest.fn().mockResolvedValue(
        ApiResponseBuilder.success({ data: 'admin-data' })
      );

      const wrappedHandler = withAdminAuth(mockHandler);
      const response = await wrappedHandler(mockRequest);

      expect(response.status).toBe(200);
      expect(mockHandler).toHaveBeenCalled();
    });
  });

  describe('withValidation', () => {
    it('should validate request body', async () => {
      const validator = jest.fn().mockReturnValue({
        isValid: true,
      });

      const mockHandler = jest.fn().mockResolvedValue(
        ApiResponseBuilder.success({ data: 'validated' })
      );

      // Mock request with JSON body
      const requestWithBody = mockNextRequest('https://example.com/api/test', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ name: 'test' }),
      });

      const wrappedHandler = withValidation(mockHandler, validator);
      const response = await wrappedHandler(requestWithBody);

      expect(validator).toHaveBeenCalledWith({ name: 'test' });
      expect(response.status).toBe(200);
      expect(mockHandler).toHaveBeenCalled();
    });

    it('should reject invalid requests', async () => {
      const validator = jest.fn().mockReturnValue({
        isValid: false,
        errors: ['Name is required'],
      });

      const mockHandler = jest.fn();

      const requestWithBody = mockNextRequest('https://example.com/api/test', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({}),
      });

      const wrappedHandler = withValidation(mockHandler, validator);
      const response = await wrappedHandler(requestWithBody);

      expect(response.status).toBe(400);
      expect(mockHandler).not.toHaveBeenCalled();
    });

    it('should handle invalid JSON', async () => {
      const validator = jest.fn();
      const mockHandler = jest.fn();

      const requestWithInvalidBody = mockNextRequest('https://example.com/api/test', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: 'invalid json',
      });

      const wrappedHandler = withValidation(mockHandler, validator);
      const response = await wrappedHandler(requestWithInvalidBody);

      expect(response.status).toBe(400);
      expect(validator).not.toHaveBeenCalled();
      expect(mockHandler).not.toHaveBeenCalled();
    });
  });

  describe('createValidator', () => {
    it('should create validators for required fields', () => {
      const validator = createValidator(['name', 'email']);

      const validData = { name: 'John', email: 'john@example.com' };
      const invalidData = { name: 'John' }; // missing email

      expect(validator(validData)).toEqual({ isValid: true });
      expect(validator(invalidData)).toEqual({
        isValid: false,
        errors: ["Field 'email' is required"],
      });
    });

    it('should handle empty strings as invalid', () => {
      const validator = createValidator(['name']);

      const invalidData = { name: '   ' }; // whitespace only

      expect(validator(invalidData)).toEqual({
        isValid: false,
        errors: ["Field 'name' is required"],
      });
    });
  });

  describe('combineMiddleware', () => {
    it('should combine multiple middleware functions', async () => {
      const { auth } = require('../auth');
      auth.api.getSession.mockResolvedValue({
        user: { id: '1', role: 'admin' },
      });

      const validator = createValidator(['name']);
      const mockHandler = jest.fn().mockResolvedValue(
        ApiResponseBuilder.success({ data: 'combined' })
      );

      const combinedMiddleware = combineMiddleware(
        (handler) => withAuth(handler),
        (handler) => withValidation(handler, validator)
      );

      const wrappedHandler = combinedMiddleware(mockHandler);

      const requestWithBody = mockNextRequest('https://example.com/api/test', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ name: 'test' }),
      });

      const response = await wrappedHandler(requestWithBody);

      expect(response.status).toBe(200);
      expect(mockHandler).toHaveBeenCalled();
    });

    it('should fail at the first middleware that rejects', async () => {
      const { auth } = require('../auth');
      auth.api.getSession.mockResolvedValue(null); // No auth

      const validator = createValidator(['name']);
      const mockHandler = jest.fn();

      const combinedMiddleware = combineMiddleware(
        (handler) => withAuth(handler),
        (handler) => withValidation(handler, validator)
      );

      const wrappedHandler = combinedMiddleware(mockHandler);

      const requestWithBody = mockNextRequest('https://example.com/api/test', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ name: 'test' }),
      });

      const response = await wrappedHandler(requestWithBody);

      expect(response.status).toBe(401); // Auth failed first
      expect(mockHandler).not.toHaveBeenCalled();
    });
  });
});