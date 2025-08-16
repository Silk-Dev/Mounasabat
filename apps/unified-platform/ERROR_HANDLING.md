# Production Error Handling System

This document describes the comprehensive error handling system implemented for production readiness.

## Overview

The error handling system provides:
- Centralized error processing with Sentry integration
- Automatic error sanitization to prevent sensitive data exposure
- Standardized API error responses
- Enhanced error boundaries with better fallback UI
- Comprehensive logging and monitoring

## Components

### 1. ProductionErrorHandler

The main error handling class that integrates with Sentry and provides sanitized error responses.

```typescript
import { errorHandler } from '@/lib/production-error-handler';

// Handle API errors
const response = errorHandler.handleAPIError(error, request, {
  component: 'user-service',
  action: 'create-user',
});

// Handle client errors
const sanitizedError = errorHandler.handleClientError(error, {
  component: 'booking-form',
});

// Handle database errors
const dbError = errorHandler.handleDatabaseError(error, query, {
  component: 'user-repository',
});
```

### 2. API Middleware

Middleware functions that wrap API routes with error handling, authentication, and validation.

```typescript
import { withApiMiddleware, withAuth, withValidation } from '@/lib/api-middleware';

// Basic error handling
export const GET = withApiMiddleware(async (request) => {
  // Your handler code
  return ApiResponseBuilder.success(data);
}, {
  component: 'search-api',
  logRequests: true,
});

// With authentication
export const POST = withAuth(async (request) => {
  const user = (request as any).user; // Injected by middleware
  return ApiResponseBuilder.success({ user });
});

// With validation
const validator = createValidator(['name', 'email']);
export const PUT = withValidation(async (request) => {
  const body = (request as any).validatedBody; // Validated body
  return ApiResponseBuilder.success(body);
}, validator);
```

### 3. Enhanced Error Boundaries

React error boundaries with better fallback UI and automatic error reporting.

```typescript
import { ErrorBoundary, SearchErrorBoundary, BookingErrorBoundary } from '@/components/error';

// Generic error boundary
<ErrorBoundary section="dashboard" showDetails={isDevelopment}>
  <DashboardContent />
</ErrorBoundary>

// Specialized error boundaries
<SearchErrorBoundary>
  <SearchResults />
</SearchErrorBoundary>

<BookingErrorBoundary>
  <BookingForm />
</BookingErrorBoundary>
```

## Features

### Error Sanitization

The system automatically sanitizes sensitive information:

```typescript
// Sensitive fields are automatically redacted
const sensitiveData = {
  user: {
    name: 'John',
    password: 'secret123',    // → '[REDACTED]'
    api_key: 'key123',       // → '[REDACTED]'
  }
};
```

### Standardized API Responses

All API responses follow a consistent format:

```typescript
// Success response
{
  success: true,
  data: { ... },
  message?: string,
  pagination?: { ... },
  meta: {
    timestamp: number,
    requestId?: string
  }
}

// Error response
{
  success: false,
  error: string,
  message?: string,
  code?: string,
  details?: any // Only in development
}
```

### Error Classification

Errors are automatically classified and assigned appropriate HTTP status codes:

- `400` - Validation errors, invalid requests
- `401` - Authentication required
- `403` - Access denied, insufficient permissions
- `404` - Resource not found
- `409` - Resource conflicts
- `429` - Rate limiting
- `500` - Internal server errors

### Sentry Integration

Errors are automatically sent to Sentry with:
- Sanitized context information
- User identification (when available)
- Component and action tags
- Performance metrics
- Error fingerprinting for deduplication

## Usage Examples

### API Route with Full Error Handling

```typescript
import { withAuth, createValidator } from '@/lib/api-middleware';
import { ApiResponseBuilder } from '@/lib/api-response';

const validator = createValidator(['name', 'email']);

export const POST = withAuth(
  withValidation(async (request) => {
    const body = (request as any).validatedBody;
    const user = (request as any).user;
    
    // Your business logic here
    const result = await createUser(body);
    
    return ApiResponseBuilder.success(result, 'User created successfully');
  }, validator),
  { component: 'user-api' }
);
```

### Error Boundary with Custom Fallback

