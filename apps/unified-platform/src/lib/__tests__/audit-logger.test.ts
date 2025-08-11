/**
 * @jest-environment node
 */

import { auditLogger, AuditEventType, AuditLogLevel, auditHelpers } from '../audit-logger';

// Mock NextRequest for testing
function createMockRequest(options: {
  method?: string;
  url?: string;
  headers?: Record<string, string>;
  ip?: string;
}): any {
  const { method = 'GET', url = 'http://localhost:3000', headers = {}, ip } = options;
  
  return {
    method,
    url,
    nextUrl: new URL(url),
    headers: {
      get: (name: string) => headers[name.toLowerCase()] || null,
    },
    ip,
  };
}

describe('AuditLogger', () => {
  beforeEach(() => {
    // Clear any existing logs before each test
    (auditLogger as any).logs = [];
  });

  describe('Basic Logging', () => {
    it('should log audit events correctly', async () => {
      await auditLogger.log({
        level: AuditLogLevel.INFO,
        eventType: AuditEventType.USER_LOGIN,
        userId: 'user-123',
        action: 'login',
        description: 'User logged in successfully',
        success: true,
      });

      const logs = await auditLogger.getLogs();
      expect(logs).toHaveLength(1);
      
      const log = logs[0];
      expect(log.level).toBe(AuditLogLevel.INFO);
      expect(log.eventType).toBe(AuditEventType.USER_LOGIN);
      expect(log.userId).toBe('user-123');
      expect(log.success).toBe(true);
      expect(log.id).toBeDefined();
      expect(log.timestamp).toBeInstanceOf(Date);
    });

    it('should log from request context', async () => {
      const request = createMockRequest({
        ip: '192.168.1.1',
        headers: {
          'user-agent': 'Mozilla/5.0 Test Browser',
          'x-request-id': 'req-123',
        },
      });

      await auditLogger.logFromRequest(request, {
        level: AuditLogLevel.INFO,
        eventType: AuditEventType.USER_LOGIN,
        userId: 'user-123',
        action: 'login',
        description: 'User logged in',
        success: true,
      });

      const logs = await auditLogger.getLogs();
      const log = logs[0];
      
      expect(log.ipAddress).toBe('192.168.1.1');
      expect(log.userAgent).toBe('Mozilla/5.0 Test Browser');
      expect(log.requestId).toBe('req-123');
    });
  });

  describe('Authentication Logging', () => {
    it('should log successful authentication', async () => {
      const request = createMockRequest({ ip: '192.168.1.1' });
      
      await auditLogger.logAuth(
        AuditEventType.USER_LOGIN,
        'user-123',
        true,
        request,
        { loginMethod: 'email' }
      );

      const logs = await auditLogger.getLogs();
      const log = logs[0];
      
      expect(log.eventType).toBe(AuditEventType.USER_LOGIN);
      expect(log.success).toBe(true);
      expect(log.level).toBe(AuditLogLevel.INFO);
      expect(log.metadata).toEqual({ loginMethod: 'email' });
    });

    it('should log failed authentication', async () => {
      await auditLogger.logAuth(
        AuditEventType.USER_LOGIN_FAILED,
        'user-123',
        false,
        undefined,
        { reason: 'invalid_password' }
      );

      const logs = await auditLogger.getLogs();
      const log = logs[0];
      
      expect(log.success).toBe(false);
      expect(log.level).toBe(AuditLogLevel.WARNING);
      expect(log.metadata).toEqual({ reason: 'invalid_password' });
    });
  });

  describe('Admin Action Logging', () => {
    it('should log successful admin actions', async () => {
      const request = createMockRequest({ ip: '192.168.1.1' });
      
      await auditLogger.logAdminAction(
        'admin-123',
        'approve_provider',
        'provider',
        'provider-456',
        true,
        request,
        { reason: 'meets_requirements' }
      );

      const logs = await auditLogger.getLogs();
      const log = logs[0];
      
      expect(log.eventType).toBe(AuditEventType.ADMIN_ACTION);
      expect(log.userId).toBe('admin-123');
      expect(log.userRole).toBe('admin');
      expect(log.targetResourceType).toBe('provider');
      expect(log.targetResourceId).toBe('provider-456');
      expect(log.success).toBe(true);
      expect(log.level).toBe(AuditLogLevel.INFO);
    });

    it('should log failed admin actions', async () => {
      await auditLogger.logAdminAction(
        'admin-123',
        'delete_user',
        'user',
        'user-456',
        false,
        undefined,
        { reason: 'validation_failed' },
        'User has active bookings'
      );

      const logs = await auditLogger.getLogs();
      const log = logs[0];
      
      expect(log.success).toBe(false);
      expect(log.level).toBe(AuditLogLevel.ERROR);
      expect(log.errorMessage).toBe('User has active bookings');
    });
  });

  describe('Security Event Logging', () => {
    it('should log security violations', async () => {
      const request = createMockRequest({ ip: '192.168.1.1' });
      
      await auditLogger.logSecurityEvent(
        AuditEventType.RATE_LIMIT_EXCEEDED,
        'Rate limit exceeded for search endpoint',
        request,
        'user-123',
        { endpoint: '/api/search', limit: 100 }
      );

      const logs = await auditLogger.getLogs();
      const log = logs[0];
      
      expect(log.eventType).toBe(AuditEventType.RATE_LIMIT_EXCEEDED);
      expect(log.level).toBe(AuditLogLevel.WARNING);
      expect(log.success).toBe(false);
      expect(log.metadata).toEqual({ endpoint: '/api/search', limit: 100 });
    });
  });

  describe('Log Filtering and Retrieval', () => {
    beforeEach(async () => {
      // Add test logs
      await auditLogger.log({
        level: AuditLogLevel.INFO,
        eventType: AuditEventType.USER_LOGIN,
        userId: 'user-1',
        action: 'login',
        description: 'User 1 login',
        success: true,
      });

      await auditLogger.log({
        level: AuditLogLevel.ERROR,
        eventType: AuditEventType.PAYMENT_FAILED,
        userId: 'user-2',
        action: 'payment',
        description: 'Payment failed',
        success: false,
      });

      await auditLogger.log({
        level: AuditLogLevel.WARNING,
        eventType: AuditEventType.SECURITY_VIOLATION,
        userId: 'user-1',
        action: 'security',
        description: 'Security violation',
        success: false,
      });
    });

    it('should filter logs by user ID', async () => {
      const logs = await auditLogger.getLogs({ userId: 'user-1' });
      expect(logs).toHaveLength(2);
      expect(logs.every(log => log.userId === 'user-1')).toBe(true);
    });

    it('should filter logs by event type', async () => {
      const logs = await auditLogger.getLogs({ eventType: AuditEventType.USER_LOGIN });
      expect(logs).toHaveLength(1);
      expect(logs[0].eventType).toBe(AuditEventType.USER_LOGIN);
    });

    it('should filter logs by level', async () => {
      const logs = await auditLogger.getLogs({ level: AuditLogLevel.ERROR });
      expect(logs).toHaveLength(1);
      expect(logs[0].level).toBe(AuditLogLevel.ERROR);
    });

    it('should apply pagination', async () => {
      const logs = await auditLogger.getLogs({ limit: 2, offset: 1 });
      expect(logs).toHaveLength(2);
    });

    it('should sort logs by timestamp (newest first)', async () => {
      const logs = await auditLogger.getLogs();
      expect(logs).toHaveLength(3);
      
      for (let i = 1; i < logs.length; i++) {
        expect(logs[i - 1].timestamp.getTime()).toBeGreaterThanOrEqual(
          logs[i].timestamp.getTime()
        );
      }
    });
  });

  describe('Audit Statistics', () => {
    beforeEach(async () => {
      const now = new Date();
      const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      
      // Add test logs with different timestamps
      await auditLogger.log({
        level: AuditLogLevel.INFO,
        eventType: AuditEventType.USER_LOGIN,
        userId: 'user-1',
        action: 'login',
        description: 'Login 1',
        success: true,
      });

      await auditLogger.log({
        level: AuditLogLevel.INFO,
        eventType: AuditEventType.USER_LOGIN,
        userId: 'user-2',
        action: 'login',
        description: 'Login 2',
        success: true,
      });

      await auditLogger.log({
        level: AuditLogLevel.ERROR,
        eventType: AuditEventType.PAYMENT_FAILED,
        userId: 'user-1',
        action: 'payment',
        description: 'Payment failed',
        success: false,
      });
    });

    it('should generate audit statistics', async () => {
      const stats = await auditLogger.getAuditStats({
        startDate: new Date(Date.now() - 24 * 60 * 60 * 1000),
        endDate: new Date(),
      });

      expect(stats.totalEvents).toBe(3);
      expect(stats.eventsByType[AuditEventType.USER_LOGIN]).toBe(2);
      expect(stats.eventsByType[AuditEventType.PAYMENT_FAILED]).toBe(1);
      expect(stats.eventsByLevel[AuditLogLevel.INFO]).toBe(2);
      expect(stats.eventsByLevel[AuditLogLevel.ERROR]).toBe(1);
      expect(stats.failureRate).toBe(1/3);
      expect(stats.topUsers).toHaveLength(2);
      expect(stats.topUsers[0].userId).toBe('user-1'); // Has 2 events
      expect(stats.topUsers[0].eventCount).toBe(2);
    });
  });
});

