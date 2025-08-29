import { prisma, queryOptimizations } from './prisma';
import { memoryCache } from './cache';
import { logger } from './logger';

// Optimized search queries with proper indexing
export const optimizedQueries = {
  // Search services with optimized joins and filtering
  searchServices: async (params: {
    query?: string;
    category?: string;
    location?: string;
    priceRange?: [number, number];
    rating?: number;
    availability?: Date;
    cursor?: string;
    limit?: number;
  }) => {
    const {
      query,
      category,
      location,
      priceRange,
      rating,
      availability,
      cursor,
      limit = 20,
    } = params;

    // Build optimized where clause
    const whereClause: any = {
      isActive: true,
      ...(category && { categoryId: category }),
      ...(location && {
        OR: [
          { provider: { city: { contains: location, mode: 'insensitive' } } },
          { provider: { region: { contains: location, mode: 'insensitive' } } },
        ],
      }),
      ...(priceRange && {
        basePrice: {
          gte: priceRange[0],
          lte: priceRange[1],
        },
      }),
      ...(rating && {
        provider: {
          rating: { gte: rating },
        },
      }),
      ...(availability && {
        provider: {
          availability: {
            some: {
              date: availability,
              isAvailable: true,
            },
          },
        },
      }),
    };

    // Add full-text search if query provided
    if (query) {
      whereClause.OR = [
        { name: { contains: query, mode: 'insensitive' } },
        { description: { contains: query, mode: 'insensitive' } },
        { provider: { name: { contains: query, mode: 'insensitive' } } },
      ];
    }

    const { query: paginatedQuery, processPaginatedResults } = 
      queryOptimizations.createPaginatedQuery(
        {
          where: whereClause,
          include: {
            provider: {
              select: {
                id: true,
                name: true,
                avatar: true,
                isVerified: true,
                rating: true,
                reviewCount: true,
                city: true,
                region: true,
              },
            },
            category: {
              select: {
                id: true,
                name: true,
                slug: true,
              },
            },
            images: {
              take: 3,
              select: {
                url: true,
                alt: true,
              },
            },
            _count: {
              select: {
                reviews: true,
                bookings: true,
              },
            },
          },
          orderBy: [
            { provider: { isVerified: 'desc' } },
            { provider: { rating: 'desc' } },
            { createdAt: 'desc' },
          ],
        },
        cursor,
        limit
      );

    const results = await prisma.service.findMany(paginatedQuery);
    return processPaginatedResults(results);
  },

  // Get provider with optimized includes
  getProviderWithServices: async (providerId: string) => {
    const cacheKey = `provider-${providerId}`;
    const cached = memoryCache.get(cacheKey);
    if (cached) return cached;

    const provider = await prisma.provider.findUnique({
      where: { id: providerId },
      include: {
        services: {
          where: { isActive: true },
          include: {
            category: true,
            images: {
              take: 5,
            },
            _count: {
              select: {
                reviews: true,
                bookings: true,
              },
            },
          },
          orderBy: {
            createdAt: 'desc',
          },
        },
        reviews: {
          take: 10,
          include: {
            user: {
              select: {
                name: true,
                avatar: true,
              },
            },
            service: {
              select: {
                name: true,
              },
            },
          },
          orderBy: {
            createdAt: 'desc',
          },
        },
        _count: {
          select: {
            services: true,
            reviews: true,
            bookings: true,
          },
        },
      },
    });

    if (provider) {
      memoryCache.set(cacheKey, provider, 5 * 60 * 1000); // 5 minutes
    }

    return provider;
  },

  // Get user bookings with optimized joins
  getUserBookings: async (userId: string, status?: string) => {
    return prisma.booking.findMany({
      where: {
        userId,
        ...(status && { status }),
      },
      include: {
        service: {
          include: {
            provider: {
              select: {
                id: true,
                name: true,
                avatar: true,
                phone: true,
                email: true,
              },
            },
            images: {
              take: 1,
            },
          },
        },
        payment: {
          select: {
            status: true,
            amount: true,
            currency: true,
            method: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  },

  // Get provider analytics with aggregated data
  getProviderAnalytics: async (
    providerId: string,
    dateRange: { from: Date; to: Date }
  ) => {
    const cacheKey = `analytics-${providerId}-${dateRange.from.getTime()}-${dateRange.to.getTime()}`;
    const cached = memoryCache.get(cacheKey);
    if (cached) return cached;

    const analytics = await queryOptimizations.batchQueries([
      () => queryOptimizations.createAnalyticsQuery(providerId, dateRange).bookings,
      () => queryOptimizations.createAnalyticsQuery(providerId, dateRange).reviews,
      () => queryOptimizations.createAnalyticsQuery(providerId, dateRange).services,
      () => prisma.booking.groupBy({
        by: ['status'],
        where: {
          providerId,
          createdAt: {
            gte: dateRange.from,
            lte: dateRange.to,
          },
        },
        _count: true,
      }),
      () => prisma.booking.findMany({
        where: {
          providerId,
          createdAt: {
            gte: dateRange.from,
            lte: dateRange.to,
          },
        },
        select: {
          createdAt: true,
          totalAmount: true,
        },
        orderBy: {
          createdAt: 'asc',
        },
      }),
    ]);

    const [bookingStats, reviewStats, serviceCount, bookingsByStatus, bookingTrends] = analytics;

    const result = {
      bookings: {
        total: bookingStats._count,
        revenue: bookingStats._sum.totalAmount || 0,
        averageValue: bookingStats._avg.totalAmount || 0,
        byStatus: bookingsByStatus.reduce((acc, item) => {
          acc[item.status] = item._count;
          return acc;
        }, {} as Record<string, number>),
      },
      reviews: {
        total: reviewStats._count,
        averageRating: reviewStats._avg.rating || 0,
      },
      services: {
        active: serviceCount,
      },
      trends: bookingTrends.map(booking => ({
        date: booking.createdAt,
        revenue: booking.totalAmount,
      })),
    };

    memoryCache.set(cacheKey, result, 10 * 60 * 1000); // 10 minutes
    return result;
  },

  // Batch operations for better performance
  batchUpdateAvailability: async (
    providerId: string,
    availabilitySlots: Array<{
      date: Date;
      startTime: string;
      endTime: string;
      isAvailable: boolean;
    }>
  ) => {
    // Delete existing availability for the dates
    const dates = availabilitySlots.map(slot => slot.date);
    await prisma.availability.deleteMany({
      where: {
        providerId,
        date: { in: dates },
      },
    });

    // Batch insert new availability
    return prisma.availability.createMany({
      data: availabilitySlots.map(slot => ({
        providerId,
        ...slot,
      })),
    });
  },

  // Optimized favorites query
  getUserFavorites: async (userId: string) => {
    return prisma.favorite.findMany({
      where: { userId },
      include: {
        service: {
          include: {
            provider: {
              select: {
                id: true,
                name: true,
                avatar: true,
                rating: true,
                isVerified: true,
              },
            },
            images: {
              take: 1,
            },
            _count: {
              select: {
                reviews: true,
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  },
};

// Query performance monitoring
export const queryPerformanceMonitor = {
  logSlowQueries: true,
  slowQueryThreshold: 1000, // 1 second

  wrapQuery: <T>(queryName: string, queryFn: () => Promise<T>) => {
    return async (): Promise<T> => {
      const startTime = Date.now();
      
      try {
        const result = await queryFn();
        const duration = Date.now() - startTime;
        
        if (duration > queryPerformanceMonitor.slowQueryThreshold) {
          logger.warn(`Slow query detected: ${queryName} took ${duration}ms`);
        }
        
        return result;
      } catch (error) {
        const duration = Date.now() - startTime;
        logger.error(`Query failed: ${queryName} after ${duration}ms`, error);
        throw error;
      }
    };
  },
};

// Database connection health monitoring
export const connectionMonitor = {
  checkHealth: async () => {
    try {
      const start = Date.now();
      await prisma.$queryRaw`SELECT 1`;
      const latency = Date.now() - start;
      
      return {
        status: 'healthy',
        latency,
        timestamp: new Date(),
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        error: error.message,
        timestamp: new Date(),
      };
    }
  },

  getMetrics: async () => {
    // In a real implementation, you'd get these from Prisma metrics
    return {
      activeConnections: 5,
      idleConnections: 3,
      totalConnections: 8,
      maxConnections: 10,
      waitingQueries: 0,
    };
  },
};