```typescript
import { ErrorBoundary } from '@/components/error';

const CustomFallback = ({ error, retry }) => (
  <div className="error-fallback">
    <h2>Something went wrong in the payment process</h2>
    <p>Please try again or contact support.</p>
    <button onClick={retry}>Retry Payment</button>
    <button onClick={() => window.location.href = '/support'}>
      Contact Support
    </button>
  </div>
);

<ErrorBoundary 
  section="payment" 
  fallback={CustomFallback}
  onError={(error, errorInfo) => {
    // Custom error handling
    analytics.track('payment_error', { error: error.message });
  }}
>
  <PaymentForm />
</ErrorBoundary>
```

### Manual Error Reporting

```typescript
import { errorHandler } from '@/lib/production-error-handler';

try {
  await riskyOperation();
} catch (error) {
  const sanitizedError = errorHandler.handleClientError(error, {
    component: 'payment-processor',
    action: 'process-payment',
    metadata: {
      paymentMethod: 'credit_card',
      amount: 100,
    },
  });
  
  // Show user-friendly error message
  toast.error(sanitizedError.message);
}
```

## Configuration

### Environment Variables

```bash
# Sentry configuration
SENTRY_DSN=your-sentry-dsn
NODE_ENV=production

# Logging level
LOG_LEVEL=info
```

### Error Boundary Configuration

Error boundaries can be configured per section:

```typescript
// Global error boundary in layout
<ErrorBoundary 
  section="app"
  showDetails={process.env.NODE_ENV === 'development'}
  onError={(error, errorInfo) => {
    // Global error tracking
    analytics.track('app_error', {
      error: error.message,
      section: 'app',
    });
  }}
>
  <App />
</ErrorBoundary>
```

## Best Practices

### 1. Use Appropriate Error Types

```typescript
// Good: Specific error types
throw new Error('User not found');
throw new Error('Invalid email format');
throw new Error('Insufficient permissions');

// Avoid: Generic errors
throw new Error('Something went wrong');
```

### 2. Provide Context

```typescript
// Good: Include relevant context
errorHandler.handleClientError(error, {
  component: 'booking-form',
  action: 'submit-booking',
  metadata: {
    eventType: 'wedding',
    serviceCount: 3,
    totalAmount: 1500,
  },
});
```

### 3. Use Middleware for API Routes

```typescript
// Good: Use middleware for consistent error handling
export const POST = withApiMiddleware(handler, {
  component: 'booking-api',
  logRequests: true,
});

// Avoid: Manual error handling in each route
export async function POST(request) {
  try {
    // handler code
  } catch (error) {
    // Manual error handling
  }
}
```

### 4. Implement Graceful Degradation

```typescript
// Good: Provide fallback functionality
<ErrorBoundary fallback={({ retry }) => (
  <div>
    <p>Unable to load search results</p>
    <button onClick={retry}>Try Again</button>
    <button onClick={() => window.location.href = '/'}>
      Go Home
    </button>
  </div>
)}>
  <SearchResults />
</ErrorBoundary>
```

## Testing

The error handling system includes comprehensive tests:

```bash
# Run error handling tests
npm test -- --testPathPattern=production-error-handler
npm test -- --testPathPattern=api-middleware

# Run all error-related tests
npm test -- --testNamePattern="error"
```

## Monitoring

### Sentry Dashboard

Monitor errors in Sentry with:
- Error frequency and trends
- Performance impact
- User impact analysis
- Error resolution tracking

### Custom Metrics

Track custom error metrics:

```typescript
// Track specific error types
logger.securityEvent('unauthorized_access', 'high', {
  userId: user.id,
  resource: 'admin-panel',
});

// Track performance issues
logger.performanceWarning('slow_database_query', 2500, 1000, {
  query: 'SELECT * FROM bookings',
  component: 'booking-service',
});
```

## Migration Guide

### Updating Existing API Routes

1. Replace manual error handling with middleware:

```typescript
// Before
export async function GET(request) {
  try {
    const data = await fetchData();
    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { success: false, error: 'Internal error' },
      { status: 500 }
    );
  }
}

// After
export const GET = withApiMiddleware(async (request) => {
  const data = await fetchData();
  return ApiResponseBuilder.success(data);
}, { component: 'data-api' });
```

2. Update error boundaries:

```typescript
// Before
<ErrorBoundary>
  <Component />
</ErrorBoundary>

// After
<ErrorBoundary section="component" showDetails={isDevelopment}>
  <Component />
</ErrorBoundary>
```

3. Replace console.log with proper logging:

```typescript
// Before
console.error('Error occurred:', error);

// After
logger.error('Error occurred', error, {
  component: 'my-component',
  action: 'process-data',
});
```

This error handling system provides comprehensive, production-ready error management with proper sanitization, monitoring, and user experience considerations.