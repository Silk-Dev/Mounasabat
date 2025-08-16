import { auditLogger, AuditEventType, AuditLogLevel } from '@/lib/audit-logger';

describe('AuditLogger', () => {
  beforeEach(() => {
    // Clear any existing logs
    jest.clearAllMocks();
  });

  it('should log audit events successfully', async () => {
    const testEntry = {
      level: AuditLogLevel.INFO,
      eventType: AuditEventType.admin_action,
      userId: 'test-user-id',
      userRole: 'admin',
      targetResourceId: 'test-resource-id',
      targetResourceType: 'user',
      action: 'test_action',
      description: 'Test audit log entry',
      success: true,
      metadata: {
        testData: 'test value',
      },
    };

    // This should not throw an error
    await expect(auditLogger.log(testEntry)).resolves.not.toThrow();
  });

  it('should log admin actions with proper context', async () => {
    const adminUserId = 'admin-123';
    const targetResourceId = 'user-456';
    const action = 'update_user';

    await expect(
      auditLogger.logAdminAction(
        adminUserId,
        action,
        'user',
        targetResourceId,
        true,
        undefined,
        { changes: ['role: customer → admin'] }
      )
    ).resolves.not.toThrow();
  });

  it('should log security events', async () => {
    await expect(
      auditLogger.logSecurityEvent(
        AuditEventType.unauthorized_access,
        'Unauthorized attempt to access admin panel',
        undefined,
        'user-123',
        { ipAddress: '192.168.1.1' }
      )
    ).resolves.not.toThrow();
  });

  it('should retrieve logs with filters', async () => {
    // Add a test log first
    await auditLogger.log({
      level: AuditLogLevel.INFO,
      eventType: AuditEventType.user_created,
      userId: 'test-user',
      action: 'create_user',
      description: 'Test user created',
      success: true,
    });

    const logs = await auditLogger.getLogs({
      userId: 'test-user',
      limit: 10,
    });

    expect(Array.isArray(logs)).toBe(true);
  });

  it('should get audit statistics', async () => {
    const startDate = new Date(Date.now() - 24 * 60 * 60 * 1000); // 24 hours ago
    const endDate = new Date();

    const stats = await auditLogger.getAuditStats({
      startDate,
      endDate,
    });

    expect(stats).toHaveProperty('totalEvents');
    expect(stats).toHaveProperty('eventsByType');
    expect(stats).toHaveProperty('eventsByLevel');
    expect(stats).toHaveProperty('failureRate');
    expect(stats).toHaveProperty('topUsers');
    expect(typeof stats.totalEvents).toBe('number');
    expect(typeof stats.failureRate).toBe('number');
  });
});