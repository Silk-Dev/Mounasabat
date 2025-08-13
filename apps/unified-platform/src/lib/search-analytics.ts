import { prisma } from './prisma';
import type { SearchFilters } from '@/types';

export interface SearchPerformanceMetrics {
  averageResponseTime: number;
  cacheHitRate: number;
  totalSearches: number;
  slowQueries: Array<{ query: string; averageTime: number }>;
  popularQueries: Array<{ query: string; count: number }>;
  emptyResultQueries: Array<{ query: string; count: number }>;
}

export class SearchAnalytics {
  /**
   * Record a search query for analytics
   */
  static async recordSearch(
    query: string,
    filters: SearchFilters,
    resultCount: number,
    userId?: string
  ): Promise<void> {
    try {
      await prisma.searchAnalytics.create({
        data: {
          query: query.trim(),
          filters: filters as any,
          resultCount,
          userId,
        },
      });
    } catch (error) {
      console.error('Failed to record search analytics:', error);
      // Don't throw error to avoid breaking search functionality
    }
  }

  /**
   * Record search performance metrics
   */
  static async recordSearchPerformance(
    query: string,
    responseTime: number,
    resultCount: number,
    fromCache: boolean
  ): Promise<void> {
    try {
      // Store performance data in a simple way using existing table
      // In a real implementation, you might want a separate performance table
      await prisma.searchAnalytics.create({
        data: {
          query: query.trim(),
          filters: {
            performance: {
              responseTime,
              fromCache,
              timestamp: new Date().toISOString(),
            }
          } as any,
          resultCount,
        },
      });
    } catch (error) {
      console.error('Failed to record search performance:', error);
    }
  }

  /**
   * Get popular search queries from the last N days
   */
  static async getPopularQueries(days: number = 7): Promise<Array<{ query: string; count: number }>> {
    try {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      const results = await prisma.searchAnalytics.groupBy({
        by: ['query'],
        where: {
          createdAt: {
            gte: startDate,
          },
          query: {
            not: '',
          },
        },
        _count: {
          query: true,
        },
        orderBy: {
          _count: {
            query: 'desc',
          },
        },
        take: 20,
      });

      return results.map(result => ({
        query: result.query,
        count: result._count.query,
      }));
    } catch (error) {
      console.error('Failed to get popular queries:', error);
      return [];
    }
  }

  /**
   * Get search metrics for analytics dashboard
   */
  static async getSearchMetrics(dateRange?: { start: Date; end: Date }) {
    const endDate = dateRange?.end || new Date();
    const startDate = dateRange?.start || new Date(Date.now() - 7 * 24 * 60 * 60 * 1000); // 7 days ago

    try {
      const [totalSearches, uniqueQueries, popularQueries, searchesWithNoResults] = await Promise.all([
        // Total searches
        prisma.searchAnalytics.count({
          where: {
            createdAt: {
              gte: startDate,
              lte: endDate,
            },
          },
        }),

        // Unique queries
        prisma.searchAnalytics.findMany({
          where: {
            createdAt: {
              gte: startDate,
              lte: endDate,
            },
          },
          select: {
            query: true,
          },
          distinct: ['query'],
        }),

        // Popular queries
        this.getPopularQueries(Math.ceil((endDate.getTime() - startDate.getTime()) / (24 * 60 * 60 * 1000))),

        // Searches with no results
        prisma.searchAnalytics.count({
          where: {
            createdAt: {
              gte: startDate,
              lte: endDate,
            },
            resultCount: 0,
          },
        }),
      ]);

      const averageResults = await prisma.searchAnalytics.aggregate({
        where: {
          createdAt: {
            gte: startDate,
            lte: endDate,
          },
          resultCount: {
            not: null,
          },
        },
        _avg: {
          resultCount: true,
        },
      });

      return {
        totalSearches,
        uniqueQueries: uniqueQueries.length,
        popularQueries,
        averageResultsPerSearch: averageResults._avg.resultCount || 0,
        searchesWithNoResults,
        performanceMetrics: {
          averageResponseTime: 0, // This would need to be tracked separately
          cacheHitRate: 0, // This would need to be tracked separately
        },
      };
    } catch (error) {
      console.error('Failed to get search metrics:', error);
      return {
        totalSearches: 0,
        uniqueQueries: 0,
        popularQueries: [],
        averageResultsPerSearch: 0,
        searchesWithNoResults: 0,
        performanceMetrics: {
          averageResponseTime: 0,
          cacheHitRate: 0,
        },
      };
    }
  }

