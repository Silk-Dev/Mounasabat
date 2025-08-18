# Security Implementation Guide

This document outlines the comprehensive security measures implemented in the unified booking platform to ensure production readiness.

## Overview

The security implementation includes:
- Rate limiting for all API endpoints
- CSRF protection for state-changing requests
- Input validation and sanitization
- Authentication and authorization checks
- Security headers and CORS configuration
- Request origin validation
- Content type validation
- Request size limits
- Comprehensive audit logging

## Rate Limiting

### Implementation
- **Library**: Custom rate limiter with Redis backend (fallback to memory)
- **Storage**: Redis for distributed rate limiting, in-memory for development
- **Granularity**: Per-IP and per-user rate limiting

### Rate Limit Configurations

```typescript
export const rateLimitConfigs = {
  search: { windowMs: 60000, maxRequests: 100 },      // 100 requests/minute
  booking: { windowMs: 300000, maxRequests: 10 },     // 10 requests/5 minutes
  auth: { windowMs: 900000, maxRequests: 5 },         // 5 requests/15 minutes
  api: { windowMs: 60000, maxRequests: 1000 },        // 1000 requests/minute
  upload: { windowMs: 300000, maxRequests: 20 },      // 20 requests/5 minutes
  admin: { windowMs: 60000, maxRequests: 200 },       // 200 requests/minute
};
```

### Usage
```typescript
// In API routes
export const POST = withSecurity(handler, {
  rateLimitType: 'booking',
  // other config...
});
```

## CSRF Protection

### Implementation
- **Token Generation**: Cryptographically secure random tokens
- **Storage**: HttpOnly cookies for tokens, headers for secrets
- **Validation**: Server-side validation with timing-safe comparison
- **Scope**: Applied to all state-changing requests (POST, PUT, DELETE, PATCH)

### Client-Side Usage
```typescript
// Using the hook
const { getHeaders } = useCSRFToken();

// Making secure requests
const { securePost } = useSecureAPI();
await securePost('/api/endpoint', data);

// Using secure form component
<SecureForm onSubmit={handleSubmit}>
  {/* form content */}
</SecureForm>
```

### Server-Side Validation
```typescript
// Automatic validation in middleware
export const POST = withSecurity(handler, {
  enableCSRF: true,
  // other config...
});
```

## Input Validation and Sanitization

### Client-Side Sanitization
```typescript
// Automatic sanitization in secure components
<SecureInput sanitize={true} />
<SecureTextarea sanitize={true} />
```

### Server-Side Validation
```typescript
// Using Zod schemas with sanitization
const schema = z.object({
  name: z.string().transform(InputSanitizer.sanitizeGeneral),
  description: z.string().transform(InputSanitizer.sanitizeHtml),
});

// Automatic sanitization in middleware
const sanitizedData = sanitizeRequestBody(rawData);
```

### Sanitization Features
- **XSS Prevention**: Removes script tags, javascript: URLs, event handlers
- **SQL Injection Prevention**: Escapes SQL metacharacters
- **Path Traversal Prevention**: Removes directory traversal sequences
- **HTML Sanitization**: Removes dangerous HTML tags and attributes

## Authentication and Authorization

### Route Protection
```typescript
// Middleware configuration
const protectedRoutes = {
  '/admin': 'admin',
  '/provider': 'provider',
  '/customer/account': 'customer',
};
```

### API Endpoint Security
```typescript
// Role-based access control
export const POST = withSecurity(handler, {
  requireAuth: true,
  allowedRoles: ['admin', 'provider'],
});
```

## Security Headers

### Implemented Headers
- **Content-Security-Policy**: Prevents XSS and code injection
- **Strict-Transport-Security**: Enforces HTTPS
- **X-Frame-Options**: Prevents clickjacking
- **X-Content-Type-Options**: Prevents MIME sniffing
- **X-XSS-Protection**: Browser XSS protection
- **Referrer-Policy**: Controls referrer information
- **Permissions-Policy**: Controls browser features

### CORS Configuration
```typescript
// Next.js configuration
headers: [
  {
    source: '/api/(.*)',
    headers: [
      {
        key: 'Access-Control-Allow-Origin',
        value: process.env.NODE_ENV === 'production' 
          ? process.env.NEXTAUTH_URL 
          : 'http://localhost:3000',
      },
      // ... other CORS headers
    ],
  },
]
```

## Request Validation

### Origin Validation
- **Scope**: State-changing requests (POST, PUT, DELETE, PATCH)
- **Method**: Validates Origin and Referer headers
- **Allowed Origins**: Configurable list of trusted domains

### Content Type Validation
- **Allowed Types**: application/json, application/x-www-form-urlencoded, multipart/form-data
- **Scope**: POST, PUT, PATCH requests
- **Enforcement**: Automatic rejection of invalid content types

### Request Size Limits
- **Default Limit**: 10MB for most endpoints
- **Configurable**: Per-endpoint size limits
- **Enforcement**: Validates Content-Length header and request body size

## Security Middleware

