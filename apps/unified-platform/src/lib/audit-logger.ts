import { NextRequest } from 'next/server';
import { DataEncryption } from './encryption';
import { logger } from './production-logger';

// Audit log levels
export enum AuditLogLevel {
  INFO = 'info',
  WARNING = 'warning',
  ERROR = 'error',
  CRITICAL = 'critical',
}

// Audit event types
export enum AuditEventType {
  // Authentication events
  USER_LOGIN = 'user_login',
  USER_LOGOUT = 'user_logout',
  USER_LOGIN_FAILED = 'user_login_failed',
  PASSWORD_RESET = 'password_reset',
  PASSWORD_CHANGED = 'password_changed',
  
  // User management
  USER_CREATED = 'user_created',
  USER_UPDATED = 'user_updated',
  USER_DELETED = 'user_deleted',
  USER_SUSPENDED = 'user_suspended',
  USER_ACTIVATED = 'user_activated',
  
  // Provider management
  PROVIDER_APPROVED = 'provider_approved',
  PROVIDER_REJECTED = 'provider_rejected',
  PROVIDER_SUSPENDED = 'provider_suspended',
  PROVIDER_VERIFIED = 'provider_verified',
  
  // Service management
  SERVICE_CREATED = 'service_created',
  SERVICE_UPDATED = 'service_updated',
  SERVICE_DELETED = 'service_deleted',
  SERVICE_APPROVED = 'service_approved',
  SERVICE_REJECTED = 'service_rejected',
  
  // Booking events
  BOOKING_CREATED = 'booking_created',
  BOOKING_UPDATED = 'booking_updated',
  BOOKING_CANCELLED = 'booking_cancelled',
  BOOKING_COMPLETED = 'booking_completed',
  
  // Payment events
  PAYMENT_PROCESSED = 'payment_processed',
  PAYMENT_FAILED = 'payment_failed',
  REFUND_PROCESSED = 'refund_processed',
  
  // Security events
  SECURITY_VIOLATION = 'security_violation',
  RATE_LIMIT_EXCEEDED = 'rate_limit_exceeded',
  UNAUTHORIZED_ACCESS = 'unauthorized_access',
  SUSPICIOUS_ACTIVITY = 'suspicious_activity',
  
  // Admin actions
  ADMIN_ACTION = 'admin_action',
  SYSTEM_CONFIG_CHANGED = 'system_config_changed',
  DATA_EXPORT = 'data_export',
  DATA_IMPORT = 'data_import',
}

// Audit log entry interface
export interface AuditLogEntry {
  id: string;
  timestamp: Date;
  level: AuditLogLevel;
  eventType: AuditEventType;
  userId?: string;
  userRole?: string;
  targetUserId?: string;
  targetResourceId?: string;
  targetResourceType?: string;
  action: string;
  description: string;
  metadata?: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
  sessionId?: string;
  success: boolean;
  errorMessage?: string;
  requestId?: string;
}

// Audit logger class
export class AuditLogger {
  private static instance: AuditLogger;
  private logs: AuditLogEntry[] = [];
  private readonly MAX_MEMORY_LOGS = 1000;

  private constructor() {}

  static getInstance(): AuditLogger {
    if (!AuditLogger.instance) {
      AuditLogger.instance = new AuditLogger();
    }
    return AuditLogger.instance;
  }

  // Log an audit event
  async log(entry: Omit<AuditLogEntry, 'id' | 'timestamp'>): Promise<void> {
    const auditEntry: AuditLogEntry = {
      ...entry,
      id: DataEncryption.generateSecureToken(16),
      timestamp: new Date(),
    };

    // Store in memory (in production, this should go to a database)
    this.logs.push(auditEntry);

    // Keep only the most recent logs in memory
    if (this.logs.length > this.MAX_MEMORY_LOGS) {
      this.logs = this.logs.slice(-this.MAX_MEMORY_LOGS);
    }

    // In production, you would also:
    // 1. Store in database
    // 2. Send to external logging service (e.g., CloudWatch, Datadog)
    // 3. Alert on critical events
    
    try {
      await this.persistLog(auditEntry);
      
      // Alert on critical events
      if (entry.level === AuditLogLevel.CRITICAL) {
        await this.sendCriticalAlert(auditEntry);
      }
    } catch (error) {
      logger.error('Failed to persist audit log:', error);
      // Don't throw error to avoid breaking the main application flow
    }
  }

