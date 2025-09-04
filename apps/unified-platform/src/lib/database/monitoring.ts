/**
 * Database Monitoring System
 * Monitors empty states, missing data, and data integrity
 */

import { PrismaClient } from '@prisma/client';
import { isMonitoringEnabled } from '../../../../../deployment.config';
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
  private environment: string;
  private alertConfig: AlertConfig;

  constructor(prisma: PrismaClient, environment = process.env.NODE_ENV || 'development') {
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
   * Get record counts for all tables
   */
  async getCounts(): Promise<Record<string, number>> {
    const [
      userCount,
      providerCount,
      serviceCount,
      bookingCount,
      reviewCount,
      categoryCount,
      locationCount,
      settingCount,
      templateCount,
    ] = await Promise.all([
      this.prisma.user.count(),
      this.prisma.provider.count(),
      this.prisma.service.count(),
      this.prisma.booking.count(),
      this.prisma.review.count(),
      this.prisma.category.count(),
      this.prisma.location.count(),
      this.prisma.platformSetting.count(),
      this.prisma.emailTemplate.count(),
    ]);

    return {
      users: userCount,
      providers: providerCount,
      services: serviceCount,
      bookings: bookingCount,
      reviews: reviewCount,
      categories: categoryCount,
      locations: locationCount,
      settings: settingCount,
      emailTemplates: templateCount,
    };
  }

  /**
   * Detect empty states that might affect user experience
   */
  async detectEmptyStates(counts: Record<string, number>): Promise<string[]> {
    const emptyStates: string[] = [];

    // Critical empty states
    if (counts.categories === 0) {
      emptyStates.push('No service categories available - users cannot browse services');
    }

    if (counts.locations === 0) {
      emptyStates.push('No locations available - location-based search will fail');
    }

    if (counts.settings === 0) {
      emptyStates.push('No platform settings configured - system may not function properly');
    }

    if (counts.emailTemplates === 0) {
      emptyStates.push('No email templates configured - notifications will fail');
    }

    // Business-critical empty states
    if (counts.providers === 0) {
      emptyStates.push('No service providers available - no services can be booked');
    }

    if (counts.services === 0) {
      emptyStates.push('No services available - users cannot make bookings');
    }

    // User experience empty states
    if (counts.users === 0 && this.environment === 'production') {
      emptyStates.push('No users registered - platform has no active users');
    }

    if (counts.bookings === 0 && this.environment === 'production') {
      emptyStates.push('No bookings made - platform has no transaction history');
    }

    if (counts.reviews === 0 && this.environment === 'production') {
      emptyStates.push('No reviews available - users cannot see service quality feedback');
    }

    return emptyStates;
  }

  /**
   * Detect missing essential data
   */
  async detectMissingData(counts: Record<string, number>): Promise<string[]> {
    const missingData: string[] = [];

    // Check for admin users
    const adminCount = await this.prisma.user.count({
      where: { role: 'ADMIN' },
    });

    if (adminCount === 0) {
      missingData.push('No admin users found - platform cannot be administered');
    }

    // Check for active categories
    const activeCategoryCount = await this.prisma.category.count({
      where: { isActive: true },
    });

    if (activeCategoryCount === 0 && counts.categories > 0) {
      missingData.push('No active categories - all categories are disabled');
    }

    // Check for verified providers
    const verifiedProviderCount = await this.prisma.provider.count({
      where: { isVerified: true },
    });

    if (verifiedProviderCount === 0 && counts.providers > 0) {
      missingData.push('No verified providers - no services can be booked');
    }

    // Check for active services
    const activeServiceCount = await this.prisma.service.count({
      where: { isActive: true },
    });

    if (activeServiceCount === 0 && counts.services > 0) {
      missingData.push('No active services - all services are disabled');
    }

    // Check for essential platform settings
    const essentialSettings = [
      'platform_commission',
      'min_booking_amount',
      'max_booking_amount',
    ];

    for (const setting of essentialSettings) {
      const exists = await this.prisma.platformSetting.findUnique({
        where: { key: setting },
      });

      if (!exists) {
        missingData.push(`Missing essential setting: ${setting}`);
      }
    }

    return missingData;
  }

  /**
   * Generate warnings based on data analysis
   */
  async generateWarnings(
    counts: Record<string, number>,
    emptyStates: string[],
    missingData: string[]
  ): Promise<string[]> {
    const warnings: string[] = [];

    // Low data warnings
    if (counts.providers > 0 && counts.providers < 5 && this.environment === 'production') {
      warnings.push(`Low provider count (${counts.providers}) - consider onboarding more providers`);
    }

    if (counts.services > 0 && counts.services < 10 && this.environment === 'production') {
      warnings.push(`Low service count (${counts.services}) - limited options for users`);
    }

    // Data quality warnings
    const providersWithoutServices = await this.prisma.provider.count({
      where: {
        services: {
          none: {},
        },
      },
    });

    if (providersWithoutServices > 0) {
      warnings.push(`${providersWithoutServices} providers have no services listed`);
    }

    // Review warnings
    const servicesWithoutReviews = await this.prisma.service.count({
      where: {
        reviews: {
          none: {},
        },
      },
    });

    if (servicesWithoutReviews > counts.services * 0.8 && counts.services > 0) {
      warnings.push(`${servicesWithoutReviews} services have no reviews - may affect user trust`);
    }

    return warnings;
  }

  /**
   * Detect critical errors
   */
  async detectErrors(counts: Record<string, number>): Promise<string[]> {
    const errors: string[] = [];

    try {
      // Test database connectivity
      await this.prisma.$queryRaw`SELECT 1`;
    } catch (error) {
      errors.push(`Database connectivity error: ${error.message}`);
    }

    // Check for data integrity issues
    try {
      // Check for orphaned services (services without providers)
      const orphanedServices = await this.prisma.service.count({
        where: {
          provider: null,
        },
      });

      if (orphanedServices > 0) {
        errors.push(`${orphanedServices} orphaned services found (no associated provider)`);
      }

      // Check for bookings with invalid states
      const invalidBookings = await this.prisma.booking.count({
        where: {
          OR: [
            { service: null },
            { customer: null },
          ],
        },
      });

      if (invalidBookings > 0) {
        errors.push(`${invalidBookings} bookings with invalid references found`);
      }

    } catch (error) {
      errors.push(`Data integrity check failed: ${error.message}`);
    }

    return errors;
  }

  /**
   * Send alerts based on monitoring results
   */
  async sendAlerts(metrics: MonitoringMetrics): Promise<void> {
    if (!isMonitoringEnabled('alertOnEmptyStates', this.environment) && 
        !isMonitoringEnabled('alertOnMissingData', this.environment)) {
      return;
    }

    const shouldAlert = 
      metrics.emptyStates.length > this.alertConfig.emptyStateThreshold ||
      metrics.missingData.length > this.alertConfig.missingDataThreshold ||
      metrics.errors.length > 0;

    if (!shouldAlert) {
      return;
    }

    const alertMessage = this.formatAlertMessage(metrics);

    // Send Slack alert
    if (this.alertConfig.enableSlackAlerts && this.alertConfig.slackWebhookUrl) {
      await this.sendSlackAlert(alertMessage);
    }

    // Send email alert
    if (this.alertConfig.enableEmailAlerts && this.alertConfig.alertEmail) {
      await this.sendEmailAlert(alertMessage);
    }

    // Log alert to database
    await this.logAlert(metrics);
  }

  /**
   * Format alert message
   */
  private formatAlertMessage(metrics: MonitoringMetrics): string {
    let message = `🚨 Database Monitoring Alert - ${this.environment.toUpperCase()}\n`;
    message += `Timestamp: ${metrics.timestamp.toISOString()}\n\n`;

    if (metrics.errors.length > 0) {
      message += `❌ ERRORS (${metrics.errors.length}):\n`;
      metrics.errors.forEach(error => message += `  • ${error}\n`);
      message += '\n';
    }

    if (metrics.emptyStates.length > 0) {
      message += `⚠️  EMPTY STATES (${metrics.emptyStates.length}):\n`;
      metrics.emptyStates.forEach(state => message += `  • ${state}\n`);
      message += '\n';
    }

    if (metrics.missingData.length > 0) {
      message += `🔍 MISSING DATA (${metrics.missingData.length}):\n`;
      metrics.missingData.forEach(data => message += `  • ${data}\n`);
      message += '\n';
    }

    if (metrics.warnings.length > 0) {
      message += `⚠️  WARNINGS (${metrics.warnings.length}):\n`;
      metrics.warnings.forEach(warning => message += `  • ${warning}\n`);
      message += '\n';
    }

    message += `📊 DATABASE COUNTS:\n`;
    Object.entries(metrics.counts).forEach(([key, value]) => {
      message += `  • ${key}: ${value}\n`;
    });

    return message;
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
          icon_emoji: ':warning:',
        }),
      });

      if (!response.ok) {
        logger.error('Failed to send Slack alert:', response.statusText);
      }
    } catch (error) {
      logger.error('Error sending Slack alert:', error);
    }
  }

  /**
   * Send email alert
   */
  private async sendEmailAlert(message: string): Promise<void> {
    // Implementation depends on email service (Resend, SendGrid, etc.)
    logger.info('Email alert would be sent:', message);
  }

  /**
   * Log alert to database
   */
  private async logAlert(metrics: MonitoringMetrics): Promise<void> {
    try {
      await this.prisma.systemAlert.create({
        data: {
          type: 'DATABASE_MONITORING',
          severity: metrics.errors.length > 0 ? 'ERROR' : 'WARNING',
          message: this.formatAlertMessage(metrics),
          metadata: JSON.stringify(metrics),
          environment: this.environment,
        },
      });
    } catch (error) {
      logger.error('Failed to log alert to database:', error);
    }
  }

  /**
   * Run monitoring check and send alerts if needed
   */
  async runMonitoringCheck(): Promise<MonitoringMetrics> {
    const metrics = await this.getMetrics();
    
    if (isMonitoringEnabled('enableEmptyStateTracking', this.environment) ||
        isMonitoringEnabled('enableErrorTracking', this.environment)) {
      await this.sendAlerts(metrics);
    }

    return metrics;
  }

  /**
   * Generate monitoring report
   */
  async generateReport(): Promise<string> {
    const metrics = await this.getMetrics();
    return this.formatAlertMessage(metrics);
  }
}

/**
 * Create and configure database monitor
 */
export function createDatabaseMonitor(prisma: PrismaClient, environment?: string): DatabaseMonitor {
  return new DatabaseMonitor(prisma, environment);
}

/**
 * Run monitoring check (can be called from cron job or API endpoint)
 */
export async function runMonitoringCheck(prisma: PrismaClient, environment?: string): Promise<MonitoringMetrics> {
  const monitor = createDatabaseMonitor(prisma, environment);
  return monitor.runMonitoringCheck();
}
