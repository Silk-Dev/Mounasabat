import { PrismaClient } from "../../generated/client";
import seedBase from "../../../prisma/seed-base";
import seedDemo from "../../../prisma/seed-demo";
import { logger } from '../production-logger';

const prisma = new PrismaClient();

export interface SeedOptions {
  includeDemo?: boolean;
  force?: boolean;
  verbose?: boolean;
}

export interface SeedResult {
  success: boolean;
  message: string;
  counts?: Record<string, number>;
  error?: string;
}

/**
 * Seed Manager - Provides utilities for managing database seeding operations
 */
export class SeedManager {
  private prisma: PrismaClient;

  constructor(prismaClient?: PrismaClient) {
    this.prisma = prismaClient || new PrismaClient();
  }

  /**
   * Run base seed script with essential platform data
   */
  async runBaseSeed(options: SeedOptions = {}): Promise<SeedResult> {
    try {
      if (options.verbose) {
        logger.info("🌱 Starting base seed...");
      }

      await seedBase();

      const counts = await this.getCounts();

      return {
        success: true,
        message: "Base seed completed successfully",
        counts,
      };
    } catch (error) {
      return {
        success: false,
        message: "Base seed failed",
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  /**
   * Run demo seed script with sample data
   */
  async runDemoSeed(options: SeedOptions = {}): Promise<SeedResult> {
    try {
      if (process.env.NODE_ENV === "production" && !options.force) {
        return {
          success: false,
          message: "Demo seed is not allowed in production environment",
          error: "Use --force flag to override this protection",
        };
      }

      if (options.verbose) {
        logger.info("🎭 Starting demo seed...");
      }

      await seedDemo();

      const counts = await this.getCounts();

      return {
        success: true,
        message: "Demo seed completed successfully",
        counts,
      };
    } catch (error) {
      return {
        success: false,
        message: "Demo seed failed",
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  /**
   * Run both base and demo seeds
   */
  async runFullSeed(options: SeedOptions = {}): Promise<SeedResult> {
    try {
      // First run base seed
      const baseResult = await this.runBaseSeed(options);
      if (!baseResult.success) {
        return baseResult;
      }

      // Then run demo seed if requested
      if (options.includeDemo) {
        const demoResult = await this.runDemoSeed(options);
        if (!demoResult.success) {
          return demoResult;
        }
      }

      const counts = await this.getCounts();

      return {
        success: true,
        message: `Full seed completed successfully${options.includeDemo ? " (with demo data)" : ""}`,
        counts,
      };
    } catch (error) {
      return {
        success: false,
        message: "Full seed failed",
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  /**
   * Clear all demo data from the database
   */
  async clearDemoData(): Promise<SeedResult> {
    try {
      if (process.env.NODE_ENV === "production") {
        return {
          success: false,
          message: "Demo data clearing is not allowed in production environment",
        };
      }

      logger.info("🧹 Clearing demo data...");

      // Delete in reverse dependency order
      await this.prisma.notification.deleteMany({
        where: {
          user: {
            id: {
              not: "admin-system", // Keep admin notifications
            },
          },
        },
      });

      await this.prisma.favorite.deleteMany();
      await this.prisma.message.deleteMany();
      await this.prisma.conversation.deleteMany();
      await this.prisma.review.deleteMany();
      await this.prisma.bookingService.deleteMany();
      await this.prisma.booking.deleteMany();
      await this.prisma.orderItem.deleteMany();
      await this.prisma.order.deleteMany();
      await this.prisma.service.deleteMany();
      await this.prisma.provider.deleteMany();
      await this.prisma.event.deleteMany({
        where: {
          id: {
            not: {
              in: ["template-wedding", "template-corporate", "template-birthday", "template-anniversary"],
            },
          },
        },
      });

      // Delete demo users (keep admin)
      await this.prisma.user.deleteMany({
        where: {
          id: {
            not: "admin-system",
          },
        },
      });

      const counts = await this.getCounts();

      return {
        success: true,
        message: "Demo data cleared successfully",
        counts,
      };
    } catch (error) {
      return {
        success: false,
        message: "Failed to clear demo data",
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  /**
   * Validate seed data integrity
   */
  async validateSeedData(): Promise<SeedResult> {
    try {
      const validationErrors: string[] = [];

      // Check if admin user exists
      const adminUser = await this.prisma.user.findUnique({
        where: { id: "admin-system" },
      });
      if (!adminUser) {
        validationErrors.push("Admin user not found");
      }

      // Check if essential templates exist
      const templateCount = await this.prisma.template.count({
        where: {
          id: {
            in: ["template-wedding", "template-corporate", "template-birthday", "template-anniversary"],
          },
        },
      });
      if (templateCount < 4) {
        validationErrors.push("Essential templates missing");
      }

      // Check if template items exist
      const templateItemCount = await this.prisma.templateItem.count();
      if (templateItemCount === 0) {
        validationErrors.push("Template items missing");
      }

      // Check if essential products exist
      const productCount = await this.prisma.product.count({
        where: {
          id: {
            in: ["product-invitation-basic", "product-favor-box-basic"],
          },
        },
      });
      if (productCount < 2) {
        validationErrors.push("Essential products missing");
      }

      // Check for orphaned records
      const orphanedProviders = await this.prisma.provider.count({
        where: {
          user: null,
        },
      });
      if (orphanedProviders > 0) {
        validationErrors.push(`${orphanedProviders} orphaned providers found`);
      }

      const orphanedServices = await this.prisma.service.count({
        where: {
          provider: null,
        },
      });
      if (orphanedServices > 0) {
        validationErrors.push(`${orphanedServices} orphaned services found`);
      }

      const counts = await this.getCounts();

      if (validationErrors.length > 0) {
        return {
          success: false,
          message: "Seed data validation failed",
          error: validationErrors.join(", "),
          counts,
        };
      }

      return {
        success: true,
        message: "Seed data validation passed",
        counts,
      };
    } catch (error) {
      return {
        success: false,
        message: "Seed data validation failed",
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  /**
   * Get database record counts
   */
  async getCounts(): Promise<Record<string, number>> {
    try {
      const [
        users,
        providers,
        services,
        products,
        templates,
        templateItems,
        events,
        bookings,
        orders,
        reviews,
        conversations,
        messages,
        favorites,
        notifications,
        categories,
        systemSettings,
      ] = await Promise.all([
        this.prisma.user.count(),
        this.prisma.provider.count(),
        this.prisma.service.count(),
        this.prisma.product.count(),
        this.prisma.template.count(),
        this.prisma.templateItem.count(),
        this.prisma.event.count(),
        this.prisma.booking.count(),
        this.prisma.order.count(),
        this.prisma.review.count(),
        this.prisma.conversation.count(),
        this.prisma.message.count(),
        this.prisma.favorite.count(),
        this.prisma.notification.count(),
        this.prisma.category.count(),
        this.prisma.systemSettings.count(),
      ]);

      return {
        users,
        providers,
        services,
        products,
        templates,
        templateItems,
        events,
        bookings,
        orders,
        reviews,
        conversations,
        messages,
        favorites,
        notifications,
        categories,
        systemSettings,
      };
    } catch (error) {
      logger.error("Error getting counts:", error);
      return {};
    }
  }

  /**
   * Check if database has any data
   */
  async isEmpty(): Promise<boolean> {
    try {
      const userCount = await this.prisma.user.count();
      return userCount === 0;
    } catch (error) {
      logger.error("Error checking if database is empty:", error);
      return false;
    }
  }

  /**
   * Check if database has demo data
   */
  async hasDemoData(): Promise<boolean> {
    try {
      // Check for demo users (non-admin users)
      const demoUserCount = await this.prisma.user.count({
        where: {
          id: {
            not: "admin-system",
          },
        },
      });
      return demoUserCount > 0;
    } catch (error) {
      logger.error("Error checking for demo data:", error);
      return false;
    }
  }

  /**
   * Get seeding status and recommendations
   */
  async getStatus(): Promise<{
    isEmpty: boolean;
    hasBaseData: boolean;
    hasDemoData: boolean;
    recommendations: string[];
  }> {
    try {
      const isEmpty = await this.isEmpty();
      const hasDemoData = await this.hasDemoData();
      
      // Check for base data
      const adminExists = await this.prisma.user.findUnique({
        where: { id: "admin-system" },
      });
      const templatesExist = await this.prisma.template.count() > 0;
      const hasBaseData = !!adminExists && templatesExist;

      const recommendations: string[] = [];

      if (isEmpty) {
        recommendations.push("Database is empty. Run base seed to initialize platform.");
      } else if (!hasBaseData) {
        recommendations.push("Base data is incomplete. Run base seed to ensure platform functionality.");
      }

      if (!hasDemoData && process.env.NODE_ENV === "development") {
        recommendations.push("No demo data found. Consider running demo seed for development.");
      }

      if (hasDemoData && process.env.NODE_ENV === "production") {
        recommendations.push("Demo data found in production. Consider clearing demo data.");
      }

      return {
        isEmpty,
        hasBaseData,
        hasDemoData,
        recommendations,
      };
    } catch (error) {
      logger.error("Error getting status:", error);
      return {
        isEmpty: true,
        hasBaseData: false,
        hasDemoData: false,
        recommendations: ["Error checking database status. Please check database connection."],
      };
    }
  }

  /**
   * Disconnect from database
   */
  async disconnect(): Promise<void> {
    await this.prisma.$disconnect();
  }
}

// Export singleton instance
export const seedManager = new SeedManager();

// Export individual functions for convenience
export const runBaseSeed = (options?: SeedOptions) => seedManager.runBaseSeed(options);
export const runDemoSeed = (options?: SeedOptions) => seedManager.runDemoSeed(options);
export const runFullSeed = (options?: SeedOptions) => seedManager.runFullSeed(options);
export const clearDemoData = () => seedManager.clearDemoData();
export const validateSeedData = () => seedManager.validateSeedData();