  // Helper method to log from request context
  async logFromRequest(
    req: NextRequest,
    entry: Omit<AuditLogEntry, 'id' | 'timestamp' | 'ipAddress' | 'userAgent' | 'requestId'>
  ): Promise<void> {
    const ipAddress = req.ip || 
      req.headers.get('x-forwarded-for') || 
      req.headers.get('x-real-ip') || 
      'unknown';
    
    const userAgent = req.headers.get('user-agent') || 'unknown';
    const requestId = req.headers.get('x-request-id') || DataEncryption.generateSecureToken(8);

    await this.log({
      ...entry,
      ipAddress,
      userAgent,
      requestId,
    });
  }

  // Log authentication events
  async logAuth(
    eventType: AuditEventType,
    userId: string,
    success: boolean,
    req?: NextRequest,
    metadata?: Record<string, any>
  ): Promise<void> {
    const entry: Omit<AuditLogEntry, 'id' | 'timestamp'> = {
      level: success ? AuditLogLevel.INFO : AuditLogLevel.WARNING,
      eventType,
      userId,
      action: eventType.replace('_', ' '),
      description: `User ${success ? 'successfully' : 'failed to'} ${eventType.replace('_', ' ').toLowerCase()}`,
      success,
      metadata,
    };

    if (req) {
      await this.logFromRequest(req, entry);
    } else {
      await this.log(entry);
    }
  }

  // Log admin actions
  async logAdminAction(
    adminUserId: string,
    action: string,
    targetResourceType: string,
    targetResourceId: string,
    success: boolean,
    req?: NextRequest,
    metadata?: Record<string, any>,
    errorMessage?: string
  ): Promise<void> {
    const entry: Omit<AuditLogEntry, 'id' | 'timestamp'> = {
      level: success ? AuditLogLevel.INFO : AuditLogLevel.ERROR,
      eventType: AuditEventType.ADMIN_ACTION,
      userId: adminUserId,
      userRole: 'admin',
      targetResourceId,
      targetResourceType,
      action,
      description: `Admin ${action} on ${targetResourceType} ${targetResourceId}`,
      success,
      metadata,
      errorMessage,
    };

    if (req) {
      await this.logFromRequest(req, entry);
    } else {
      await this.log(entry);
    }
  }

  // Log security events
  async logSecurityEvent(
    eventType: AuditEventType,
    description: string,
    req?: NextRequest,
    userId?: string,
    metadata?: Record<string, any>
  ): Promise<void> {
    const entry: Omit<AuditLogEntry, 'id' | 'timestamp'> = {
      level: AuditLogLevel.WARNING,
      eventType,
      userId,
      action: 'security_event',
      description,
      success: false,
      metadata,
    };

    if (req) {
      await this.logFromRequest(req, entry);
    } else {
      await this.log(entry);
    }
  }

  // Get audit logs with filtering
  async getLogs(filters: {
    userId?: string;
    eventType?: AuditEventType;
    level?: AuditLogLevel;
    startDate?: Date;
    endDate?: Date;
    limit?: number;
    offset?: number;
  } = {}): Promise<AuditLogEntry[]> {
    try {
      // Import prisma dynamically to avoid circular dependencies
      const { prisma } = await import('./database/prisma');

      // Build where clause
      const where: any = {};
      
      if (filters.userId) {
        where.userId = filters.userId;
      }

      if (filters.eventType) {
        where.eventType = filters.eventType;
      }

      if (filters.level) {
        where.level = filters.level;
      }

      if (filters.startDate || filters.endDate) {
        where.timestamp = {};
        if (filters.startDate) {
          where.timestamp.gte = filters.startDate;
        }
        if (filters.endDate) {
          where.timestamp.lte = filters.endDate;
        }
      }

      // Query database
      const logs = await prisma.auditLog.findMany({
        where,
        orderBy: { timestamp: 'desc' },
        take: filters.limit || 100,
        skip: filters.offset || 0,
        include: {
          user: {
            select: {
              name: true,
              email: true,
            },
          },
          targetUser: {
            select: {
              name: true,
              email: true,
            },
          },
        },
      });

      // Transform to AuditLogEntry format
      return logs.map(log => ({
        id: log.id,
        timestamp: log.timestamp,
        level: log.level as AuditLogLevel,
        eventType: log.eventType as AuditEventType,
        userId: log.userId,
        userRole: log.userRole,
        targetUserId: log.targetUserId,
        targetResourceId: log.targetResourceId,
        targetResourceType: log.targetResourceType,
        action: log.action,
        description: log.description,
        metadata: log.metadata as Record<string, any>,
        ipAddress: log.ipAddress,
        userAgent: log.userAgent,
        sessionId: log.sessionId,
        success: log.success,
        errorMessage: log.errorMessage,
        requestId: log.requestId,
      }));
    } catch (error) {
      logger.error('Failed to retrieve audit logs from database:', error);
      
      // Fallback to memory logs if database fails
      let filteredLogs = [...this.logs];

      // Apply filters
      if (filters.userId) {
        filteredLogs = filteredLogs.filter(log => log.userId === filters.userId);
      }

      if (filters.eventType) {
        filteredLogs = filteredLogs.filter(log => log.eventType === filters.eventType);
      }

      if (filters.level) {
        filteredLogs = filteredLogs.filter(log => log.level === filters.level);
      }

      if (filters.startDate) {
        filteredLogs = filteredLogs.filter(log => log.timestamp >= filters.startDate!);
      }

      if (filters.endDate) {
        filteredLogs = filteredLogs.filter(log => log.timestamp <= filters.endDate!);
      }

      // Sort by timestamp (newest first)
      filteredLogs.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

      // Apply pagination
      const offset = filters.offset || 0;
      const limit = filters.limit || 100;
      
      return filteredLogs.slice(offset, offset + limit);
    }
  }