  /**
   * Get trending categories based on search data
   */
  static async getTrendingCategories(days: number = 7): Promise<Array<{ category: string; count: number }>> {
    try {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      // Get searches that have category filters
      const results = await prisma.searchAnalytics.findMany({
        where: {
          createdAt: {
            gte: startDate,
          },
          filters: {
            path: ['category'],
            not: null,
          },
        },
        select: {
          filters: true,
        },
      });

      // Count category occurrences
      const categoryCount: Record<string, number> = {};
      results.forEach(result => {
        const filters = result.filters as any;
        if (filters?.category) {
          categoryCount[filters.category] = (categoryCount[filters.category] || 0) + 1;
        }
      });

      return Object.entries(categoryCount)
        .map(([category, count]) => ({ category, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 10);
    } catch (error) {
      console.error('Failed to get trending categories:', error);
      return [];
    }
  }

  /**
   * Get performance metrics for analytics
   */
  static async getPerformanceMetrics(days: number = 7): Promise<SearchPerformanceMetrics> {
    try {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      const [
        totalSearches,
        performanceData,
        popularQueries,
        emptyResultQueries
      ] = await Promise.all([
        // Total searches
        prisma.searchAnalytics.count({
          where: {
            createdAt: { gte: startDate },
          },
        }),

        // Performance data (searches with performance info)
        prisma.searchAnalytics.findMany({
          where: {
            createdAt: { gte: startDate },
            filters: {
              path: ['performance'],
              not: null,
            },
          },
          select: {
            query: true,
            filters: true,
          },
        }),

        // Popular queries
        this.getPopularQueries(days),

        // Empty result queries
        prisma.searchAnalytics.groupBy({
          by: ['query'],
          where: {
            createdAt: { gte: startDate },
            resultCount: 0,
          },
          _count: {
            query: true,
          },
          orderBy: {
            _count: {
              query: 'desc',
            },
          },
          take: 10,
        }),
      ]);

      // Calculate performance metrics
      let totalResponseTime = 0;
      let cacheHits = 0;
      const queryTimes: Record<string, number[]> = {};

      performanceData.forEach(record => {
        const performance = (record.filters as any)?.performance;
        if (performance?.responseTime) {
          totalResponseTime += performance.responseTime;
          if (performance.fromCache) {
            cacheHits++;
          }

          // Track query response times
          if (!queryTimes[record.query]) {
            queryTimes[record.query] = [];
          }
          queryTimes[record.query].push(performance.responseTime);
        }
      });

      const averageResponseTime = performanceData.length > 0 
        ? totalResponseTime / performanceData.length 
        : 0;

      const cacheHitRate = performanceData.length > 0 
        ? (cacheHits / performanceData.length) * 100 
        : 0;

      // Find slow queries (average response time > 1000ms)
      const slowQueries = Object.entries(queryTimes)
        .map(([query, times]) => ({
          query,
          averageTime: times.reduce((sum, time) => sum + time, 0) / times.length,
        }))
        .filter(({ averageTime }) => averageTime > 1000)
        .sort((a, b) => b.averageTime - a.averageTime)
        .slice(0, 10);

      return {
        averageResponseTime,
        cacheHitRate,
        totalSearches,
        slowQueries,
        popularQueries,
        emptyResultQueries: emptyResultQueries.map(result => ({
          query: result.query,
          count: result._count.query,
        })),
      };
    } catch (error) {
      console.error('Failed to get performance metrics:', error);
      return {
        averageResponseTime: 0,
        cacheHitRate: 0,
        totalSearches: 0,
        slowQueries: [],
        popularQueries: [],
        emptyResultQueries: [],
      };
    }
  }

  /**
   * Get search analytics for empty results
   */
  static async getEmptySearchAnalytics(days: number = 7): Promise<{
    totalEmptySearches: number;
    emptySearchRate: number;
    commonEmptyQueries: Array<{ query: string; count: number }>;
  }> {
    try {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      const [totalSearches, emptySearches, commonEmptyQueries] = await Promise.all([
        prisma.searchAnalytics.count({
          where: {
            createdAt: { gte: startDate },
          },
        }),

        prisma.searchAnalytics.count({
          where: {
            createdAt: { gte: startDate },
            resultCount: 0,
          },
        }),

        prisma.searchAnalytics.groupBy({
          by: ['query'],
          where: {
            createdAt: { gte: startDate },
            resultCount: 0,
          },
          _count: {
            query: true,
          },
          orderBy: {
            _count: {
              query: 'desc',
            },
          },
          take: 20,
        }),
      ]);

      const emptySearchRate = totalSearches > 0 ? (emptySearches / totalSearches) * 100 : 0;

      return {
        totalEmptySearches: emptySearches,
        emptySearchRate,
        commonEmptyQueries: commonEmptyQueries.map(result => ({
          query: result.query,
          count: result._count.query,
        })),
      };
    } catch (error) {
      console.error('Failed to get empty search analytics:', error);
      return {
        totalEmptySearches: 0,
        emptySearchRate: 0,
        commonEmptyQueries: [],
      };
    }
  }

  /**
   * Get user search behavior analytics
   */
  static async getUserSearchBehavior(days: number = 7): Promise<{
    uniqueUsers: number;
    averageSearchesPerUser: number;
    topSearchingUsers: Array<{ userId: string; searchCount: number }>;
  }> {
    try {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      const [userSearchCounts, totalSearches] = await Promise.all([
        prisma.searchAnalytics.groupBy({
          by: ['userId'],
          where: {
            createdAt: { gte: startDate },
            userId: { not: null },
          },
          _count: {
            userId: true,
          },
          orderBy: {
            _count: {
              userId: 'desc',
            },
          },
        }),

        prisma.searchAnalytics.count({
          where: {
            createdAt: { gte: startDate },
            userId: { not: null },
          },
        }),
      ]);

      const uniqueUsers = userSearchCounts.length;
      const averageSearchesPerUser = uniqueUsers > 0 ? totalSearches / uniqueUsers : 0;

      return {
        uniqueUsers,
        averageSearchesPerUser,
        topSearchingUsers: userSearchCounts.slice(0, 10).map(result => ({
          userId: result.userId || 'anonymous',
          searchCount: result._count.userId,
        })),
      };
    } catch (error) {
      console.error('Failed to get user search behavior:', error);
      return {
        uniqueUsers: 0,
        averageSearchesPerUser: 0,
        topSearchingUsers: [],
      };
    }
  }
}