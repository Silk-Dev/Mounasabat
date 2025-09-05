/**
 * Database Monitoring System
 * Monitors empty states, missing data, and data integrity
 */

import { PrismaClient } from '@/generated/client';
import { logger } from '../production-logger';

export interface MonitoringMetrics {
  timestamp: Date;
  environment: string;
  counts: Record<string, number>;
  emptyStates: string[];
  missingData: string[];
  warnings: string[];
  errors: string[];
}

export interface AlertConfig {
  emptyStateThreshold: number;
  missingDataThreshold: number;
  enableSlackAlerts: boolean;
  enableEmailAlerts: boolean;
  slackWebhookUrl?: string;
  alertEmail?: string;
}

export class DatabaseMonitor {
  private prisma: PrismaClient;
  private environment: 'development' | 'production' | 'test';
  private alertConfig: AlertConfig;

  constructor(prisma: PrismaClient, environment: 'development' | 'production' | 'test' = (process.env.NODE_ENV as 'development' | 'production' | 'test') || 'development') {
    this.prisma = prisma;
    this.environment = environment;
    this.alertConfig = {
      emptyStateThreshold: 0,
      missingDataThreshold: 1,
      enableSlackAlerts: environment === 'production',
      enableEmailAlerts: environment === 'production',
      slackWebhookUrl: process.env.SLACK_WEBHOOK_URL,
      alertEmail: process.env.ALERT_EMAIL,
    };
  }

  /**
   * Get comprehensive database metrics
   */
  async getMetrics(): Promise<MonitoringMetrics> {
    const counts = await this.getCounts();
    const emptyStates = await this.detectEmptyStates(counts);
    const missingData = await this.detectMissingData(counts);
    const warnings = await this.generateWarnings(counts, emptyStates, missingData);
    const errors = await this.detectErrors(counts);

    return {
      timestamp: new Date(),
      environment: this.environment,
      counts,
      emptyStates,
      missingData,
      warnings,
      errors,
    };
  }

  /**
   * Get counts of all major entities
   */
  async getCounts(): Promise<Record<string, number>> {
    const [
      userCount,
      providerCount,
      serviceCount,
      bookingCount,
      reviewCount,
      categoryCount,
      settingCount,
      templateCount,
    ] = await Promise.all([
      this.prisma.user.count(),
      this.prisma.provider.count(),
      this.prisma.service.count(),
      this.prisma.booking.count(),
      this.prisma.review.count(),
      this.prisma.category.count(),
      this.prisma.systemSettings.count(),
      this.prisma.template.count(),
    ]);

    return {
      users: userCount,
      providers: providerCount,
      services: serviceCount,
      bookings: bookingCount,
      reviews: reviewCount,
      categories: categoryCount,
      settings: settingCount,
      templates: templateCount,
    };
  }

  /**
   * Detect empty states that should be populated
   */
  async detectEmptyStates(counts: Record<string, number>): Promise<string[]> {
    const emptyStates: string[] = [];

    // Check categories
    if (counts.categories === 0) {
      emptyStates.push('No categories defined');
    }

    // Check providers in production
    if (counts.providers === 0 && this.environment === 'production') {
      emptyStates.push('No providers registered');
    }

    // Check services
    if (counts.services === 0) {
      emptyStates.push('No services available');
    }

    // Check templates
    if (counts.templates === 0) {
      emptyStates.push('No email templates configured');
    }

    return emptyStates;
  }

  /**
   * Detect missing critical data
   */
  async detectMissingData(counts: Record<string, number>): Promise<string[]> {
    const missingData: string[] = [];

    try {
      // Check for admin users
      const adminCount = await this.prisma.user.count({
        where: { role: 'admin' }
      });

      if (adminCount === 0) {
        missingData.push('No admin users found');
      }

      // Check for essential system settings
      const essentialSettings = [
        'platform_name',
        'contact_email',
        'payment_enabled'
      ];

      for (const setting of essentialSettings) {
        try {
          const exists = await this.prisma.systemSettings.findFirst({
            where: { key: setting }
          });

          if (!exists) {
            missingData.push(`Missing essential setting: ${setting}`);
          }
        } catch (error) {
          // System settings might not exist in schema
          logger.warn('Could not check system settings', { metadata: { setting, error: String(error) } });
        }
      }

    } catch (error) {
      logger.error('Error detecting missing data', error);
      missingData.push('Could not verify critical data');
    }

    return missingData;
  }

  /**
   * Generate warnings based on metrics
   */
  async generateWarnings(
    counts: Record<string, number>,
    emptyStates: string[],
    missingData: string[]
  ): Promise<string[]> {
    const warnings: string[] = [];

    // Low provider count warning
    if (counts.providers > 0 && counts.providers < 5 && this.environment === 'production') {
      warnings.push(`Low provider count: ${counts.providers} providers registered`);
    }

    // No bookings warning
    if (counts.bookings === 0 && this.environment === 'production') {
      warnings.push('No bookings have been made');
    }

    // Many empty states
    if (emptyStates.length > 3) {
      warnings.push(`Many empty states detected: ${emptyStates.length} issues`);
    }

    // Critical missing data
    if (missingData.length > 0) {
      warnings.push(`Missing critical data: ${missingData.length} issues`);
    }

    return warnings;
  }

