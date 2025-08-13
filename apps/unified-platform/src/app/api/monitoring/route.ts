/**
 * Monitoring API Endpoint
 * Provides database monitoring metrics and health checks
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/database/prisma';
import { createDatabaseMonitor, runMonitoringCheck } from '@/lib/database/monitoring';
import { isMonitoringEnabled } from '../../../../../deployment.config.js';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action') || 'metrics';
    const environment = process.env.NODE_ENV || 'development';

    // Check if monitoring is enabled
    if (!isMonitoringEnabled('enableEmptyStateTracking', environment) && 
        !isMonitoringEnabled('enableErrorTracking', environment)) {
      return NextResponse.json({
        success: false,
        message: 'Monitoring is disabled for this environment',
      }, { status: 403 });
    }

    const monitor = createDatabaseMonitor(prisma, environment);

    switch (action) {
      case 'metrics':
        const metrics = await monitor.getMetrics();
        return NextResponse.json({
          success: true,
          data: metrics,
        });

      case 'counts':
        const counts = await monitor.getCounts();
        return NextResponse.json({
          success: true,
          data: { counts },
        });

      case 'check':
        const checkResults = await runMonitoringCheck(prisma, environment);
        return NextResponse.json({
          success: true,
          data: checkResults,
        });

      case 'report':
        const report = await monitor.generateReport();
        return NextResponse.json({
          success: true,
          data: { report },
        });

      case 'health':
        // Basic health check
        await prisma.$queryRaw`SELECT 1`;
        return NextResponse.json({
          success: true,
          data: {
            status: 'healthy',
            timestamp: new Date().toISOString(),
            environment,
          },
        });

      default:
        return NextResponse.json({
          success: false,
          message: 'Invalid action. Available actions: metrics, counts, check, report, health',
        }, { status: 400 });
    }

  } catch (error) {
    console.error('Monitoring API error:', error);
    
    return NextResponse.json({
      success: false,
      message: 'Internal server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action } = body;
    const environment = process.env.NODE_ENV || 'development';

    // Check if monitoring is enabled
    if (!isMonitoringEnabled('enableEmptyStateTracking', environment) && 
        !isMonitoringEnabled('enableErrorTracking', environment)) {
      return NextResponse.json({
        success: false,
        message: 'Monitoring is disabled for this environment',
      }, { status: 403 });
    }

    const monitor = createDatabaseMonitor(prisma, environment);

    switch (action) {
      case 'run-check':
        const results = await monitor.runMonitoringCheck();
        return NextResponse.json({
          success: true,
          data: results,
          message: 'Monitoring check completed',
        });

      case 'resolve-alert':
        const { alertId, resolvedBy } = body;
        
        if (!alertId) {
          return NextResponse.json({
            success: false,
            message: 'Alert ID is required',
          }, { status: 400 });
        }

        await prisma.systemAlert.update({
          where: { id: alertId },
          data: {
            resolved: true,
            resolvedAt: new Date(),
            resolvedBy: resolvedBy || 'system',
          },
        });

        return NextResponse.json({
          success: true,
          message: 'Alert resolved successfully',
        });

      default:
        return NextResponse.json({
          success: false,
          message: 'Invalid action. Available actions: run-check, resolve-alert',
        }, { status: 400 });
    }

  } catch (error) {
    console.error('Monitoring API error:', error);
    
    return NextResponse.json({
      success: false,
      message: 'Internal server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    }, { status: 500 });
  }
}