import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { withApiValidation, ValidationError, SecurityError } from '../lib/api-validation-middleware';

// Mock dependencies
jest.mock('../lib/production-logger', () => ({
  logger: {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
  },
}));

jest.mock('../lib/audit-logger', () => ({
  auditLogger: {
    logFromRequest: jest.fn(),
  },
  AuditEventType: {
    SECURITY_VIOLATION: 'SECURITY_VIOLATION',
  },
  AuditLogLevel: {
    WARNING: 'WARNING',
  },
}));

jest.mock('../lib/security', () => ({
  CSRFProtection: {
    validateRequest: jest.fn().mockResolvedValue(true),
  },
  RequestValidator: {
    validateOrigin: jest.fn().mockReturnValue(true),
  },
}));

describe('withApiValidation', () => {
  let mockHandler: jest.MockedFunction<any>;
  let mockRequest: Partial<NextRequest>;

  beforeEach(() => {
    mockHandler = jest.fn().mockResolvedValue(NextResponse.json({ success: true }));
    mockRequest = {
      method: 'GET',
      url: 'https://example.com/api/test',
      headers: new Headers({
        'content-type': 'application/json',
        'user-agent': 'test-agent',
      }),
      json: jest.fn().mockResolvedValue({}),
    };
  });

  describe('Basic Request Validation', () => {
    it('should pass valid requests through', async () => {
      const validatedHandler = withApiValidation(mockHandler);
      const response = await validatedHandler(mockRequest as NextRequest);

      expect(mockHandler).toHaveBeenCalled();
      expect(response.status).toBe(200);
    });

    it('should reject requests with invalid content type', async () => {
      mockRequest.method = 'POST';
      mockRequest.headers = new Headers({
        'content-type': 'text/plain',
      });

      const validatedHandler = withApiValidation(mockHandler, {
        allowedContentTypes: ['application/json'],
      });

      const response = await validatedHandler(mockRequest as NextRequest);
      expect(response.status).toBe(415);
      expect(mockHandler).not.toHaveBeenCalled();
    });

    it('should reject requests that are too large', async () => {
      mockRequest.headers = new Headers({
        'content-length': '1000000',
      });

      const validatedHandler = withApiValidation(mockHandler, {
        maxBodySize: 1000,
      });

      const response = await validatedHandler(mockRequest as NextRequest);
      expect(response.status).toBe(413);
      expect(mockHandler).not.toHaveBeenCalled();
    });
  });

  describe('Security Validation', () => {
    it('should detect suspicious user agents', async () => {
      mockRequest.headers = new Headers({
        'user-agent': 'sqlmap/1.0',
      });

      const validatedHandler = withApiValidation(mockHandler);
      const response = await validatedHandler(mockRequest as NextRequest);

      expect(response.status).toBe(403);
      expect(mockHandler).not.toHaveBeenCalled();
    });

    it('should detect XSS attempts in user agent', async () => {
      mockRequest.headers = new Headers({
        'user-agent': '<script>alert("xss")</script>',
      });

      const validatedHandler = withApiValidation(mockHandler);
      const response = await validatedHandler(mockRequest as NextRequest);

      expect(response.status).toBe(403);
      expect(mockHandler).not.toHaveBeenCalled();
    });

    it('should validate suspicious headers', async () => {
      mockRequest.headers = new Headers({
        'x-forwarded-for': '<script>alert(1)</script>',
      });

      const validatedHandler = withApiValidation(mockHandler);
      const response = await validatedHandler(mockRequest as NextRequest);

      expect(response.status).toBe(403);
      expect(mockHandler).not.toHaveBeenCalled();
    });
  });

  describe('Content Validation', () => {
    it('should validate request body against schema', async () => {
      const bodySchema = z.object({
        name: z.string().min(1),
        email: z.string().email(),
      });

      mockRequest.method = 'POST';
      mockRequest.json = jest.fn().mockResolvedValue({
        name: 'John Doe',
        email: 'john@example.com',
      });

      const validatedHandler = withApiValidation(mockHandler, {
        bodySchema,
      });

      const response = await validatedHandler(mockRequest as NextRequest);
      expect(response.status).toBe(200);
      expect(mockHandler).toHaveBeenCalled();
    });

    it('should reject invalid request body', async () => {
      const bodySchema = z.object({
        name: z.string().min(1),
        email: z.string().email(),
      });

      mockRequest.method = 'POST';
      mockRequest.json = jest.fn().mockResolvedValue({
        name: '',
        email: 'invalid-email',
      });

      const validatedHandler = withApiValidation(mockHandler, {
        bodySchema,
      });

      const response = await validatedHandler(mockRequest as NextRequest);
      expect(response.status).toBe(400);
      expect(mockHandler).not.toHaveBeenCalled();
    });

    it('should sanitize inputs when enabled', async () => {
      mockRequest.method = 'POST';
      mockRequest.json = jest.fn().mockResolvedValue({
        name: '<script>alert("xss")</script>John',
        description: 'Normal text',
      });

      const validatedHandler = withApiValidation(mockHandler, {
        sanitizeInputs: true,
      });

      await validatedHandler(mockRequest as NextRequest);

      // Check that the handler received sanitized data
      const callArgs = mockHandler.mock.calls[0];
      const request = callArgs[0];
      expect(request.validatedData.body.name).not.toContain('<script>');
      expect(request.validatedData.body.name).toContain('John');
    });

    it('should detect XSS attempts in request body', async () => {
      mockRequest.method = 'POST';
      mockRequest.json = jest.fn().mockResolvedValue({
        comment: '<script>alert("xss")</script>',
      });

      const validatedHandler = withApiValidation(mockHandler, {
        enableXSSProtection: true,
        sanitizeInputs: true,
      });

      const response = await validatedHandler(mockRequest as NextRequest);
      expect(response.status).toBe(403);
      expect(mockHandler).not.toHaveBeenCalled();
    });

    it('should detect SQL injection attempts in request body', async () => {
      mockRequest.method = 'POST';
      mockRequest.json = jest.fn().mockResolvedValue({
        search: "'; DROP TABLE users; --",
      });

      const validatedHandler = withApiValidation(mockHandler, {
        enableSQLInjectionProtection: true,
        sanitizeInputs: true,
      });

      const response = await validatedHandler(mockRequest as NextRequest);
      expect(response.status).toBe(403);
      expect(mockHandler).not.toHaveBeenCalled();
    });
  });

  describe('Query Parameter Validation', () => {
    it('should validate query parameters against schema', async () => {
      const querySchema = z.object({
        page: z.string().transform(val => parseInt(val) || 1),
        limit: z.string().transform(val => parseInt(val) || 10),
      });

      mockRequest.url = 'https://example.com/api/test?page=2&limit=20';

      const validatedHandler = withApiValidation(mockHandler, {
        querySchema,
      });

      const response = await validatedHandler(mockRequest as NextRequest);
      expect(response.status).toBe(200);
      expect(mockHandler).toHaveBeenCalled();
    });

    it('should sanitize query parameters', async () => {
      mockRequest.url = 'https://example.com/api/test?search=<script>alert(1)</script>test';

      const validatedHandler = withApiValidation(mockHandler, {
        sanitizeInputs: true,
      });

      await validatedHandler(mockRequest as NextRequest);

      const callArgs = mockHandler.mock.calls[0];
      const request = callArgs[0];
      expect(request.validatedData.query.search).not.toContain('<script>');
      expect(request.validatedData.query.search).toContain('test');
    });

    it('should detect XSS attempts in query parameters', async () => {
      mockRequest.url = 'https://example.com/api/test?search=<script>alert("xss")</script>';

      const validatedHandler = withApiValidation(mockHandler, {
        enableXSSProtection: true,
        sanitizeInputs: true,
      });

      const response = await validatedHandler(mockRequest as NextRequest);
      expect(response.status).toBe(403);
      expect(mockHandler).not.toHaveBeenCalled();
    });
  });

  describe('File Upload Validation', () => {
    it('should validate file uploads', async () => {
      const mockFile = new File(['test content'], 'test.jpg', { type: 'image/jpeg' });
      const mockFormData = new FormData();
      mockFormData.append('file', mockFile);
      mockFormData.append('description', 'Test file');

      mockRequest.method = 'POST';
      mockRequest.headers = new Headers({
        'content-type': 'multipart/form-data',
      });
      mockRequest.formData = jest.fn().mockResolvedValue(mockFormData);

      const validatedHandler = withApiValidation(mockHandler, {
        sanitizeInputs: true,
      });

      const response = await validatedHandler(mockRequest as NextRequest);
      expect(response.status).toBe(200);
      expect(mockHandler).toHaveBeenCalled();
    });

    it('should reject files that are too large', async () => {
      // Create a mock file that appears to be too large
      const mockFile = new File(['x'.repeat(1000000)], 'large.jpg', { type: 'image/jpeg' });
      Object.defineProperty(mockFile, 'size', { value: 20 * 1024 * 1024 }); // 20MB

      const mockFormData = new FormData();
      mockFormData.append('file', mockFile);

      mockRequest.method = 'POST';
      mockRequest.headers = new Headers({
        'content-type': 'multipart/form-data',
      });
      mockRequest.formData = jest.fn().mockResolvedValue(mockFormData);

      const validatedHandler = withApiValidation(mockHandler, {
        maxBodySize: 10 * 1024 * 1024, // 10MB limit
      });

      const response = await validatedHandler(mockRequest as NextRequest);
      expect(response.status).toBe(400);
      expect(mockHandler).not.toHaveBeenCalled();
    });

    it('should reject invalid file types', async () => {
      const mockFile = new File(['test content'], 'test.exe', { type: 'application/x-executable' });
      const mockFormData = new FormData();
      mockFormData.append('file', mockFile);

      mockRequest.method = 'POST';
      mockRequest.headers = new Headers({
        'content-type': 'multipart/form-data',
      });
      mockRequest.formData = jest.fn().mockResolvedValue(mockFormData);

      const validatedHandler = withApiValidation(mockHandler);

      const response = await validatedHandler(mockRequest as NextRequest);
      expect(response.status).toBe(400);
      expect(mockHandler).not.toHaveBeenCalled();
    });
  });

  describe('Error Handling', () => {
    it('should handle validation errors properly', async () => {
      const bodySchema = z.object({
        name: z.string().min(5),
      });

      mockRequest.method = 'POST';
      mockRequest.json = jest.fn().mockResolvedValue({
        name: 'Hi', // Too short
      });

      const validatedHandler = withApiValidation(mockHandler, {
        bodySchema,
      });

      const response = await validatedHandler(mockRequest as NextRequest);
      expect(response.status).toBe(400);

      const responseData = await response.json();
      expect(responseData.success).toBe(false);
      expect(responseData.error).toBe('Validation failed');
      expect(responseData.details).toBeDefined();
    });

    it('should handle security errors properly', async () => {
      mockRequest.headers = new Headers({
        'user-agent': 'sqlmap/1.0',
      });

      const validatedHandler = withApiValidation(mockHandler);
      const response = await validatedHandler(mockRequest as NextRequest);

      expect(response.status).toBe(403);

      const responseData = await response.json();
      expect(responseData.success).toBe(false);
      expect(responseData.error).toBe('Security validation failed');
    });

    it('should handle unexpected errors gracefully', async () => {
      mockHandler.mockRejectedValue(new Error('Unexpected error'));

      const validatedHandler = withApiValidation(mockHandler);
      const response = await validatedHandler(mockRequest as NextRequest);

      expect(response.status).toBe(500);

      const responseData = await response.json();
      expect(responseData.success).toBe(false);
      expect(responseData.error).toBe('Internal server error');
    });
  });

  describe('Configuration Options', () => {
    it('should respect custom configuration', async () => {
      const customConfig = {
        maxBodySize: 5000,
        enableCSRF: false,
        enableXSSProtection: false,
        sanitizeInputs: false,
        logRequests: false,
      };

      const validatedHandler = withApiValidation(mockHandler, customConfig);
      const response = await validatedHandler(mockRequest as NextRequest);

      expect(response.status).toBe(200);
      expect(mockHandler).toHaveBeenCalled();
    });

    it('should use default configuration when not specified', async () => {
      const validatedHandler = withApiValidation(mockHandler);
      const response = await validatedHandler(mockRequest as NextRequest);

      expect(response.status).toBe(200);
      expect(mockHandler).toHaveBeenCalled();
    });
  });

  describe('Performance and Edge Cases', () => {
    it('should handle empty request bodies', async () => {
      mockRequest.method = 'POST';
      mockRequest.json = jest.fn().mockResolvedValue({});

      const validatedHandler = withApiValidation(mockHandler);
      const response = await validatedHandler(mockRequest as NextRequest);

      expect(response.status).toBe(200);
      expect(mockHandler).toHaveBeenCalled();
    });

    it('should handle requests with no query parameters', async () => {
      mockRequest.url = 'https://example.com/api/test';

      const validatedHandler = withApiValidation(mockHandler);
      const response = await validatedHandler(mockRequest as NextRequest);

      expect(response.status).toBe(200);
      expect(mockHandler).toHaveBeenCalled();
    });

    it('should handle malformed JSON gracefully', async () => {
      mockRequest.method = 'POST';
      mockRequest.json = jest.fn().mockRejectedValue(new Error('Invalid JSON'));

      const validatedHandler = withApiValidation(mockHandler);
      const response = await validatedHandler(mockRequest as NextRequest);

      expect(response.status).toBe(500);
      expect(mockHandler).not.toHaveBeenCalled();
    });

    it('should handle very long property names', async () => {
      const longPropertyName = 'a'.repeat(200);
      const requestBody = {
        [longPropertyName]: 'value',
      };

      mockRequest.method = 'POST';
      mockRequest.json = jest.fn().mockResolvedValue(requestBody);

      const validatedHandler = withApiValidation(mockHandler, {
        sanitizeInputs: true,
      });

      const response = await validatedHandler(mockRequest as NextRequest);
      expect(response.status).toBe(400); // Should reject long property names
      expect(mockHandler).not.toHaveBeenCalled();
    });

    it('should handle nested objects with potential attacks', async () => {
      const nestedAttack = {
        user: {
          name: '<script>alert("xss")</script>',
          profile: {
            bio: "'; DROP TABLE users; --",
          },
        },
      };

      mockRequest.method = 'POST';
      mockRequest.json = jest.fn().mockResolvedValue(nestedAttack);

      const validatedHandler = withApiValidation(mockHandler, {
        enableXSSProtection: true,
        enableSQLInjectionProtection: true,
        sanitizeInputs: true,
      });

      const response = await validatedHandler(mockRequest as NextRequest);
      expect(response.status).toBe(403);
      expect(mockHandler).not.toHaveBeenCalled();
    });
  });
});