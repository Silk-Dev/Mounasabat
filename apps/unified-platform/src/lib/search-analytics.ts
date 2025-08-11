import { prisma } from './prisma';
import type { SearchFilters } from '@/types';

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
}