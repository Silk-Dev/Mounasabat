import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import { logger } from '../../../lib/production-logger';

const ErrorLogSchema = z.object({
  id: z.string(),
  message: z.string(),
  stack: z.string().optional(),
  level: z.enum(['error', 'warn', 'info']),
  context: z.object({
    userId: z.string().optional(),
    sessionId: z.string().optional(),
    userAgent: z.string().optional(),
    url: z.string().optional(),
    timestamp: z.string().optional(),
    section: z.string().optional(),
    userRole: z.string().optional(),
    additionalData: z.record(z.any()).optional(),
  }),
  fingerprint: z.string(),
  count: z.number(),
  firstSeen: z.string(),
  lastSeen: z.string(),
});

const ErrorBatchSchema = z.object({
  errors: z.array(ErrorLogSchema),
});

const SingleErrorSchema = z.object({
  message: z.string(),
  stack: z.string().optional(),
  componentStack: z.string().optional(),
  section: z.string().optional(),
  timestamp: z.string(),
  userAgent: z.string().optional(),
  url: z.string().optional(),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Handle both batch errors and single errors
    let errors: any[];
    
    if (body.errors) {
      // Batch error format
      const validatedBatch = ErrorBatchSchema.parse(body);
      errors = validatedBatch.errors;
    } else {
      // Single error format (from error boundaries)
      const validatedError = SingleErrorSchema.parse(body);
      errors = [{
        id: crypto.randomUUID(),
        message: validatedError.message,
        stack: validatedError.stack,
        level: 'error' as const,
        context: {
          userAgent: validatedError.userAgent,
          url: validatedError.url,
          timestamp: validatedError.timestamp,
          section: validatedError.section,
          additionalData: validatedError.componentStack ? {
            componentStack: validatedError.componentStack,
          } : undefined,
        },
        fingerprint: generateFingerprint(validatedError.message, validatedError.section),
        count: 1,
        firstSeen: validatedError.timestamp,
        lastSeen: validatedError.timestamp,
      }];
    }

    // Store errors in database
    const storedErrors = await Promise.all(
      errors.map(async (error) => {
        try {
          // Check if error with same fingerprint exists
          const existingError = await prisma.errorLog.findUnique({
            where: { fingerprint: error.fingerprint },
          });

          if (existingError) {
            // Update existing error
            return await prisma.errorLog.update({
              where: { fingerprint: error.fingerprint },
              data: {
                count: existingError.count + error.count,
                lastSeen: new Date(error.lastSeen),
                context: error.context,
              },
            });
          } else {
            // Create new error
            return await prisma.errorLog.create({
              data: {
                id: error.id,
                message: error.message,
                stack: error.stack,
                level: error.level,
                context: error.context,
                fingerprint: error.fingerprint,
                count: error.count,
                firstSeen: new Date(error.firstSeen),
                lastSeen: new Date(error.lastSeen),
              },
            });
          }
        } catch (dbError) {
          logger.error('Failed to store error in database:', dbError);
          return null;
        }
      })
    );

    // Filter out failed stores
    const successfulStores = storedErrors.filter(Boolean);

    // In production, you might want to send critical errors to external monitoring
    if (process.env.NODE_ENV === 'production') {
      const criticalErrors = errors.filter(e => e.level === 'error');
      if (criticalErrors.length > 0) {
        // Send to external monitoring service (e.g., Sentry, DataDog, etc.)
        await sendToExternalMonitoring(criticalErrors);
      }
    }

    return NextResponse.json({
      success: true,
      stored: successfulStores.length,
      total: errors.length,
    });

  } catch (error) {
    logger.error('Error logging endpoint failed:', error);
    
    // Don't return error details to client for security
    return NextResponse.json(
      { success: false, error: 'Failed to log errors' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 100);
    const level = searchParams.get('level');
    const section = searchParams.get('section');
    const since = searchParams.get('since');

    const where: any = {};
    
    if (level) {
      where.level = level;
    }
    
    if (section) {
      where.context = {
        path: ['section'],
        equals: section,
      };
    }
    
    if (since) {
      where.firstSeen = {
        gte: new Date(since),
      };
    }

    const [errors, total] = await Promise.all([
      prisma.errorLog.findMany({
        where,
        orderBy: { lastSeen: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.errorLog.count({ where }),
    ]);

    return NextResponse.json({
      errors,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });

  } catch (error) {
    logger.error('Error fetching logs:', error);
    return NextResponse.json(
      { error: 'Failed to fetch error logs' },
      { status: 500 }
    );
  }
}

function generateFingerprint(message: string, section?: string): string {
  const key = `${message}-${section || 'unknown'}`;
  return btoa(key).replace(/[^a-zA-Z0-9]/g, '').substring(0, 32);
}

async function sendToExternalMonitoring(errors: any[]): Promise<void> {
  // Placeholder for external monitoring integration
  // In a real application, you would integrate with services like:
  // - Sentry
  // - DataDog
  // - New Relic
  // - LogRocket
  // etc.
  
  try {
    // Example: Send to webhook or external service
    if (process.env.ERROR_MONITORING_WEBHOOK) {
      await fetch(process.env.ERROR_MONITORING_WEBHOOK, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          service: 'unified-booking-platform',
          errors,
          timestamp: new Date().toISOString(),
        }),
      });
    }
  } catch (error) {
    logger.error('Failed to send to external monitoring:', error);
  }
}