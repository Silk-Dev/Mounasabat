import * as Sentry from '@sentry/nextjs';
import { logger } from './production-logger';
import { prisma } from './prisma';

export interface SentryDashboardMetrics {
  errorCount: number;
  errorRate: number;
  performanceMetrics: {
    averageResponseTime: number;
    slowestEndpoints: Array<{
      endpoint: string;
      averageTime: number;
      count: number;
    }>;
    p95ResponseTime: number;
    p99ResponseTime: number;
  };
  userImpact: {
    affectedUsers: number;
    totalUsers: number;
    impactPercentage: number;
  };
  systemHealth: {
    uptime: number;
    memoryUsage: number;
    errorsByCategory: Record<string, number>;
    criticalErrors: number;
  };
  trends: {
    errorTrend: 'increasing' | 'decreasing' | 'stable';
    performanceTrend: 'improving' | 'degrading' | 'stable';
    userSatisfactionTrend: 'improving' | 'degrading' | 'stable';
  };
}

export interface SentryAlert {
  id: string;
  type: 'error_threshold' | 'performance_degradation' | 'high_error_rate' | 'system_failure';
  severity: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  message: string;
  timestamp: Date;
  resolved: boolean;
  resolvedAt?: Date;
  metadata: Record<string, any>;
  affectedComponents: string[];
  actionRequired: boolean;
}

export class SentryDashboardService {
  private static instance: SentryDashboardService;
  private alertThresholds = {
    errorRate: 0.05, // 5%
    responseTime: 2000, // 2 seconds
    memoryUsage: 512, // 512MB
    criticalErrorCount: 10, // per hour
  };

  static getInstance(): SentryDashboardService {
    if (!SentryDashboardService.instance) {
      SentryDashboardService.instance = new SentryDashboardService();
    }
    return SentryDashboardService.instance;
  }

  async getDashboardMetrics(timeRange: '1h' | '24h' | '7d' | '30d' = '24h'): Promise<SentryDashboardMetrics> {
    try {
      const timeRangeMs = this.getTimeRangeMs(timeRange);
      const startTime = new Date(Date.now() - timeRangeMs);

      // Get error metrics from database
      const errorMetrics = await this.getErrorMetrics(startTime);
      
      // Get performance metrics
      const performanceMetrics = await this.getPerformanceMetrics(startTime);
      
      // Get user impact metrics
      const userImpact = await this.getUserImpactMetrics(startTime);
      
      // Get system health metrics
      const systemHealth = await this.getSystemHealthMetrics(startTime);
      
      // Calculate trends
      const trends = await this.calculateTrends(startTime, timeRange);

      return {
        errorCount: errorMetrics.count,
        errorRate: errorMetrics.rate,
        performanceMetrics,
        userImpact,
        systemHealth,
        trends,
      };
    } catch (error) {
      logger.error('Failed to get dashboard metrics', error, {
        component: 'sentry-dashboard',
      });
      
      // Return default metrics on error
      return this.getDefaultMetrics();
    }
  }