### Usage Patterns
```typescript
// Public endpoints (search, etc.)
export const GET = withPublicSecurity(handler);

// Authenticated endpoints
export const POST = withAuthSecurity(handler);

// Admin endpoints
export const PUT = withAdminSecurity(handler);

// Provider endpoints
export const DELETE = withProviderSecurity(handler);

// Booking endpoints
export const POST = withBookingSecurity(handler);

// Custom configuration
export const POST = withSecurity(handler, {
  rateLimitType: 'api',
  requireAuth: true,
  allowedRoles: ['admin'],
  enableCSRF: true,
  validateOrigin: true,
  maxRequestSize: 5 * 1024 * 1024, // 5MB
  sanitizeInput: true,
  logRequests: true,
});
```

### Middleware Features
- **Rate Limiting**: Configurable per endpoint type
- **CSRF Protection**: Automatic token validation
- **Origin Validation**: Prevents cross-origin attacks
- **Input Sanitization**: Automatic request body sanitization
- **Error Handling**: Standardized error responses
- **Audit Logging**: Comprehensive security event logging
- **Request Tracking**: Unique request IDs for tracing

## Audit Logging

### Security Events Logged
- Rate limit violations
- CSRF validation failures
- Invalid origin attempts
- Authentication failures
- Authorization violations
- Input validation errors
- Security middleware errors

### Log Format
```typescript
interface SecurityAuditLog {
  level: 'info' | 'warning' | 'error';
  eventType: AuditEventType;
  action: string;
  description: string;
  success: boolean;
  userId?: string;
  ipAddress: string;
  userAgent: string;
  requestId: string;
  metadata?: Record<string, any>;
  timestamp: Date;
}
```

## Error Handling

### Standardized API Responses
```typescript
interface APIResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  timestamp: string;
  requestId?: string;
}
```

### Error Types
- **400 Bad Request**: Invalid input, validation errors
- **401 Unauthorized**: Authentication required
- **403 Forbidden**: CSRF validation failed, invalid origin, insufficient permissions
- **413 Request Too Large**: Request size exceeds limits
- **429 Too Many Requests**: Rate limit exceeded
- **500 Internal Server Error**: Unexpected errors

## Testing

### Security Test Coverage
- Rate limiting functionality
- CSRF token generation and validation
- Input sanitization
- Origin validation
- Content type validation
- Request size validation
- Error handling
- Audit logging

### Test Files
- `src/__tests__/api-security-middleware.test.ts`
- `src/__tests__/useCSRFToken.test.tsx`
- `src/__tests__/security.test.ts`

## Deployment Considerations

### Environment Variables
```bash
# Required for production
REDIS_URL=redis://localhost:6379
NEXTAUTH_URL=https://yourdomain.com
NODE_ENV=production

# Optional security settings
RATE_LIMIT_REDIS_PREFIX=rl:
CSRF_TOKEN_EXPIRY=86400000  # 24 hours
MAX_REQUEST_SIZE=10485760   # 10MB
```

### Production Checklist
- [ ] Redis configured for rate limiting
- [ ] HTTPS enforced (HSTS headers)
- [ ] Environment variables set
- [ ] CORS origins configured
- [ ] CSP policies tested
- [ ] Rate limits tuned for expected traffic
- [ ] Monitoring and alerting configured
- [ ] Security headers validated
- [ ] CSRF protection tested
- [ ] Input validation tested

## Monitoring and Alerting

### Security Metrics
- Rate limit violations per endpoint
- CSRF validation failures
- Authentication failures
- Invalid origin attempts
- Input validation errors
- Request size violations

### Recommended Alerts
- High rate of security violations
- Repeated CSRF failures from same IP
- Unusual authentication patterns
- Large number of blocked requests
- Security middleware errors

## Best Practices

### Development
1. Always use security middleware for API routes
2. Validate and sanitize all user inputs
3. Use secure form components for client-side forms
4. Test security measures in development
5. Review security logs regularly

### Production
1. Monitor security metrics continuously
2. Tune rate limits based on actual usage
3. Regularly update security configurations
4. Conduct security audits
5. Keep dependencies updated
6. Implement proper incident response procedures

## Security Headers Reference

### Content Security Policy
```
default-src 'self';
script-src 'self' 'unsafe-inline' 'unsafe-eval' https://js.stripe.com https://maps.googleapis.com;
style-src 'self' 'unsafe-inline' https://fonts.googleapis.com;
font-src 'self' https://fonts.gstatic.com;
img-src 'self' data: https: blob:;
connect-src 'self' https://api.stripe.com https://maps.googleapis.com wss: ws:;
frame-src 'self' https://js.stripe.com https://hooks.stripe.com;
object-src 'none';
base-uri 'self';
form-action 'self';
frame-ancestors 'none';
upgrade-insecure-requests;
```

### Additional Security Headers
- `Strict-Transport-Security: max-age=31536000; includeSubDomains; preload`
- `X-Frame-Options: DENY`
- `X-Content-Type-Options: nosniff`
- `X-XSS-Protection: 1; mode=block`
- `Referrer-Policy: strict-origin-when-cross-origin`
- `Permissions-Policy: camera=(), microphone=(), geolocation=(self), payment=(self)`

This comprehensive security implementation ensures that the unified booking platform is production-ready with enterprise-grade security measures.