  // Get audit statistics
  async getAuditStats(timeRange: {
    startDate: Date;
    endDate: Date;
  }): Promise<{
    totalEvents: number;
    eventsByType: Record<string, number>;
    eventsByLevel: Record<string, number>;
    failureRate: number;
    topUsers: Array<{ userId: string; eventCount: number }>;
  }> {
    try {
      // Import prisma dynamically to avoid circular dependencies
      const { prisma } = await import('./database/prisma');

      const where = {
        timestamp: {
          gte: timeRange.startDate,
          lte: timeRange.endDate,
        },
      };

      // Get total events count
      const totalEvents = await prisma.auditLog.count({ where });

      // Get events by type
      const eventsByTypeRaw = await prisma.auditLog.groupBy({
        by: ['eventType'],
        where,
        _count: { eventType: true },
      });

      const eventsByType: Record<string, number> = {};
      eventsByTypeRaw.forEach(item => {
        eventsByType[item.eventType] = item._count.eventType;
      });

      // Get events by level
      const eventsByLevelRaw = await prisma.auditLog.groupBy({
        by: ['level'],
        where,
        _count: { level: true },
      });

      const eventsByLevel: Record<string, number> = {};
      eventsByLevelRaw.forEach(item => {
        eventsByLevel[item.level] = item._count.level;
      });

      // Get failure rate
      const failedEvents = await prisma.auditLog.count({
        where: {
          ...where,
          success: false,
        },
      });

      const failureRate = totalEvents > 0 ? failedEvents / totalEvents : 0;

      // Get top users
      const topUsersRaw = await prisma.auditLog.groupBy({
        by: ['userId'],
        where: {
          ...where,
          userId: { not: null },
        },
        _count: { userId: true },
        orderBy: { _count: { userId: 'desc' } },
        take: 10,
      });

      const topUsers = topUsersRaw.map(item => ({
        userId: item.userId!,
        eventCount: item._count.userId,
      }));

      return {
        totalEvents,
        eventsByType,
        eventsByLevel,
        failureRate,
        topUsers,
      };
    } catch (error) {
      logger.error('Failed to retrieve audit stats from database:', error);
      
      // Fallback to memory-based calculation
      const logs = await this.getLogs({
        startDate: timeRange.startDate,
        endDate: timeRange.endDate,
        limit: 10000, // Get all logs in range
      });

      const eventsByType: Record<string, number> = {};
      const eventsByLevel: Record<string, number> = {};
      const userEventCounts: Record<string, number> = {};
      let failedEvents = 0;

      logs.forEach(log => {
        // Count by event type
        eventsByType[log.eventType] = (eventsByType[log.eventType] || 0) + 1;
        
        // Count by level
        eventsByLevel[log.level] = (eventsByLevel[log.level] || 0) + 1;
        
        // Count by user
        if (log.userId) {
          userEventCounts[log.userId] = (userEventCounts[log.userId] || 0) + 1;
        }
        
        // Count failures
        if (!log.success) {
          failedEvents++;
        }
      });

      // Get top users
      const topUsers = Object.entries(userEventCounts)
        .map(([userId, eventCount]) => ({ userId, eventCount }))
        .sort((a, b) => b.eventCount - a.eventCount)
        .slice(0, 10);

      return {
        totalEvents: logs.length,
        eventsByType,
        eventsByLevel,
        failureRate: logs.length > 0 ? failedEvents / logs.length : 0,
        topUsers,
      };
    }
  }

