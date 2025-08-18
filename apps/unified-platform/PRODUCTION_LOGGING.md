# Production Logging System

This document describes the production logging system implemented for the unified booking platform.

## Overview

The production logging system replaces all `console.log`, `console.warn`, `console.error`, and `console.info` statements with a structured logging service that integrates with Sentry for error monitoring and provides comprehensive logging capabilities for production environments.

## Features

- **Structured Logging**: All log entries include context, timestamps, and metadata
- **Sentry Integration**: Automatic error reporting to Sentry in production
- **Database Logging**: Critical errors and warnings are stored in the database
- **Request ID Tracking**: Each request gets a unique ID for tracing
- **User Context**: Logs include user information when available
- **Environment-based Filtering**: Log levels can be controlled via environment variables
- **Performance Monitoring**: Automatic detection and logging of slow operations

## Usage

### Basic Logging

```typescript
import { logger } from '@/lib/production-logger';

// Different log levels
logger.debug('Debug information', { component: 'user-service' });
logger.info('User logged in', { userId: '123', method: 'email' });
logger.warn('Slow database query detected', { duration: 1500 });
logger.error('Database connection failed', error, { component: 'database' });
```

### Specialized Logging Methods

```typescript
// API request logging
logger.apiRequest('GET', '/api/users', 200, 150);
logger.apiError('POST', '/api/users', 500, error);

// User action logging
logger.userAction('login', 'user123', { method: 'email' });

// Component error logging
logger.componentError('UserProfile', error, { userId: '123' });

// Performance warnings
logger.performanceWarning('api_response_time', 2000, 1000);

// Security events
logger.securityEvent('unauthorized_access', 'critical', { ip: '192.168.1.1' });

// Database query logging
logger.databaseQuery('SELECT * FROM users WHERE id = ?', 250);
```

### Request Middleware

For API routes, use the request logger middleware:

```typescript
import { withRequestLogger } from '@/lib/request-logger-middleware';

async function handler(req: NextRequest): Promise<NextResponse> {
  // Your API logic here
  return NextResponse.json({ success: true });
}

export const GET = withRequestLogger(handler, {
  logRequests: true,
  logResponses: true,
  logErrors: true,
  slowRequestThreshold: 500,
});
```

### Child Loggers

Create child loggers with additional context:

```typescript
const userLogger = logger.child({ userId: '123', component: 'user-service' });
userLogger.info('Processing user data'); // Will include userId and component in all logs
```

### Convenience Functions

For backward compatibility, convenience functions are available:

```typescript
import { log } from '@/lib/production-logger';

log.debug('Debug message');
log.info('Info message');
log.warn('Warning message');
log.error('Error message', error);
```

## Configuration

### Environment Variables

- `NODE_ENV`: Controls logging behavior (development vs production)
- `LOG_LEVEL`: Sets minimum log level (`debug`, `info`, `warn`, `error`)
- `SENTRY_DSN`: Sentry configuration for error reporting

### Log Levels

1. **debug**: Detailed information for debugging (only in development)
2. **info**: General information about application flow
3. **warn**: Warning messages that don't stop execution
4. **error**: Error conditions that need attention

## Integration with Existing Systems

### Sentry Integration

The logger automatically integrates with the existing Sentry configuration:

- Errors and warnings are sent to Sentry in production
- User context is automatically included
- Request context and metadata are attached
- Sensitive information is filtered out

### Database Integration

Critical errors and warnings are stored in the `ErrorLog` table:

```sql
-- ErrorLog table structure
CREATE TABLE ErrorLog (
  id TEXT PRIMARY KEY,
  message TEXT NOT NULL,
  stack TEXT,
  level TEXT NOT NULL,
  context JSON NOT NULL,
  fingerprint TEXT UNIQUE NOT NULL,
  count INTEGER DEFAULT 1,
  firstSeen DATETIME DEFAULT CURRENT_TIMESTAMP,
  lastSeen DATETIME DEFAULT CURRENT_TIMESTAMP,
  createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

### Error Deduplication

Similar errors are automatically deduplicated using fingerprinting:

- Errors with the same message and component are grouped
- Count is incremented for duplicate errors
- `lastSeen` timestamp is updated

## Migration from Console Statements

All existing `console.*` statements have been automatically replaced using the migration script:

```bash
node scripts/replace-console-logs.js
```

### Before (Old Code)
```typescript
console.log('User logged in:', userId);
console.error('Database error:', error);
console.warn('Slow query detected');
```

### After (New Code)
```typescript
import { logger } from '@/lib/production-logger';

