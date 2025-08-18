import { describe, it, expect, jest, beforeEach, afterEach } from '@jest/globals';
import * as Sentry from '@sentry/nextjs';
import { SentryEnhancedConfig, sentryConfig } from '../lib/sentry-config';
import { SentryDashboardService, sentryDashboard } from '../lib/sentry-dashboard';
import { logger } from '@/lib/production-logger';

// Mock Sentry
jest.mock('@sentry/nextjs', () => ({
  init: jest.fn(),
  captureException: jest.fn(),
  captureMessage: jest.fn(),
  setTags: jest.fn(),
  setUser: jest.fn(),
  setContext: jest.fn(),
  addBreadcrumb: jest.fn(),
  addGlobalEventProcessor: jest.fn(),
  Integrations: {
    Http: jest.fn(),
    Prisma: jest.fn(),
    Console: jest.fn(),
  },
  Replay: jest.fn(),
  BrowserTracing: jest.fn(),
  nextRouterInstrumentation: jest.fn(),
}));

// Mock Prisma before importing modules that use it
const mockPrisma = {
  errorLog: {
    count: jest.fn(),
    findMany: jest.fn(),
    groupBy: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    findUnique: jest.fn(),
  },
  performanceMetric: {
    findMany: jest.fn(),
  },
  user: {
    count: jest.fn(),
  },
  systemAlert: {
    findMany: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
  },
  $queryRaw: jest.fn(),
  $disconnect: jest.fn(),
};

jest.mock('../lib/prisma', () => ({
  prisma: mockPrisma,
}));

