# Sentry Monitoring Implementation

This document outlines the comprehensive Sentry monitoring and alerting system implemented for the unified booking platform.

## Overview

The enhanced Sentry monitoring system provides:
- Advanced error tracking with custom categorization
- Performance monitoring with automated alerts
- Real-time dashboard for system health
- Custom alerting for critical system failures
- Enhanced error filtering and data sanitization
- Comprehensive logging integration

## Features Implemented

### 1. Enhanced Sentry Configuration (`src/lib/sentry-config.ts`)

#### Key Features:
- **Custom Error Categorization**: Automatically categorizes errors by type (network, database, payment, authentication, validation, UI, general)
- **Performance Monitoring**: Tracks Core Web Vitals (LCP, FID, CLS) and API response times
- **Custom Tags**: Enhanced tagging system for better error filtering and organization
- **Data Sanitization**: Automatically filters sensitive information from error reports
- **Sampling Configuration**: Environment-specific sampling rates for optimal performance
- **Alert Thresholds**: Configurable thresholds for error rates, performance, and memory usage

#### Configuration Options:
```typescript
interface SentryAlertConfig {
  errorThreshold: number;           // errors per minute
  performanceThreshold: number;     // ms
  databaseQueryThreshold: number;   // ms
  apiResponseThreshold: number;     // ms
  errorRateThreshold: number;       // percentage (0.05 = 5%)
  memoryUsageThreshold: number;     // MB
}
```

#### Custom Tags:
- `component`: Application component (booking, payment, auth, etc.)
- `feature`: Specific feature within component
- `userRole`: User role (admin, provider, customer)
- `apiEndpoint`: API endpoint being accessed
- `databaseTable`: Database table being queried
- `paymentProvider`: Payment provider (Stripe, etc.)
- `environment`: Environment (development, staging, production)
- `errorCategory`: Auto-categorized error type

### 2. Sentry Dashboard Service (`src/lib/sentry-dashboard.ts`)

#### Metrics Tracked:
- **Error Metrics**: Error count, error rate, trends
- **Performance Metrics**: Response times, slowest endpoints, percentiles
- **User Impact**: Affected users, impact percentage
- **System Health**: Uptime, memory usage, critical errors
- **Trends**: Error trends, performance trends, user satisfaction

#### Alert Management:
- Create custom alerts with severity levels
- Resolve alerts with tracking
- Store alerts in database for admin dashboard
- Integration with Slack webhooks for critical alerts

### 3. Admin Dashboard (`src/components/admin/SentryDashboard.tsx`)

#### Dashboard Sections:
- **Overview**: Key metrics and system health
- **Alerts**: Active and resolved alerts management
- **Performance**: Response time trends and slowest endpoints
- **Testing**: Alert testing functionality

#### Features:
- Real-time metrics refresh
- Time range selection (1h, 24h, 7d, 30d)
- Interactive charts for trends
- Alert resolution workflow
- Test alert triggers

### 4. API Integration (`src/app/api/admin/monitoring/sentry/route.ts`)

#### Endpoints:
- `GET /api/admin/monitoring/sentry`: Retrieve dashboard data
- `POST /api/admin/monitoring/sentry`: Manage alerts and configuration

#### Actions:
- `metrics`: Get dashboard metrics
- `alerts`: Get active alerts
- `error-trends`: Get error trend data
- `performance-trends`: Get performance trend data
- `create-alert`: Create custom alert
- `resolve-alert`: Resolve existing alert
- `test-alert`: Trigger test alerts
- `update-tags`: Update Sentry tags

### 5. Production Logger Integration

The production logger has been enhanced to work seamlessly with Sentry:
- Automatic error categorization
- Enhanced context setting
- Custom fingerprinting for error deduplication
- Breadcrumb tracking for better debugging

## Environment Configuration

Add these environment variables to your `.env` file:

```bash
# Sentry Configuration
SENTRY_DSN="https://your-dsn@sentry.io/project-id"
SENTRY_ORG="your-org"
SENTRY_PROJECT="your-project"
SENTRY_RELEASE="1.0.0"

# Alert Thresholds
SENTRY_ERROR_THRESHOLD="10"           # errors per minute
SENTRY_PERFORMANCE_THRESHOLD="2000"   # ms
SENTRY_DB_QUERY_THRESHOLD="1000"     # ms
SENTRY_API_RESPONSE_THRESHOLD="5000" # ms
SENTRY_ERROR_RATE_THRESHOLD="0.05"   # 5%
SENTRY_MEMORY_THRESHOLD="512"        # MB

# Monitoring and Alerting
SLACK_WEBHOOK_URL="https://hooks.slack.com/services/your/webhook/url"
LOG_LEVEL="info"
```

## Usage

### 1. Initialize Enhanced Sentry

The enhanced Sentry configuration is automatically initialized in the Sentry config files:

```typescript
import { initializeEnhancedSentry } from './src/lib/sentry-config';

initializeEnhancedSentry();
```

### 2. Set Custom Context