logger.info('User logged in', { userId });
logger.error('Database error', error);
logger.warn('Slow query detected');
```

## Error Handling

### Client-Side Errors

Client-side errors are automatically captured and sent to the `/api/errors` endpoint:

```typescript
// Error boundaries automatically log errors
logger.componentError('ComponentName', error, { additionalContext });
```

### API Errors

API errors are logged with full context:

```typescript
logger.apiError('POST', '/api/users', 500, error, {
  requestId: 'req_123',
  userId: 'user_456',
  duration: 1500,
});
```

## Monitoring and Alerting

### Performance Monitoring

Automatic detection of performance issues:

- Slow API requests (> 1000ms by default)
- Slow database queries (> 1000ms)
- High memory usage
- Long-running operations

### Security Monitoring

Security events are automatically logged:

- Failed authentication attempts
- Unauthorized access attempts
- Suspicious user behavior
- Rate limiting violations

## Best Practices

### 1. Use Appropriate Log Levels

```typescript
// Good
logger.debug('Processing user preferences', { userId });
logger.info('User successfully registered', { userId, email });
logger.warn('Password reset attempt for non-existent user', { email });
logger.error('Failed to send email', error, { recipient });

// Avoid
logger.error('User clicked button'); // This should be debug or info
logger.info('Database connection failed', error); // This should be error
```

### 2. Include Relevant Context

```typescript
// Good
logger.info('Order processed', {
  orderId: '123',
  userId: '456',
  amount: 99.99,
  paymentMethod: 'stripe',
});

// Avoid
logger.info('Order processed'); // Missing context
```

### 3. Use Specialized Methods

```typescript
// Good
logger.apiRequest('GET', '/api/orders', 200, 150);
logger.userAction('purchase', userId, { orderId, amount });
logger.performanceWarning('database_query', 2000, 1000);

// Avoid
logger.info('API GET /api/orders 200 150ms'); // Use apiRequest instead
```

### 4. Handle Sensitive Data

```typescript
// Good
logger.info('User authenticated', { userId, method: 'email' });

// Avoid
logger.info('User authenticated', { 
  userId, 
  password: 'secret123', // Never log passwords
  creditCard: '4111-1111-1111-1111' // Never log sensitive data
});
```

## Troubleshooting

### Common Issues

1. **Logs not appearing in development**
   - Check `NODE_ENV` is set to `development`
   - Check `LOG_LEVEL` environment variable

2. **Errors not being sent to Sentry**
   - Verify `SENTRY_DSN` is configured
   - Check Sentry configuration in `sentry.*.config.ts`

3. **Database logging failures**
   - Check database connection
   - Verify `ErrorLog` table exists
   - Check Prisma client configuration

### Debug Mode

Enable debug logging:

```bash
LOG_LEVEL=debug npm run dev
```

### Testing Logging

Use the test endpoint to verify logging works:

```bash
curl http://localhost:3000/api/example-with-logging
```

## API Reference

### Logger Methods

- `debug(message, context?)`: Debug level logging
- `info(message, context?)`: Info level logging  
- `warn(message, context?, error?)`: Warning level logging
- `error(message, error?, context?)`: Error level logging
- `apiRequest(method, url, status, duration, context?)`: API request logging
- `apiError(method, url, status, error, context?)`: API error logging
- `userAction(action, userId?, metadata?)`: User action logging
- `componentError(component, error, context?)`: Component error logging
- `performanceWarning(metric, value, threshold, context?)`: Performance warning
- `securityEvent(event, severity, context?)`: Security event logging
- `databaseQuery(query, duration, context?)`: Database query logging
- `setRequestId(id)`: Set request ID for current context
- `getRequestId()`: Get current request ID
- `child(context)`: Create child logger with additional context

### Context Object

```typescript
interface LogContext {
  requestId?: string;
  userId?: string;
  sessionId?: string;
  userAgent?: string;
  url?: string;
  method?: string;
  statusCode?: number;
  duration?: number;
  component?: string;
  action?: string;
  metadata?: Record<string, any>;
}
```

## Performance Impact

The production logging system is designed to have minimal performance impact:

- Asynchronous database logging
- Efficient error deduplication
- Conditional logging based on environment
- Optimized Sentry integration
- Minimal memory footprint

## Security Considerations

- Sensitive data is automatically filtered from logs
- User passwords and tokens are never logged
- PII is handled according to privacy policies
- Logs are stored securely with appropriate access controls
- Error messages are sanitized before sending to external services