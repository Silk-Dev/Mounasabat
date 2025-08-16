/**
 * @jest-environment node
 */
import { NextRequest, NextResponse } from 'next/server';
import { withSecurity, createAPIResponse, sanitizeRequestBody } from '@/lib/api-security-middleware';
import { rateLimiter } from '@/lib/rate-limiter';
import { CSRFProtection } from '@/lib/security';

// Mock dependencies
jest.mock('@/lib/rate-limiter');
jest.mock('@/lib/security');
jest.mock('@/lib/audit-logger');
jest.mock('@/lib/production-logger');

const mockRateLimiter = rateLimiter as jest.Mocked<typeof rateLimiter>;
const mockCSRFProtection = CSRFProtection as jest.Mocked<typeof CSRFProtection>;

describe('API Security Middleware', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('createAPIResponse', () => {
    it('should create a successful response', () => {
      const response = createAPIResponse(true, { test: 'data' }, undefined, 'Success');
      
      expect(response.success).toBe(true);
      expect(response.data).toEqual({ test: 'data' });
      expect(response.message).toBe('Success');
      expect(response.timestamp).toBeDefined();
    });

    it('should create an error response', () => {
      const response = createAPIResponse(false, null, 'Test error', 'Error message');
      
      expect(response.success).toBe(false);
      expect(response.error).toBe('Test error');
      expect(response.message).toBe('Error message');
      expect(response.timestamp).toBeDefined();
    });
  });

  describe('sanitizeRequestBody', () => {
    it('should sanitize string values', () => {
      const input = '<script>alert("xss")</script>Hello World';
      const result = sanitizeRequestBody(input);
      
      expect(result).not.toContain('<script>');
      expect(result).toContain('Hello World');
    });

    it('should sanitize object properties', () => {
      const input = {
        name: '<script>alert("xss")</script>John',
        description: 'Safe description',
        nested: {
          value: 'javascript:alert("xss")'
        }
      };
      
      const result = sanitizeRequestBody(input);
      
      expect(result.name).not.toContain('<script>');
      expect(result.name).toContain('John');
      expect(result.description).toBe('Safe description');
      expect(result.nested.value).not.toContain('javascript:');
    });

    it('should sanitize arrays', () => {
      const input = ['<script>test</script>', 'safe value', 'javascript:alert()'];
      const result = sanitizeRequestBody(input);
      
      expect(result[0]).not.toContain('<script>');
      expect(result[1]).toBe('safe value');
      expect(result[2]).not.toContain('javascript:');
    });
  });

  describe('withSecurity middleware', () => {
    const mockHandler = jest.fn().mockResolvedValue(
      NextResponse.json({ success: true })
    );

    beforeEach(() => {
      mockHandler.mockClear();
      
      // Mock rate limiter to allow requests by default
      mockRateLimiter.createMiddleware.mockReturnValue(
        jest.fn().mockResolvedValue({
          allowed: true,
          remaining: 100,
          resetTime: Date.now() + 60000,
          totalHits: 1,
          headers: {
            'X-RateLimit-Limit': '100',
            'X-RateLimit-Remaining': '99',
            'X-RateLimit-Reset': '60',
          },
        })
      );

      // Mock CSRF validation to pass by default
      mockCSRFProtection.validateRequest.mockResolvedValue(true);
    });

    it('should allow requests when all security checks pass', async () => {
      const securedHandler = withSecurity(mockHandler, {
        rateLimitType: 'api',
        enableCSRF: true,
      });

      const request = new NextRequest('http://localhost:3000/api/test', {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          'origin': 'http://localhost:3000',
        },
      });

      const response = await securedHandler(request);
      
      expect(mockHandler).toHaveBeenCalledWith(expect.any(NextRequest));
      expect(response.status).toBe(200);
    });

    it('should block requests when rate limit is exceeded', async () => {
      // Mock rate limiter to deny requests
      mockRateLimiter.createMiddleware.mockReturnValue(
        jest.fn().mockResolvedValue({
          allowed: false,
          remaining: 0,
          resetTime: Date.now() + 60000,
          totalHits: 101,
          headers: {
            'X-RateLimit-Limit': '100',
            'X-RateLimit-Remaining': '0',
            'X-RateLimit-Reset': '60',
          },
        })
      );

      const securedHandler = withSecurity(mockHandler, {
        rateLimitType: 'api',
      });

      const request = new NextRequest('http://localhost:3000/api/test', {
        method: 'GET',
      });

      const response = await securedHandler(request);
      
      expect(mockHandler).not.toHaveBeenCalled();
      expect(response.status).toBe(429);
      
      const body = await response.json();
      expect(body.success).toBe(false);
      expect(body.error).toBe('Rate limit exceeded');
    });

    it('should block requests with invalid CSRF tokens', async () => {
      // Mock CSRF validation to fail
      mockCSRFProtection.validateRequest.mockResolvedValue(false);

      const securedHandler = withSecurity(mockHandler, {
        enableCSRF: true,
      });

      const request = new NextRequest('http://localhost:3000/api/test', {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
        },
      });

      const response = await securedHandler(request);
      
      expect(mockHandler).not.toHaveBeenCalled();
      expect(response.status).toBe(403);
      
      const body = await response.json();
      expect(body.success).toBe(false);
      expect(body.error).toBe('CSRF validation failed');
    });

    it('should validate request origin for state-changing requests', async () => {
      const securedHandler = withSecurity(mockHandler, {
        validateOrigin: true,
      });

      const request = new NextRequest('http://localhost:3000/api/test', {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          'origin': 'http://malicious-site.com',
        },
      });

      const response = await securedHandler(request);
      
      expect(mockHandler).not.toHaveBeenCalled();
      expect(response.status).toBe(403);
      
      const body = await response.json();
      expect(body.success).toBe(false);
      expect(body.error).toBe('Invalid origin');
    });

    it('should validate content type for POST requests', async () => {
      const securedHandler = withSecurity(mockHandler, {});

      const request = new NextRequest('http://localhost:3000/api/test', {
        method: 'POST',
        headers: {
          'content-type': 'text/html', // Invalid content type
        },
      });

      const response = await securedHandler(request);
      
      expect(mockHandler).not.toHaveBeenCalled();
      expect(response.status).toBe(400);
      
      const body = await response.json();
      expect(body.success).toBe(false);
      expect(body.error).toBe('Invalid content type');
    });

    it('should add security headers to responses', async () => {
      const securedHandler = withSecurity(mockHandler, {});

      const request = new NextRequest('http://localhost:3000/api/test', {
        method: 'GET',
      });

      const response = await securedHandler(request);
      
      expect(response.headers.get('X-Content-Type-Options')).toBe('nosniff');
      expect(response.headers.get('X-Frame-Options')).toBe('DENY');
      expect(response.headers.get('X-XSS-Protection')).toBe('1; mode=block');
      expect(response.headers.get('X-Request-ID')).toBeDefined();
    });

    it('should handle handler errors gracefully', async () => {
      const errorHandler = jest.fn().mockRejectedValue(new Error('Handler error'));
      const securedHandler = withSecurity(errorHandler, {});

      const request = new NextRequest('http://localhost:3000/api/test', {
        method: 'GET',
      });

      const response = await securedHandler(request);
      
      expect(response.status).toBe(500);
      
      const body = await response.json();
      expect(body.success).toBe(false);
      expect(body.error).toBe('Internal server error');
    });

    it('should skip CSRF validation for GET requests', async () => {
      const securedHandler = withSecurity(mockHandler, {
        enableCSRF: true,
      });

      const request = new NextRequest('http://localhost:3000/api/test', {
        method: 'GET',
      });

      const response = await securedHandler(request);
      
      expect(mockCSRFProtection.validateRequest).not.toHaveBeenCalled();
      expect(mockHandler).toHaveBeenCalled();
      expect(response.status).toBe(200);
    });

    it('should skip origin validation for GET requests', async () => {
      const securedHandler = withSecurity(mockHandler, {
        validateOrigin: true,
      });

      const request = new NextRequest('http://localhost:3000/api/test', {
        method: 'GET',
        headers: {
          'origin': 'http://malicious-site.com',
        },
      });

      const response = await securedHandler(request);
      
      expect(mockHandler).toHaveBeenCalled();
      expect(response.status).toBe(200);
    });
  });
});