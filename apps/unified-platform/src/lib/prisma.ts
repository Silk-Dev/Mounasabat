import { PrismaClient } from '@mounasabet/database';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

// Enhanced Prisma configuration with connection pooling and optimization
export const prisma = globalForPrisma.prisma ?? new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  datasources: {
    db: {
      url: process.env.DATABASE_URL,
    },
  },
  // Connection pool configuration
  __internal: {
    engine: {
      // Connection pool settings
      connectionLimit: parseInt(process.env.DATABASE_CONNECTION_LIMIT || '10'),
      poolTimeout: parseInt(process.env.DATABASE_POOL_TIMEOUT || '10000'),
      // Query optimization
      binaryTargets: ['native'],
    },
  },
});

// Connection pool monitoring
if (process.env.NODE_ENV === 'development') {
  prisma.$on('query', (e) => {
    if (e.duration > 1000) {
      console.warn(`Slow query detected (${e.duration}ms):`, e.query);
    }
  });
}

// Graceful shutdown
process.on('beforeExit', async () => {
  await prisma.$disconnect();
});

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

// Query optimization utilities
export const queryOptimizations = {
  // Batch queries to reduce database round trips
  batchQueries: async <T>(queries: (() => Promise<T>)[]) => {
    return Promise.all(queries.map(query => query()));
  },

  // Pagination helper with cursor-based pagination for better performance
  createPaginatedQuery: <T>(
    baseQuery: any,
    cursor?: string,
    take: number = 20
  ) => {
    const query = {
      ...baseQuery,
      take: take + 1, // Take one extra to check if there are more results
      ...(cursor && {
        cursor: { id: cursor },
        skip: 1, // Skip the cursor item
      }),
    };

    return {
      query,
      processPaginatedResults: (results: T[]) => {
        const hasNextPage = results.length > take;
        const items = hasNextPage ? results.slice(0, -1) : results;
        const nextCursor = hasNextPage && items.length > 0 
          ? (items[items.length - 1] as any).id 
          : null;

        return {
          items,
          hasNextPage,
          nextCursor,
        };
      },
    };
  },

  // Search optimization with full-text search
  createSearchQuery: (searchTerm: string, filters: any = {}) => {
    const searchConditions = searchTerm
      ? {
          OR: [
            { name: { contains: searchTerm, mode: 'insensitive' as const } },
            { description: { contains: searchTerm, mode: 'insensitive' as const } },
            { tags: { hasSome: searchTerm.split(' ') } },
          ],
        }
      : {};

    return {
      where: {
        ...searchConditions,
        ...filters,
      },
      include: {
        provider: {
          select: {
            id: true,
            name: true,
            avatar: true,
            isVerified: true,
            rating: true,
          },
        },
        category: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
        _count: {
          select: {
            reviews: true,
            bookings: true,
          },
        },
      },
    };
  },

  // Aggregation queries for analytics
  createAnalyticsQuery: (providerId: string, dateRange: { from: Date; to: Date }) => {
    return {
      bookings: prisma.booking.aggregate({
        where: {
          providerId,
          createdAt: {
            gte: dateRange.from,
            lte: dateRange.to,
          },
        },
        _count: true,
        _sum: {
          totalAmount: true,
        },
        _avg: {
          totalAmount: true,
        },
      }),
      
      reviews: prisma.review.aggregate({
        where: {
          service: {
            providerId,
          },
          createdAt: {
            gte: dateRange.from,
            lte: dateRange.to,
          },
        },
        _count: true,
        _avg: {
          rating: true,
        },
      }),

      services: prisma.service.count({
        where: {
          providerId,
          isActive: true,
        },
      }),
    };
  },
};

// Database health check
export const checkDatabaseHealth = async () => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return { status: 'healthy', timestamp: new Date() };
  } catch (error) {
    console.error('Database health check failed:', error);
    return { status: 'unhealthy', error: error.message, timestamp: new Date() };
  }
};

// Connection pool metrics
export const getConnectionPoolMetrics = () => {
  // This would typically come from Prisma metrics in production
  return {
    activeConnections: 0, // Would be populated by actual metrics
    idleConnections: 0,
    totalConnections: 0,
    waitingQueries: 0,
  };
};