  // Private method to persist log (implement based on your storage solution)
  private async persistLog(entry: AuditLogEntry): Promise<void> {
    try {
      // Import prisma dynamically to avoid circular dependencies
      const { prisma } = await import('./database/prisma');
      
      // Create audit log entry in database
      await prisma.auditLog.create({
        data: {
          id: entry.id,
          timestamp: entry.timestamp,
          level: entry.level,
          eventType: entry.eventType,
          userId: entry.userId,
          userRole: entry.userRole,
          targetUserId: entry.targetUserId,
          targetResourceId: entry.targetResourceId,
          targetResourceType: entry.targetResourceType,
          action: entry.action,
          description: entry.description,
          metadata: entry.metadata,
          ipAddress: entry.ipAddress,
          userAgent: entry.userAgent,
          sessionId: entry.sessionId,
          success: entry.success,
          errorMessage: entry.errorMessage,
          requestId: entry.requestId,
        },
      });

      // Also log to console in development for debugging
      if (process.env.NODE_ENV === 'development') {
        logger.info('AUDIT LOG:', JSON.stringify(entry, null, 2));
      }
    } catch (error) {
      // Fallback to console logging if database fails
      logger.error('Failed to persist audit log to database:', error);
      logger.info('AUDIT LOG (fallback):', JSON.stringify(entry, null, 2));
    }
  }

  // Private method to send critical alerts
  private async sendCriticalAlert(entry: AuditLogEntry): Promise<void> {
    // In production, implement alerting (email, Slack, PagerDuty, etc.)
    logger.error('CRITICAL AUDIT EVENT:', JSON.stringify(entry, null, 2));
    
    // TODO: Implement alerting system
    // await sendSlackAlert(entry);
    // await sendEmailAlert(entry);
  }
}

// Export singleton instance
export const auditLogger = AuditLogger.getInstance();

// Helper functions for common audit scenarios
export const auditHelpers = {
  // Log user registration
  logUserRegistration: (userId: string, email: string, role: string, req?: NextRequest) =>
    auditLogger.log({
      level: AuditLogLevel.INFO,
      eventType: AuditEventType.USER_CREATED,
      userId,
      action: 'user_registration',
      description: `New ${role} user registered with email ${email}`,
      success: true,
      metadata: { email, role },
      ...(req && {
        ipAddress: req.ip || req.headers.get('x-forwarded-for') || 'unknown',
        userAgent: req.headers.get('user-agent') || 'unknown',
      }),
    }),

  // Log booking creation
  logBookingCreation: (userId: string, bookingId: string, serviceId: string, amount: number, req?: NextRequest) =>
    auditLogger.log({
      level: AuditLogLevel.INFO,
      eventType: AuditEventType.BOOKING_CREATED,
      userId,
      targetResourceId: bookingId,
      targetResourceType: 'booking',
      action: 'create_booking',
      description: `User created booking ${bookingId} for service ${serviceId}`,
      success: true,
      metadata: { serviceId, amount },
      ...(req && {
        ipAddress: req.ip || req.headers.get('x-forwarded-for') || 'unknown',
        userAgent: req.headers.get('user-agent') || 'unknown',
      }),
    }),

  // Log payment processing
  logPaymentProcessed: (userId: string, paymentId: string, amount: number, success: boolean, req?: NextRequest) =>
    auditLogger.log({
      level: success ? AuditLogLevel.INFO : AuditLogLevel.ERROR,
      eventType: success ? AuditEventType.PAYMENT_PROCESSED : AuditEventType.PAYMENT_FAILED,
      userId,
      targetResourceId: paymentId,
      targetResourceType: 'payment',
      action: 'process_payment',
      description: `Payment ${success ? 'processed successfully' : 'failed'} for amount $${amount}`,
      success,
      metadata: { amount, paymentId },
      ...(req && {
        ipAddress: req.ip || req.headers.get('x-forwarded-for') || 'unknown',
        userAgent: req.headers.get('user-agent') || 'unknown',
      }),
    }),
};