describe('Sentry Enhanced Configuration', () => {
  let mockSentryInit: jest.MockedFunction<typeof Sentry.init>;
  let mockCaptureException: jest.MockedFunction<typeof Sentry.captureException>;
  let mockCaptureMessage: jest.MockedFunction<typeof Sentry.captureMessage>;
  let mockSetTags: jest.MockedFunction<typeof Sentry.setTags>;
  let mockSetUser: jest.MockedFunction<typeof Sentry.setUser>;

  beforeEach(() => {
    jest.clearAllMocks();
    
    mockSentryInit = Sentry.init as jest.MockedFunction<typeof Sentry.init>;
    mockCaptureException = Sentry.captureException as jest.MockedFunction<typeof Sentry.captureException>;
    mockCaptureMessage = Sentry.captureMessage as jest.MockedFunction<typeof Sentry.captureMessage>;
    mockSetTags = Sentry.setTags as jest.MockedFunction<typeof Sentry.setTags>;
    mockSetUser = Sentry.setUser as jest.MockedFunction<typeof Sentry.setUser>;

    // Reset environment variables
    process.env.NODE_ENV = 'test';
    process.env.SENTRY_DSN = 'https://test@sentry.io/123';
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('SentryEnhancedConfig', () => {
    it('should initialize Sentry with enhanced configuration', () => {
      sentryConfig.initializeEnhancedSentry();

      expect(mockSentryInit).toHaveBeenCalledWith(
        expect.objectContaining({
          dsn: 'https://test@sentry.io/123',
          environment: 'test',
          tracesSampleRate: 1.0, // Test environment should have 100% sampling
          profilesSampleRate: 1.0,
          debug: false, // Not development
        })
      );
    });

    it('should set custom tags correctly', () => {
      const customTags = {
        component: 'test-component',
        feature: 'test-feature',
        userRole: 'admin',
      };

      sentryConfig.setCustomTags(customTags);

      expect(mockSetTags).toHaveBeenCalledWith(customTags);
    });

    it('should set user context correctly', () => {
      const user = {
        id: 'user-123',
        email: 'test@example.com',
        role: 'admin',
      };

      sentryConfig.setUserContext(user);

      expect(mockSetUser).toHaveBeenCalledWith({
        id: 'user-123',
        email: 'test@example.com',
        role: 'admin',
      });

      expect(mockSetTags).toHaveBeenCalledWith({
        userRole: 'admin',
      });
    });

    it('should set component context correctly', () => {
      sentryConfig.setComponentContext('booking', 'create');

      expect(mockSetTags).toHaveBeenCalledWith({
        component: 'booking',
        feature: 'create',
      });
    });

    it('should set API context correctly', () => {
      sentryConfig.setApiContext('/api/bookings', 'POST');

      expect(mockSetTags).toHaveBeenCalledWith({
        apiEndpoint: 'POST /api/bookings',
      });
    });

    it('should trigger test alerts correctly', () => {
      sentryConfig.triggerTestAlert('error');
      expect(mockCaptureException).toHaveBeenCalledWith(
        expect.any(Error)
      );

      sentryConfig.triggerTestAlert('performance');
      expect(mockCaptureMessage).toHaveBeenCalledWith(
        'Test performance alert from Sentry monitoring',
        'warning'
      );

      sentryConfig.triggerTestAlert('memory');
      expect(mockCaptureMessage).toHaveBeenCalledWith(
        'Test memory usage alert from Sentry monitoring',
        'warning'
      );
    });

    it('should filter sensitive data from events', () => {
      const config = new SentryEnhancedConfig();
      
      // Access private method for testing
      const enhancedBeforeSend = (config as any).enhancedBeforeSend;
      
      const mockEvent = {
        request: {
          headers: {
            authorization: 'Bearer secret-token',
            cookie: 'session=secret',
            'content-type': 'application/json',
          },
        },
        extra: {
          password: 'secret-password',
          normalData: 'safe-data',
        },
      };

      const result = enhancedBeforeSend(mockEvent, { originalException: new Error('test') });

      expect(result?.request?.headers?.authorization).toBeUndefined();
      expect(result?.request?.headers?.cookie).toBeUndefined();
      expect(result?.request?.headers?.['content-type']).toBe('application/json');
      expect(result?.extra?.password).toBe('[Filtered]');
      expect(result?.extra?.normalData).toBe('safe-data');
    });

    it('should categorize errors correctly', () => {
      const config = new SentryEnhancedConfig();
      const categorizeError = (config as any).categorizeError;

      expect(categorizeError(new Error('Network request failed'))).toBe('network');
      expect(categorizeError(new Error('Database connection error'))).toBe('database');
      expect(categorizeError(new Error('Stripe payment failed'))).toBe('payment');
      expect(categorizeError(new Error('Unauthorized access'))).toBe('authentication');
      expect(categorizeError(new Error('Invalid input data'))).toBe('validation');
      expect(categorizeError(new Error('Unknown error'))).toBe('general');
    });

    it('should categorize performance correctly', () => {
      const config = new SentryEnhancedConfig();
      const categorizePerformance = (config as any).categorizePerformance;

      expect(categorizePerformance(50)).toBe('fast');
      expect(categorizePerformance(200)).toBe('normal');
      expect(categorizePerformance(800)).toBe('slow');
      expect(categorizePerformance(2000)).toBe('very-slow');
      expect(categorizePerformance(5000)).toBe('critical');
    });
  });

  describe('SentryDashboardService', () => {
    beforeEach(() => {
      // Reset all mock functions
      Object.values(mockPrisma).forEach((table: any) => {
        if (typeof table === 'object' && table !== null) {
          Object.values(table).forEach((method: any) => {
            if (typeof method === 'function' && method.mockReset) {
              method.mockReset();
            }
          });
        }
      });
    });

    it('should get dashboard metrics successfully', async () => {
      // Mock database responses
      mockPrisma.errorLog.count.mockResolvedValue(5);
      mockPrisma.performanceMetric.findMany.mockResolvedValue([
        { value: 100, metadata: { endpoint: '/api/test' }, createdAt: new Date() },
        { value: 200, metadata: { endpoint: '/api/test' }, createdAt: new Date() },
      ]);
      mockPrisma.user.count.mockResolvedValue(100);
      mockPrisma.errorLog.groupBy.mockResolvedValue([
        { level: 'error', _count: { id: 3 } },
        { level: 'warn', _count: { id: 2 } },
      ]);
      mockPrisma.$queryRaw.mockResolvedValue([{ count: '5' }]);

      const metrics = await sentryDashboard.getDashboardMetrics('24h');

      expect(metrics).toHaveProperty('errorCount');
      expect(metrics).toHaveProperty('errorRate');
      expect(metrics).toHaveProperty('performanceMetrics');
      expect(metrics).toHaveProperty('userImpact');
      expect(metrics).toHaveProperty('systemHealth');
      expect(metrics).toHaveProperty('trends');

      expect(metrics.errorCount).toBe(5);
      expect(metrics.performanceMetrics.averageResponseTime).toBe(150);
    });

    it('should get active alerts successfully', async () => {
      const mockAlerts = [
        {
          id: 'alert-1',
          type: 'ERROR',
          severity: 'HIGH',
          message: 'High error rate detected',
          createdAt: new Date(),
          resolved: false,
          resolvedAt: null,
          metadata: { component: 'api' },
        },
      ];

      mockPrisma.systemAlert.findMany.mockResolvedValue(mockAlerts);

      const alerts = await sentryDashboard.getActiveAlerts();

      expect(alerts).toHaveLength(1);
      expect(alerts[0]).toHaveProperty('id', 'alert-1');
      expect(alerts[0]).toHaveProperty('type', 'error_threshold');
      expect(alerts[0]).toHaveProperty('severity', 'high');
      expect(alerts[0]).toHaveProperty('resolved', false);
    });

    it('should create custom alerts successfully', async () => {
      mockPrisma.systemAlert.create.mockResolvedValue({
        id: 'new-alert',
        type: 'ERROR_THRESHOLD',
        severity: 'HIGH',
        message: 'Test Alert: High error rate',
        metadata: { test: true },
        environment: 'test',
        resolved: false,
      });

      await sentryDashboard.createCustomAlert(
        'error_threshold',
        'high',
        'Test Alert',
        'High error rate',
        { test: true },
        ['api']
      );

      expect(mockPrisma.systemAlert.create).toHaveBeenCalledWith({
        data: {
          type: 'ERROR_THRESHOLD',
          severity: 'HIGH',
          message: 'Test Alert: High error rate',
          metadata: { test: true },
          environment: 'test',
          resolved: false,
        },
      });

      expect(mockCaptureMessage).toHaveBeenCalledWith(
        'High error rate',
        expect.objectContaining({
          level: 'error',
          tags: {
            alertType: 'error_threshold',
            severity: 'high',
            component: 'custom-alert',
          },
        })
      );
    });

    it('should resolve alerts successfully', async () => {
      mockPrisma.systemAlert.update.mockResolvedValue({
        id: 'alert-1',
        resolved: true,
        resolvedAt: new Date(),
      });

      await sentryDashboard.resolveAlert('alert-1', 'admin-user');

      expect(mockPrisma.systemAlert.update).toHaveBeenCalledWith({
        where: { id: 'alert-1' },
        data: {
          resolved: true,
          resolvedAt: expect.any(Date),
          metadata: {
            resolvedBy: 'admin-user',
          },
        },
      });
    });

    it('should get error trends successfully', async () => {
      const mockErrorTrends = [
        {
          createdAt: new Date('2024-01-01T10:00:00Z'),
          _count: { id: 5 },
        },
        {
          createdAt: new Date('2024-01-01T11:00:00Z'),
          _count: { id: 3 },
        },
      ];

      mockPrisma.errorLog.groupBy.mockResolvedValue(mockErrorTrends);

      const trends = await sentryDashboard.getErrorTrends('24h');

      expect(trends).toHaveLength(2);
      expect(trends[0]).toHaveProperty('errorCount', 5);
      expect(trends[0]).toHaveProperty('errorRate');
      expect(trends[0]).toHaveProperty('timestamp');
    });

    it('should get performance trends successfully', async () => {
      const mockPerformanceMetrics = [
        {
          value: 100,
          createdAt: new Date('2024-01-01T10:00:00Z'),
        },
        {
          value: 200,
          createdAt: new Date('2024-01-01T10:00:00Z'),
        },
        {
          value: 150,
          createdAt: new Date('2024-01-01T11:00:00Z'),
        },
      ];

      mockPrisma.performanceMetric.findMany.mockResolvedValue(mockPerformanceMetrics);

      const trends = await sentryDashboard.getPerformanceTrends('24h');

      expect(trends).toHaveLength(2);
      expect(trends[0]).toHaveProperty('averageResponseTime', 150);
      expect(trends[0]).toHaveProperty('p95ResponseTime');
      expect(trends[0]).toHaveProperty('throughput', 2);
    });

    it('should handle errors gracefully', async () => {
      mockPrisma.errorLog.count.mockRejectedValue(new Error('Database error'));

      const metrics = await sentryDashboard.getDashboardMetrics('24h');

      // Should return default metrics on error
      expect(metrics.errorCount).toBe(0);
      expect(metrics.errorRate).toBe(0);
      expect(metrics.systemHealth.uptime).toBeGreaterThan(0);
    });
  });

  describe('Integration with Production Logger', () => {
    it('should integrate with enhanced Sentry configuration', () => {
      const testError = new Error('Test error');
      
      logger.error('Test error message', testError, {
        component: 'test-component',
        action: 'test-action',
        userId: 'user-123',
      });

      // Verify that Sentry methods were called
      expect(Sentry.setContext).toHaveBeenCalled();
      expect(Sentry.setTags).toHaveBeenCalled();
      expect(Sentry.addBreadcrumb).toHaveBeenCalled();
      expect(Sentry.captureException).toHaveBeenCalledWith(
        testError,
        expect.objectContaining({
          level: 'error',
          tags: expect.objectContaining({
            errorCategory: 'general',
            errorType: 'Error',
          }),
          extra: expect.objectContaining({
            message: 'Test error message',
          }),
        })
      );
    });

    it('should categorize different types of errors', () => {
      const networkError = new Error('Network request failed');
      const databaseError = new Error('Prisma connection error');
      const paymentError = new Error('Stripe payment failed');

      logger.error('Network error', networkError, { component: 'api' });
      logger.error('Database error', databaseError, { component: 'database' });
      logger.error('Payment error', paymentError, { component: 'payment' });

      expect(Sentry.captureException).toHaveBeenCalledWith(
        networkError,
        expect.objectContaining({
          tags: expect.objectContaining({
            errorCategory: 'network',
          }),
        })
      );

      expect(Sentry.captureException).toHaveBeenCalledWith(
        databaseError,
        expect.objectContaining({
          tags: expect.objectContaining({
            errorCategory: 'database',
          }),
        })
      );

      expect(Sentry.captureException).toHaveBeenCalledWith(
        paymentError,
        expect.objectContaining({
          tags: expect.objectContaining({
            errorCategory: 'payment',
          }),
        })
      );
    });
  });
});