```typescript
import { sentryConfig } from '@/lib/sentry-config';

// Set component context
sentryConfig.setComponentContext('booking', 'create');

// Set user context
sentryConfig.setUserContext({
  id: 'user-123',
  email: 'user@example.com',
  role: 'customer'
});

// Set API context
sentryConfig.setApiContext('/api/bookings', 'POST');

// Set database context
sentryConfig.setDatabaseContext('bookings', 'create');

// Set payment context
sentryConfig.setPaymentContext('stripe', 'charge');
```

### 3. Create Custom Alerts

```typescript
import { sentryDashboard } from '@/lib/sentry-dashboard';

await sentryDashboard.createCustomAlert(
  'error_threshold',
  'high',
  'High Error Rate',
  'Error rate exceeded 5% threshold',
  { errorRate: 0.08, threshold: 0.05 },
  ['api', 'database']
);
```

### 4. Access Dashboard

Navigate to `/admin/monitoring` in the admin panel to access the Sentry dashboard.

## Alert Types

### 1. Error Threshold Alerts
- Triggered when error count exceeds configured threshold
- Severity: Based on error count and rate
- Auto-resolution: When error rate returns to normal

### 2. Performance Degradation Alerts
- Triggered when response times exceed thresholds
- Tracks API endpoints and database queries
- Includes slowest endpoints analysis

### 3. High Error Rate Alerts
- Triggered when error rate exceeds percentage threshold
- Calculated over rolling time windows
- Includes affected user impact

### 4. System Failure Alerts
- Triggered for critical system components
- Database connectivity issues
- External service failures
- Memory usage alerts

## Performance Monitoring

### Core Web Vitals
- **Largest Contentful Paint (LCP)**: Page loading performance
- **First Input Delay (FID)**: Interactivity measurement
- **Cumulative Layout Shift (CLS)**: Visual stability

### API Performance
- Response time tracking for all endpoints
- Automatic slow query detection
- Performance trend analysis
- P95 and P99 percentile tracking

### Memory Monitoring
- JavaScript heap usage tracking
- Memory leak detection
- Automatic alerts for high usage

## Security Features

### Data Sanitization
Automatically filters sensitive data from error reports:
- Authorization headers
- Cookies and session data
- API keys and secrets
- Payment information
- Personal identifiable information (PII)

### Error Filtering
Filters out noise and irrelevant errors:
- Browser-specific errors
- Network connectivity issues
- Development-only errors
- Static asset loading errors

## Testing

### Unit Tests
Comprehensive test suite in `src/__tests__/sentry-monitoring.test.ts`:
- Configuration testing
- Dashboard service testing
- Error categorization testing
- Alert management testing
- Integration testing

### Manual Testing
Use the admin dashboard testing section to:
- Trigger test error alerts
- Trigger test performance alerts
- Trigger test memory alerts
- Verify alert delivery and resolution

## Monitoring Best Practices

### 1. Alert Fatigue Prevention
- Use appropriate severity levels
- Set reasonable thresholds
- Implement alert grouping
- Auto-resolve transient issues

### 2. Performance Optimization
- Use sampling rates appropriate for environment
- Filter out irrelevant transactions
- Focus on critical user journeys
- Monitor business-critical operations

### 3. Security Considerations
- Never log sensitive information
- Use fingerprinting for error deduplication
- Implement proper access controls
- Regular security audits of logged data

## Troubleshooting

### Common Issues

1. **Sentry DSN Not Configured**
   - Verify SENTRY_DSN environment variable
   - Check Sentry project configuration

2. **High Memory Usage**
   - Review sampling rates
   - Check for memory leaks in application
   - Monitor JavaScript heap usage

3. **Missing Performance Data**
   - Verify BrowserTracing integration
   - Check sampling configuration
   - Ensure proper instrumentation

4. **Alerts Not Firing**
   - Check threshold configuration
   - Verify webhook URLs
   - Review alert conditions

### Debug Mode
Enable debug mode in development:
```bash
NODE_ENV=development
```

This will:
- Enable console logging
- Use 100% sampling rates
- Show detailed Sentry information
- Skip error filtering

## Future Enhancements

### Planned Features
1. **Advanced Analytics**: User behavior tracking and conversion funnels
2. **Predictive Alerting**: Machine learning-based anomaly detection
3. **Custom Dashboards**: User-configurable monitoring dashboards
4. **Integration Expansion**: Additional monitoring service integrations
5. **Mobile Monitoring**: React Native and mobile web monitoring
6. **Business Metrics**: Revenue impact tracking and business KPIs

### Integration Opportunities
- **Datadog**: Infrastructure monitoring integration
- **New Relic**: Application performance monitoring
- **PagerDuty**: Incident management integration
- **Grafana**: Custom visualization dashboards
- **Prometheus**: Metrics collection and alerting

## Conclusion

The enhanced Sentry monitoring system provides comprehensive error tracking, performance monitoring, and alerting capabilities for the unified booking platform. It enables proactive issue detection, rapid problem resolution, and continuous system health monitoring.

The system is designed to be:
- **Scalable**: Handles high-volume applications
- **Secure**: Protects sensitive information
- **Actionable**: Provides clear insights for resolution
- **Maintainable**: Easy to configure and extend
- **Cost-effective**: Optimized sampling and filtering

For questions or support, refer to the test suite and admin dashboard for examples and troubleshooting guidance.