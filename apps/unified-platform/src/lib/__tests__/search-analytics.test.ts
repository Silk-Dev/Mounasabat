import { SearchAnalytics } from '../search-analytics';
import { prisma } from '../prisma';
import type { SearchFilters } from '@/types';

// Mock prisma
jest.mock('../prisma', () => ({
  prisma: {
    searchAnalytics: {
      create: jest.fn(),
      count: jest.fn(),
      findMany: jest.fn(),
      groupBy: jest.fn(),
      aggregate: jest.fn(),
    },
  },
}));

const mockPrisma = prisma as jest.Mocked<typeof prisma>;

describe('SearchAnalytics', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('recordSearch', () => {
    it('should record search query with filters and result count', async () => {
      const mockCreate = mockPrisma.searchAnalytics.create as jest.Mock;
      mockCreate.mockResolvedValue({});

      const query = 'wedding venues';
      const filters: SearchFilters = {
        query: 'wedding venues',
        location: 'Tunis',
        category: 'Venues',
      };
      const resultCount = 15;
      const userId = 'user-123';

      await SearchAnalytics.recordSearch(query, filters, resultCount, userId);

      expect(mockCreate).toHaveBeenCalledWith({
        data: {
          query: 'wedding venues',
          filters: filters,
          resultCount: 15,
          userId: 'user-123',
        },
      });
    });

    it('should handle errors gracefully without throwing', async () => {
      const mockCreate = mockPrisma.searchAnalytics.create as jest.Mock;
      mockCreate.mockRejectedValue(new Error('Database error'));

      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      await expect(
        SearchAnalytics.recordSearch('test', {}, 0)
      ).resolves.not.toThrow();

      expect(consoleSpy).toHaveBeenCalledWith(
        'Failed to record search analytics:',
        expect.any(Error)
      );

      consoleSpy.mockRestore();
    });
  });

  describe('recordSearchPerformance', () => {
    it('should record search performance metrics', async () => {
      const mockCreate = mockPrisma.searchAnalytics.create as jest.Mock;
      mockCreate.mockResolvedValue({});

      await SearchAnalytics.recordSearchPerformance('test query', 250, 10, true);

      expect(mockCreate).toHaveBeenCalledWith({
        data: {
          query: 'test query',
          filters: {
            performance: {
              responseTime: 250,
              fromCache: true,
              timestamp: expect.any(String),
            }
          },
          resultCount: 10,
        },
      });
    });
  });

  describe('getPopularQueries', () => {
    it('should return popular queries from the last N days', async () => {
      const mockGroupBy = mockPrisma.searchAnalytics.groupBy as jest.Mock;
      mockGroupBy.mockResolvedValue([
        { query: 'wedding venues', _count: { query: 25 } },
        { query: 'catering services', _count: { query: 18 } },
        { query: 'photographers', _count: { query: 12 } },
      ]);

      const result = await SearchAnalytics.getPopularQueries(7);

      expect(result).toEqual([
        { query: 'wedding venues', count: 25 },
        { query: 'catering services', count: 18 },
        { query: 'photographers', count: 12 },
      ]);

      expect(mockGroupBy).toHaveBeenCalledWith({
        by: ['query'],
        where: {
          createdAt: {
            gte: expect.any(Date),
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
    });

    it('should handle errors and return empty array', async () => {
      const mockGroupBy = mockPrisma.searchAnalytics.groupBy as jest.Mock;
      mockGroupBy.mockRejectedValue(new Error('Database error'));

      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      const result = await SearchAnalytics.getPopularQueries(7);

      expect(result).toEqual([]);
      expect(consoleSpy).toHaveBeenCalledWith(
        'Failed to get popular queries:',
        expect.any(Error)
      );

      consoleSpy.mockRestore();
    });
  });

  describe('getSearchMetrics', () => {
    it('should return comprehensive search metrics', async () => {
      const mockCount = mockPrisma.searchAnalytics.count as jest.Mock;
      const mockFindMany = mockPrisma.searchAnalytics.findMany as jest.Mock;
      const mockAggregate = mockPrisma.searchAnalytics.aggregate as jest.Mock;

      // Mock total searches
      mockCount.mockResolvedValueOnce(100);
      
      // Mock unique queries
      mockFindMany.mockResolvedValueOnce([
        { query: 'wedding venues' },
        { query: 'catering' },
        { query: 'photographers' },
      ]);

      // Mock searches with no results
      mockCount.mockResolvedValueOnce(15);

      // Mock average results
      mockAggregate.mockResolvedValue({
        _avg: { resultCount: 8.5 },
      });

      // Mock popular queries method
      jest.spyOn(SearchAnalytics, 'getPopularQueries').mockResolvedValue([
        { query: 'wedding venues', count: 25 },
      ]);

      const result = await SearchAnalytics.getSearchMetrics();

      expect(result).toEqual({
        totalSearches: 100,
        uniqueQueries: 3,
        popularQueries: [{ query: 'wedding venues', count: 25 }],
        averageResultsPerSearch: 8.5,
        searchesWithNoResults: 15,
        performanceMetrics: {
          averageResponseTime: 0,
          cacheHitRate: 0,
        },
      });
    });
  });

  describe('getTrendingCategories', () => {
    it('should return trending categories based on search filters', async () => {
      const mockFindMany = mockPrisma.searchAnalytics.findMany as jest.Mock;
      mockFindMany.mockResolvedValue([
        { filters: { category: 'Venues' } },
        { filters: { category: 'Venues' } },
        { filters: { category: 'Catering' } },
        { filters: { category: 'Photography' } },
        { filters: { category: 'Photography' } },
        { filters: { category: 'Photography' } },
      ]);

      const result = await SearchAnalytics.getTrendingCategories(7);

      expect(result).toEqual([
        { category: 'Photography', count: 3 },
        { category: 'Venues', count: 2 },
        { category: 'Catering', count: 1 },
      ]);
    });
  });

  describe('getEmptySearchAnalytics', () => {
    it('should return analytics for searches with no results', async () => {
      const mockCount = mockPrisma.searchAnalytics.count as jest.Mock;
      const mockGroupBy = mockPrisma.searchAnalytics.groupBy as jest.Mock;

      // Mock total searches
      mockCount.mockResolvedValueOnce(100);
      
      // Mock empty searches
      mockCount.mockResolvedValueOnce(20);

      // Mock common empty queries
      mockGroupBy.mockResolvedValue([
        { query: 'unicorn rentals', _count: { query: 5 } },
        { query: 'time machine', _count: { query: 3 } },
      ]);

      const result = await SearchAnalytics.getEmptySearchAnalytics(7);

      expect(result).toEqual({
        totalEmptySearches: 20,
        emptySearchRate: 20,
        commonEmptyQueries: [
          { query: 'unicorn rentals', count: 5 },
          { query: 'time machine', count: 3 },
        ],
      });
    });
  });

  describe('getUserSearchBehavior', () => {
    it('should return user search behavior analytics', async () => {
      const mockGroupBy = mockPrisma.searchAnalytics.groupBy as jest.Mock;
      const mockCount = mockPrisma.searchAnalytics.count as jest.Mock;

      // Mock user search counts
      mockGroupBy.mockResolvedValue([
        { userId: 'user-1', _count: { userId: 15 } },
        { userId: 'user-2', _count: { userId: 10 } },
        { userId: 'user-3', _count: { userId: 8 } },
      ]);

      // Mock total searches
      mockCount.mockResolvedValue(33);

      const result = await SearchAnalytics.getUserSearchBehavior(7);

      expect(result).toEqual({
        uniqueUsers: 3,
        averageSearchesPerUser: 11,
        topSearchingUsers: [
          { userId: 'user-1', searchCount: 15 },
          { userId: 'user-2', searchCount: 10 },
          { userId: 'user-3', searchCount: 8 },
        ],
      });
    });
  });

  describe('getPerformanceMetrics', () => {
    it('should calculate performance metrics from recorded data', async () => {
      const mockCount = mockPrisma.searchAnalytics.count as jest.Mock;
      const mockFindMany = mockPrisma.searchAnalytics.findMany as jest.Mock;
      const mockGroupBy = mockPrisma.searchAnalytics.groupBy as jest.Mock;

      // Mock total searches
      mockCount.mockResolvedValue(100);

      // Mock performance data
      mockFindMany.mockResolvedValue([
        {
          query: 'fast query',
          filters: { performance: { responseTime: 100, fromCache: true } },
        },
        {
          query: 'slow query',
          filters: { performance: { responseTime: 1500, fromCache: false } },
        },
        {
          query: 'medium query',
          filters: { performance: { responseTime: 500, fromCache: false } },
        },
      ]);

      // Mock popular queries
      jest.spyOn(SearchAnalytics, 'getPopularQueries').mockResolvedValue([
        { query: 'popular query', count: 50 },
      ]);

      // Mock empty result queries
      mockGroupBy.mockResolvedValue([
        { query: 'no results query', _count: { query: 5 } },
      ]);

      const result = await SearchAnalytics.getPerformanceMetrics(7);

      expect(result.averageResponseTime).toBeCloseTo(700); // (100 + 1500 + 500) / 3
      expect(result.cacheHitRate).toBeCloseTo(33.33); // 1 out of 3 from cache
      expect(result.totalSearches).toBe(100);
      expect(result.slowQueries).toEqual([
        { query: 'slow query', averageTime: 1500 },
      ]);
      expect(result.popularQueries).toEqual([
        { query: 'popular query', count: 50 },
      ]);
      expect(result.emptyResultQueries).toEqual([
        { query: 'no results query', count: 5 },
      ]);
    });
  });
});