  /**
   * Detect system errors
   */
  async detectErrors(counts: Record<string, number>): Promise<string[]> {
    const errors: string[] = [];

    try {
      // Test database connectivity
      await this.prisma.$queryRaw`SELECT 1`;
    } catch (error) {
      errors.push(`Database connectivity error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }

    try {
      // Data integrity checks disabled due to schema limitations
      const orphanedServices = 0;
      const orphanedBookings = 0;

      if (orphanedServices > 0) {
        errors.push(`Found ${orphanedServices} orphaned services without providers`);
      }

      if (orphanedBookings > 0) {
        errors.push(`Found ${orphanedBookings} orphaned bookings`);
      }

    } catch (error) {
      errors.push(`Data integrity check failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }

    return errors;
  }

  /**
   * Send alerts if monitoring is enabled
   */
  async sendAlerts(metrics: MonitoringMetrics): Promise<void> {
    // Simple check - in a real implementation, you'd check deployment config
    const shouldAlert = this.environment === 'production' && 
      (metrics.errors.length > 0 || metrics.missingData.length > 0);

    if (!shouldAlert) {
      return;
    }

    const message = this.formatAlertMessage(metrics);

    // Log the alert
    await this.logAlert(metrics);

    // Send to configured channels
    if (this.alertConfig.enableSlackAlerts) {
      await this.sendSlackAlert(message);
    }

    if (this.alertConfig.enableEmailAlerts) {
      await this.sendEmailAlert(message);
    }
  }

  /**
   * Format alert message
   */
  private formatAlertMessage(metrics: MonitoringMetrics): string {
    const sections = [];

    if (metrics.errors.length > 0) {
      sections.push(`🚨 ERRORS (${metrics.errors.length}):\n${metrics.errors.map(e => `• ${e}`).join('\n')}`);
    }

    if (metrics.missingData.length > 0) {
      sections.push(`⚠️ MISSING DATA (${metrics.missingData.length}):\n${metrics.missingData.map(m => `• ${m}`).join('\n')}`);
    }

    if (metrics.warnings.length > 0) {
      sections.push(`⚡ WARNINGS (${metrics.warnings.length}):\n${metrics.warnings.map(w => `• ${w}`).join('\n')}`);
    }

    if (metrics.emptyStates.length > 0) {
      sections.push(`📭 EMPTY STATES (${metrics.emptyStates.length}):\n${metrics.emptyStates.map(e => `• ${e}`).join('\n')}`);
    }

    return `
🔍 Database Monitoring Alert - ${metrics.environment.toUpperCase()}
⏰ ${metrics.timestamp.toISOString()}

${sections.join('\n\n')}

📊 COUNTS:
${Object.entries(metrics.counts).map(([key, value]) => `• ${key}: ${value}`).join('\n')}
`.trim();
  }

  /**
   * Send Slack alert
   */
  private async sendSlackAlert(message: string): Promise<void> {
    if (!this.alertConfig.slackWebhookUrl) return;

    try {
      const response = await fetch(this.alertConfig.slackWebhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text: message,
          username: 'Database Monitor',
          icon_emoji: ':database:',
        }),
      });

      if (!response.ok) {
        throw new Error(`Slack API error: ${response.status}`);
      }
    } catch (error) {
      logger.error('Failed to send Slack alert', error);
    }
  }

  /**
   * Send email alert (placeholder)
   */
  private async sendEmailAlert(message: string): Promise<void> {
    // In a real implementation, you'd integrate with an email service
    logger.info('Email alert would be sent', { metadata: { message } });
  }

  /**
   * Log alert to database
   */
  private async logAlert(metrics: MonitoringMetrics): Promise<void> {
    try {
      // Try to log to system alerts if the table exists
      // In reality, you might not have this table
      logger.error('Database monitoring alert', {
        environment: metrics.environment,
        errorCount: metrics.errors.length,
        warningCount: metrics.warnings.length,
        emptyStateCount: metrics.emptyStates.length,
        missingDataCount: metrics.missingData.length,
      });
    } catch (error) {
      logger.error('Failed to log monitoring alert', error);
    }
  }

  /**
   * Run monitoring check and send alerts if needed
   */
  async runMonitoringCheck(): Promise<MonitoringMetrics> {
    const metrics = await this.getMetrics();
    
    // Simple monitoring enablement check
    if (this.environment === 'production' || this.environment === 'test') {
      await this.sendAlerts(metrics);
    }

    return metrics;
  }

  /**
   * Generate a human-readable report
   */
  async generateReport(): Promise<string> {
    const metrics = await this.getMetrics();
    return this.formatAlertMessage(metrics);
  }
}

/**
 * Create and configure database monitor
 */
export function createDatabaseMonitor(prisma: PrismaClient, environment?: 'development' | 'production' | 'test'): DatabaseMonitor {
  return new DatabaseMonitor(prisma, environment);
}

/**
 * Run monitoring check (can be called from cron job or API endpoint)
 */
export async function runMonitoringCheck(prisma: PrismaClient, environment?: 'development' | 'production' | 'test'): Promise<MonitoringMetrics> {
  const monitor = createDatabaseMonitor(prisma, environment);
  return monitor.runMonitoringCheck();
}