  async getActiveAlerts(): Promise<SentryAlert[]> {
    try {
      // Get alerts from database
      const dbAlerts = await prisma.systemAlert.findMany({
        where: {
          resolved: false,
          createdAt: {
            gte: new Date(Date.now() - 24 * 60 * 60 * 1000), // Last 24 hours
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
      });

      // Convert to SentryAlert format
      const alerts: SentryAlert[] = dbAlerts.map(alert => ({
        id: alert.id,
        type: this.mapAlertType(alert.type),
        severity: alert.severity.toLowerCase() as any,
        title: this.extractTitleFromMessage(alert.message),
        message: alert.message,
        timestamp: alert.createdAt,
        resolved: alert.resolved,
        resolvedAt: alert.resolvedAt,
        metadata: alert.metadata as Record<string, any>,
        affectedComponents: this.extractAffectedComponents(alert.metadata as any),
        actionRequired: alert.severity === 'CRITICAL' || alert.severity === 'HIGH',
      }));

      // Add real-time Sentry alerts
      const sentryAlerts = await this.getSentryAlerts();
      alerts.push(...sentryAlerts);

      return alerts.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
    } catch (error) {
      logger.error('Failed to get active alerts', error, {
        component: 'sentry-dashboard',
      });
      return [];
    }
  }

  async createCustomAlert(
    type: SentryAlert['type'],
    severity: SentryAlert['severity'],
    title: string,
    message: string,
    metadata: Record<string, any> = {},
    affectedComponents: string[] = []
  ): Promise<void> {
    try {
      // Store in database
      await prisma.systemAlert.create({
        data: {
          type: type.toUpperCase(),
          severity: severity.toUpperCase(),
          message: `${title}: ${message}`,
          metadata,
          environment: process.env.NODE_ENV || 'development',
          resolved: false,
        },
      });

      // Send to Sentry
      Sentry.captureMessage(message, {
        level: this.mapSeverityToSentryLevel(severity),
        tags: {
          alertType: type,
          severity,
          component: 'custom-alert',
        },
        extra: {
          title,
          metadata,
          affectedComponents,
        },
      });

      logger.info('Custom alert created', {
        component: 'sentry-dashboard',
        type,
        severity,
        title,
        affectedComponents,
      });
    } catch (error) {
      logger.error('Failed to create custom alert', error, {
        component: 'sentry-dashboard',
        type,
        severity,
        title,
      });
    }
  }

  async resolveAlert(alertId: string, resolvedBy?: string): Promise<void> {
    try {
      await prisma.systemAlert.update({
        where: { id: alertId },
        data: {
          resolved: true,
          resolvedAt: new Date(),
          metadata: {
            resolvedBy: resolvedBy || 'system',
          },
        },
      });

      logger.info('Alert resolved', {
        component: 'sentry-dashboard',
        alertId,
        resolvedBy,
      });
    } catch (error) {
      logger.error('Failed to resolve alert', error, {
        component: 'sentry-dashboard',
        alertId,
      });
    }
  }

  async getErrorTrends(timeRange: '1h' | '24h' | '7d' | '30d' = '24h'): Promise<Array<{
    timestamp: Date;
    errorCount: number;
    errorRate: number;
  }>> {
    try {
      const timeRangeMs = this.getTimeRangeMs(timeRange);
      const startTime = new Date(Date.now() - timeRangeMs);
      const bucketSize = this.getBucketSize(timeRange);

      const errorTrends = await prisma.errorLog.groupBy({
        by: ['createdAt'],
        where: {
          createdAt: {
            gte: startTime,
          },
        },
        _count: {
          id: true,
        },
        orderBy: {
          createdAt: 'asc',
        },
      });

      // Group by time buckets
      const buckets = new Map<string, { errorCount: number; totalRequests: number }>();
      
      errorTrends.forEach(trend => {
        const bucketKey = this.getBucketKey(trend.createdAt, bucketSize);
        const existing = buckets.get(bucketKey) || { errorCount: 0, totalRequests: 0 };
        existing.errorCount += trend._count.id;
        existing.totalRequests += trend._count.id; // Simplified - would need actual request count
        buckets.set(bucketKey, existing);
      });

      return Array.from(buckets.entries()).map(([timestamp, data]) => ({
        timestamp: new Date(timestamp),
        errorCount: data.errorCount,
        errorRate: data.totalRequests > 0 ? data.errorCount / data.totalRequests : 0,
      }));
    } catch (error) {
      logger.error('Failed to get error trends', error, {
        component: 'sentry-dashboard',
      });
      return [];
    }
  }

  async getPerformanceTrends(timeRange: '1h' | '24h' | '7d' | '30d' = '24h'): Promise<Array<{
    timestamp: Date;
    averageResponseTime: number;
    p95ResponseTime: number;
    throughput: number;
  }>> {
    try {
      const timeRangeMs = this.getTimeRangeMs(timeRange);
      const startTime = new Date(Date.now() - timeRangeMs);

      // Get performance metrics from database
      const performanceMetrics = await prisma.performanceMetric.findMany({
        where: {
          createdAt: {
            gte: startTime,
          },
          metricType: 'api_response_time',
        },
        orderBy: {
          createdAt: 'asc',
        },
      });

      // Group by time buckets and calculate statistics
      const bucketSize = this.getBucketSize(timeRange);
      const buckets = new Map<string, number[]>();

      performanceMetrics.forEach(metric => {
        const bucketKey = this.getBucketKey(metric.createdAt, bucketSize);
        const existing = buckets.get(bucketKey) || [];
        existing.push(metric.value);
        buckets.set(bucketKey, existing);
      });

      return Array.from(buckets.entries()).map(([timestamp, values]) => ({
        timestamp: new Date(timestamp),
        averageResponseTime: values.reduce((sum, val) => sum + val, 0) / values.length,
        p95ResponseTime: this.calculatePercentile(values, 95),
        throughput: values.length,
      }));
    } catch (error) {
      logger.error('Failed to get performance trends', error, {
        component: 'sentry-dashboard',
      });
      return [];
    }
  }

  private async getErrorMetrics(startTime: Date) {
    const errorCount = await prisma.errorLog.count({
      where: {
        createdAt: { gte: startTime },
        level: 'error',
      },
    });

    // Simplified error rate calculation - would need actual request count
    const totalRequests = Math.max(errorCount * 10, 1); // Estimate
    const errorRate = errorCount / totalRequests;

    return { count: errorCount, rate: errorRate };
  }

  private async getPerformanceMetrics(startTime: Date) {
    const performanceData = await prisma.performanceMetric.findMany({
      where: {
        createdAt: { gte: startTime },
        metricType: 'api_response_time',
      },
    });

    const responseTimes = performanceData.map(p => p.value);
    const averageResponseTime = responseTimes.length > 0 
      ? responseTimes.reduce((sum, time) => sum + time, 0) / responseTimes.length 
      : 0;

    // Group by endpoint to find slowest
    const endpointTimes = new Map<string, number[]>();
    performanceData.forEach(metric => {
      const endpoint = (metric.metadata as any)?.endpoint || 'unknown';
      const times = endpointTimes.get(endpoint) || [];
      times.push(metric.value);
      endpointTimes.set(endpoint, times);
    });

    const slowestEndpoints = Array.from(endpointTimes.entries())
      .map(([endpoint, times]) => ({
        endpoint,
        averageTime: times.reduce((sum, time) => sum + time, 0) / times.length,
        count: times.length,
      }))
      .sort((a, b) => b.averageTime - a.averageTime)
      .slice(0, 5);

    return {
      averageResponseTime,
      slowestEndpoints,
      p95ResponseTime: this.calculatePercentile(responseTimes, 95),
      p99ResponseTime: this.calculatePercentile(responseTimes, 99),
    };
  }

  private async getUserImpactMetrics(startTime: Date) {
    // Get unique users affected by errors
    const affectedUsersData = await prisma.errorLog.findMany({
      where: {
        createdAt: { gte: startTime },
        level: 'error',
      },
      select: {
        context: true,
      },
    });

    const affectedUserIds = new Set<string>();
    affectedUsersData.forEach(error => {
      const userId = (error.context as any)?.userId;
      if (userId) {
        affectedUserIds.add(userId);
      }
    });

    // Get total active users (simplified)
    const totalUsers = await prisma.user.count({
      where: {
        lastLoginAt: {
          gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // Last 7 days
        },
      },
    });

    const affectedUsers = affectedUserIds.size;
    const impactPercentage = totalUsers > 0 ? (affectedUsers / totalUsers) * 100 : 0;

    return {
      affectedUsers,
      totalUsers,
      impactPercentage,
    };
  }

  private async getSystemHealthMetrics(startTime: Date) {
    const uptime = process.uptime();
    const memoryUsage = process.memoryUsage().heapUsed / 1024 / 1024; // MB

    // Get errors by category
    const errorsByCategory = await prisma.errorLog.groupBy({
      by: ['level'],
      where: {
        createdAt: { gte: startTime },
      },
      _count: {
        id: true,
      },
    });

    const errorCategoryCounts = errorsByCategory.reduce((acc, item) => {
      acc[item.level] = item._count.id;
      return acc;
    }, {} as Record<string, number>);

    const criticalErrors = errorCategoryCounts.error || 0;

    return {
      uptime,
      memoryUsage,
      errorsByCategory: errorCategoryCounts,
      criticalErrors,
    };
  }

  private async calculateTrends(startTime: Date, timeRange: string) {
    // Compare with previous period
    const timeRangeMs = this.getTimeRangeMs(timeRange);
    const previousStartTime = new Date(startTime.getTime() - timeRangeMs);

    const currentErrors = await prisma.errorLog.count({
      where: { createdAt: { gte: startTime } },
    });

    const previousErrors = await prisma.errorLog.count({
      where: {
        createdAt: {
          gte: previousStartTime,
          lt: startTime,
        },
      },
    });

    const errorTrend = currentErrors > previousErrors * 1.1 ? 'increasing' 
      : currentErrors < previousErrors * 0.9 ? 'decreasing' 
      : 'stable';

    // Simplified trends - would need more sophisticated analysis
    return {
      errorTrend,
      performanceTrend: 'stable' as const,
      userSatisfactionTrend: 'stable' as const,
    };
  }

  private async getSentryAlerts(): Promise<SentryAlert[]> {
    // This would integrate with Sentry's API to get real-time alerts
    // For now, return empty array as this requires Sentry API setup
    return [];
  }

  private getTimeRangeMs(timeRange: string): number {
    switch (timeRange) {
      case '1h': return 60 * 60 * 1000;
      case '24h': return 24 * 60 * 60 * 1000;
      case '7d': return 7 * 24 * 60 * 60 * 1000;
      case '30d': return 30 * 24 * 60 * 60 * 1000;
      default: return 24 * 60 * 60 * 1000;
    }
  }

  private getBucketSize(timeRange: string): number {
    switch (timeRange) {
      case '1h': return 5 * 60 * 1000; // 5 minutes
      case '24h': return 60 * 60 * 1000; // 1 hour
      case '7d': return 6 * 60 * 60 * 1000; // 6 hours
      case '30d': return 24 * 60 * 60 * 1000; // 1 day
      default: return 60 * 60 * 1000;
    }
  }

  private getBucketKey(date: Date, bucketSize: number): string {
    const timestamp = Math.floor(date.getTime() / bucketSize) * bucketSize;
    return new Date(timestamp).toISOString();
  }

  private calculatePercentile(values: number[], percentile: number): number {
    if (values.length === 0) return 0;
    
    const sorted = values.sort((a, b) => a - b);
    const index = Math.ceil((percentile / 100) * sorted.length) - 1;
    return sorted[Math.max(0, index)];
  }

  private mapAlertType(type: string): SentryAlert['type'] {
    switch (type.toLowerCase()) {
      case 'error': return 'error_threshold';
      case 'performance': return 'performance_degradation';
      case 'health_check': return 'system_failure';
      default: return 'error_threshold';
    }
  }

  private mapSeverityToSentryLevel(severity: string): Sentry.SeverityLevel {
    switch (severity.toLowerCase()) {
      case 'critical': return 'fatal';
      case 'high': return 'error';
      case 'medium': return 'warning';
      case 'low': return 'info';
      default: return 'error';
    }
  }

  private extractTitleFromMessage(message: string): string {
    const colonIndex = message.indexOf(':');
    return colonIndex > 0 ? message.substring(0, colonIndex) : message;
  }

  private extractAffectedComponents(metadata: any): string[] {
    if (metadata?.affectedComponents && Array.isArray(metadata.affectedComponents)) {
      return metadata.affectedComponents;
    }
    if (metadata?.component) {
      return [metadata.component];
    }
    return [];
  }

  private getDefaultMetrics(): SentryDashboardMetrics {
    return {
      errorCount: 0,
      errorRate: 0,
      performanceMetrics: {
        averageResponseTime: 0,
        slowestEndpoints: [],
        p95ResponseTime: 0,
        p99ResponseTime: 0,
      },
      userImpact: {
        affectedUsers: 0,
        totalUsers: 0,
        impactPercentage: 0,
      },
      systemHealth: {
        uptime: process.uptime(),
        memoryUsage: process.memoryUsage().heapUsed / 1024 / 1024,
        errorsByCategory: {},
        criticalErrors: 0,
      },
      trends: {
        errorTrend: 'stable',
        performanceTrend: 'stable',
        userSatisfactionTrend: 'stable',
      },
    };
  }
}

// Export singleton instance
export const sentryDashboard = SentryDashboardService.getInstance();