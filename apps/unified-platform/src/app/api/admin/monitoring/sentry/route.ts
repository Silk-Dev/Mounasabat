import { NextRequest, NextResponse } from 'next/server';
import { sentryDashboard } from '@/lib/sentry-dashboard';
import { sentryConfig } from '@/lib/sentry-config';
import { logger } from '@/lib/production-logger';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';

export async function GET(request: NextRequest) {
  try {
    // Check authentication and admin role
    const session = await auth.api.getSession({headers: await headers()});
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const timeRange = searchParams.get('timeRange') as '1h' | '24h' | '7d' | '30d' || '24h';
    const action = searchParams.get('action');

    switch (action) {
      case 'metrics':
        const metrics = await sentryDashboard.getDashboardMetrics(timeRange);
        return NextResponse.json({ success: true, data: metrics });

      case 'alerts':
        const alerts = await sentryDashboard.getActiveAlerts();
        return NextResponse.json({ success: true, data: alerts });

      case 'error-trends':
        const errorTrends = await sentryDashboard.getErrorTrends(timeRange);
        return NextResponse.json({ success: true, data: errorTrends });

      case 'performance-trends':
        const performanceTrends = await sentryDashboard.getPerformanceTrends(timeRange);
        return NextResponse.json({ success: true, data: performanceTrends });

      default:
        // Return all dashboard data
        const [dashboardMetrics, activeAlerts, errorTrendData, performanceTrendData] = await Promise.all([
          sentryDashboard.getDashboardMetrics(timeRange),
          sentryDashboard.getActiveAlerts(),
          sentryDashboard.getErrorTrends(timeRange),
          sentryDashboard.getPerformanceTrends(timeRange),
        ]);

        return NextResponse.json({
          success: true,
          data: {
            metrics: dashboardMetrics,
            alerts: activeAlerts,
            errorTrends: errorTrendData,
            performanceTrends: performanceTrendData,
          },
        });
    }
  } catch (error) {
    logger.error('Sentry monitoring API error', error as Error, {
      component: 'sentry-monitoring-api',
      url: request.url,
    });

    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
export async function POST(request: NextRequest) {
  try {
    // Check authentication and admin role
    const session = await auth.api.getSession({headers: await headers()});
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { action, ...data } = body;

    switch (action) {
      case 'create-alert':
        await sentryDashboard.createCustomAlert(
          data.type,
          data.severity,
          data.title,
          data.message,
          data.metadata,
          data.affectedComponents
        );
        return NextResponse.json({ success: true, message: 'Alert created successfully' });

      case 'resolve-alert':
        await sentryDashboard.resolveAlert(data.alertId, session.user.id);
        return NextResponse.json({ success: true, message: 'Alert resolved successfully' });

      case 'test-alert':
        sentryConfig.triggerTestAlert(data.type);
        return NextResponse.json({ success: true, message: 'Test alert triggered' });

      case 'update-tags':
        sentryConfig.setCustomTags(data.tags);
        return NextResponse.json({ success: true, message: 'Tags updated successfully' });

      case 'set-user-context':
        sentryConfig.setUserContext(data.user);
        return NextResponse.json({ success: true, message: 'User context set successfully' });

      default:
        return NextResponse.json(
          { success: false, error: 'Invalid action' },
          { status: 400 }
        );
    }
  } catch (error) {
    logger.error('Sentry monitoring POST API error', error, {
      component: 'sentry-monitoring-api',
      url: request.url,
    });

    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}