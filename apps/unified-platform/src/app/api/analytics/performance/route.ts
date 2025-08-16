import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { logger } from '../../../../lib/production-logger';

// Store performance metrics
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { type, data, userAgent, timestamp } = body;

    // Validate the request
    if (!type || !data || !timestamp) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Store in database (you might want to use a time-series database for production)
    await prisma.performanceMetric.create({
      data: {
        type,
        data: JSON.stringify(data),
        userAgent,
        timestamp: new Date(timestamp),
        url: data.url || '',
        sessionId: request.headers.get('x-session-id') || 'anonymous',
      },
    });

    // Log critical performance issues
    if (shouldLogCriticalIssue(type, data)) {
      logger.warn(`Critical performance issue detected:`, {
        type,
        data,
        userAgent,
        timestamp,
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    logger.error('Error storing performance metric:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Get performance analytics
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const url = searchParams.get('url');

    const whereClause: any = {};
    
    if (type) whereClause.type = type;
    if (url) whereClause.url = url;
    if (startDate && endDate) {
      whereClause.timestamp = {
        gte: new Date(startDate),
        lte: new Date(endDate),
      };
    }

    const metrics = await prisma.performanceMetric.findMany({
      where: whereClause,
      orderBy: { timestamp: 'desc' },
      take: 1000, // Limit to prevent large responses
    });

    // Aggregate the data
    const aggregated = aggregateMetrics(metrics);

    return NextResponse.json(aggregated);
  } catch (error) {
    logger.error('Error fetching performance metrics:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

function shouldLogCriticalIssue(type: string, data: any): boolean {
  switch (type) {
    case 'LCP':
      return data.value > 4000; // LCP > 4s is poor
    case 'FID':
      return data.value > 300; // FID > 300ms is poor
    case 'CLS':
      return data.value > 0.25; // CLS > 0.25 is poor
    case 'LongTask':
      return data.duration > 500; // Long tasks > 500ms
    case 'APIRequest':
      return data.duration > 5000 || data.status >= 500; // Slow or error responses
    default:
      return false;
  }
}

function aggregateMetrics(metrics: any[]) {
  const aggregated: any = {
    total: metrics.length,
    byType: {},
    byUrl: {},
    timeline: {},
  };

  metrics.forEach(metric => {
    const data = JSON.parse(metric.data);
    
    // Aggregate by type
    if (!aggregated.byType[metric.type]) {
      aggregated.byType[metric.type] = {
        count: 0,
        values: [],
        averages: {},
      };
    }
    
    aggregated.byType[metric.type].count++;
    
    // Store values for statistical analysis
    if (typeof data.value === 'number') {
      aggregated.byType[metric.type].values.push(data.value);
    }
    
    // Aggregate by URL
    if (!aggregated.byUrl[metric.url]) {
      aggregated.byUrl[metric.url] = { count: 0 };
    }
    aggregated.byUrl[metric.url].count++;
    
    // Timeline data (group by hour)
    const hour = new Date(metric.timestamp).toISOString().slice(0, 13);
    if (!aggregated.timeline[hour]) {
      aggregated.timeline[hour] = { count: 0 };
    }
    aggregated.timeline[hour].count++;
  });

  // Calculate averages and percentiles
  Object.keys(aggregated.byType).forEach(type => {
    const values = aggregated.byType[type].values;
    if (values.length > 0) {
      values.sort((a, b) => a - b);
      aggregated.byType[type].averages = {
        mean: values.reduce((a, b) => a + b, 0) / values.length,
        median: values[Math.floor(values.length / 2)],
        p75: values[Math.floor(values.length * 0.75)],
        p95: values[Math.floor(values.length * 0.95)],
        p99: values[Math.floor(values.length * 0.99)],
      };
    }
  });

  return aggregated;
}