describe('Audit Helpers', () => {
  beforeEach(() => {
    (auditLogger as any).logs = [];
  });

  it('should log user registration', async () => {
    const request = createMockRequest({ ip: '192.168.1.1' });
    
    await auditHelpers.logUserRegistration(
      'user-123',
      'user@example.com',
      'customer',
      request
    );

    const logs = await auditLogger.getLogs();
    const log = logs[0];
    
    expect(log.eventType).toBe(AuditEventType.USER_CREATED);
    expect(log.userId).toBe('user-123');
    expect(log.metadata).toEqual({ email: 'user@example.com', role: 'customer' });
  });

  it('should log booking creation', async () => {
    await auditHelpers.logBookingCreation(
      'user-123',
      'booking-456',
      'service-789',
      150.00
    );

    const logs = await auditLogger.getLogs();
    const log = logs[0];
    
    expect(log.eventType).toBe(AuditEventType.BOOKING_CREATED);
    expect(log.targetResourceId).toBe('booking-456');
    expect(log.metadata).toEqual({ serviceId: 'service-789', amount: 150.00 });
  });

  it('should log successful payment processing', async () => {
    await auditHelpers.logPaymentProcessed(
      'user-123',
      'payment-456',
      100.00,
      true
    );

    const logs = await auditLogger.getLogs();
    const log = logs[0];
    
    expect(log.eventType).toBe(AuditEventType.PAYMENT_PROCESSED);
    expect(log.success).toBe(true);
    expect(log.level).toBe(AuditLogLevel.INFO);
  });

  it('should log failed payment processing', async () => {
    await auditHelpers.logPaymentProcessed(
      'user-123',
      'payment-456',
      100.00,
      false
    );

    const logs = await auditLogger.getLogs();
    const log = logs[0];
    
    expect(log.eventType).toBe(AuditEventType.PAYMENT_FAILED);
    expect(log.success).toBe(false);
    expect(log.level).toBe(AuditLogLevel.ERROR);
  });
});