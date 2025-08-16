import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { auditLogger, AuditEventType, AuditLogLevel } from '@/lib/audit-logger';
import { withRateLimit } from '@/lib/rate-limiter';
import { z } from 'zod';
import { logger } from '@/lib/production-logger';

// Validation schema for audit log queries
const auditLogQuerySchema = z.object({
  userId: z.string().uuid().optional(),
  eventType: z.nativeEnum(AuditEventType).optional(),
  level: z.nativeEnum(AuditLogLevel).optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  limit: z.coerce.number().min(1).max(1000).default(100),
  offset: z.coerce.number().min(0).default(0),
});

// Get audit logs (admin only)
export async function GET(request: NextRequest) {
  try {
    return await withRateLimit(request, 'admin', async () => {
      // Check authentication and authorization
      const session = await auth.api.getSession({
        headers: request.headers,
      });

      if (!session || (session.user as any).role !== 'admin') {
        await auditLogger.logFromRequest(request, {
          level: AuditLogLevel.WARNING,
          eventType: AuditEventType.UNAUTHORIZED_ACCESS,
          userId: session?.user?.id,
          action: 'audit_logs_access_denied',
          description: 'Unauthorized attempt to access audit logs',
          success: false,
        });

        return NextResponse.json(
          { error: 'Unauthorized' },
          { status: 403 }
        );
      }

      // Parse and validate query parameters
      const url = new URL(request.url);
      const queryParams = Object.fromEntries(url.searchParams.entries());
      
      const validatedQuery = auditLogQuerySchema.parse(queryParams);

      // Convert string dates to Date objects
      const filters = {
        ...validatedQuery,
        startDate: validatedQuery.startDate ? new Date(validatedQuery.startDate) : undefined,
        endDate: validatedQuery.endDate ? new Date(validatedQuery.endDate) : undefined,
      };

      // Get audit logs
      const logs = await auditLogger.getLogs(filters);

      // Log the audit log access
      await auditLogger.logFromRequest(request, {
        level: AuditLogLevel.INFO,
        eventType: AuditEventType.ADMIN_ACTION,
        userId: session.user.id,
        userRole: 'admin',
        action: 'view_audit_logs',
        description: `Admin viewed audit logs with filters: ${JSON.stringify(filters)}`,
        success: true,
        metadata: { filters, resultCount: logs.length },
      });

      return NextResponse.json({
        logs,
        pagination: {
          limit: validatedQuery.limit,
          offset: validatedQuery.offset,
          total: logs.length,
        },
      });
    });
  } catch (error) {
    logger.error('Audit logs API error:', error);

    await auditLogger.logFromRequest(request, {
      level: AuditLogLevel.ERROR,
      eventType: AuditEventType.ADMIN_ACTION,
      action: 'audit_logs_error',
      description: 'Error retrieving audit logs',
      success: false,
      errorMessage: error instanceof Error ? error.message : String(error),
    });

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid query parameters', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to retrieve audit logs' },
      { status: 500 }
    );
  }
}

// Get audit statistics (admin only)
export async function POST(request: NextRequest) {
  try {
    return await withRateLimit(request, 'admin', async () => {
      // Check authentication and authorization
      const session = await auth.api.getSession({
        headers: request.headers,
      });

      if (!session || (session.user as any).role !== 'admin') {
        return NextResponse.json(
          { error: 'Unauthorized' },
          { status: 403 }
        );
      }

      const body = await request.json();
      const { startDate, endDate } = body;

      if (!startDate || !endDate) {
        return NextResponse.json(
          { error: 'Start date and end date are required' },
          { status: 400 }
        );
      }

      // Get audit statistics
      const stats = await auditLogger.getAuditStats({
        startDate: new Date(startDate),
        endDate: new Date(endDate),
      });

      // Log the statistics access
      await auditLogger.logFromRequest(request, {
        level: AuditLogLevel.INFO,
        eventType: AuditEventType.ADMIN_ACTION,
        userId: session.user.id,
        userRole: 'admin',
        action: 'view_audit_stats',
        description: `Admin viewed audit statistics for period ${startDate} to ${endDate}`,
        success: true,
        metadata: { startDate, endDate, totalEvents: stats.totalEvents },
      });

      return NextResponse.json(stats);
    });
  } catch (error) {
    logger.error('Audit stats API error:', error);

    await auditLogger.logFromRequest(request, {
      level: AuditLogLevel.ERROR,
      eventType: AuditEventType.ADMIN_ACTION,
      action: 'audit_stats_error',
      description: 'Error retrieving audit statistics',
      success: false,
      errorMessage: error instanceof Error ? error.message : String(error),
    });

    return NextResponse.json(
      { error: 'Failed to retrieve audit statistics' },
      { status: 500 }
    );
  }
}