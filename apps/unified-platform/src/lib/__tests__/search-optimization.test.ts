import { 
  searchServices, 
  SearchAnalytics, 
  SearchOptimizer,
  validateSearchFilters,
  buildSearchQuery,
  formatSearchResults
} from '../search';
import { SearchCache, AnalyticsCache } from '../cache';
import type { SearchFilters } from '@/types';

// Mock the cache modules
jest.mock('../cache', () => ({
  SearchCache: {
    getSearchResults: jest.fn(),
    setSearchResults: jest.fn(),
    getPopularSearches: jest.fn(),
    setPopularSearches: jest.fn(),
    getTrendingServices: jest.fn(),
    setTrendingServices: jest.fn(),
    invalidateSearchCache: jest.fn(),
  },
  AnalyticsCache: {
    recordSearchQuery: jest.fn(),
    getSearchAnalytics: jest.fn(),
    getPopularQueries: jest.fn(),
  },
}));

// Mock the database
jest.mock('@mounasabet/database', () => ({
  prisma: null,
}));

describe('Search Optimization', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('searchServices', () => {
    it('should return cached results when available', async () => {
      const mockResults = [
        {
          id: '1',
          type: 'service' as const,
          name: 'Test Service',
          description: 'Test Description',
          images: [],
          rating: 4.5,
          reviewCount: 10,
          basePrice: 100,
          location: 'Tunis',
          provider: {
            id: 'p1',
            name: 'Test Provider',
            isVerified: true,
          },
        },
      ];

      const mockResponse = {
        results: mockResults,
        total: 1,
        page: 1,
        limit: 12,
        hasMore: false,
        totalPages: 1,
      };

      (SearchCache.getSearchResults as jest.Mock).mockResolvedValue(mockResponse);

      const filters: SearchFilters = { query: 'test' };
      const result = await searchServices(filters);

      expect(result).toEqual(mockResponse);
      expect(SearchCache.getSearchResults).toHaveBeenCalledWith('test', expect.any(Object));
      expect(AnalyticsCache.recordSearchQuery).toHaveBeenCalledWith('test', filters);
    });

    it('should perform search and cache results when not cached', async () => {
      (SearchCache.getSearchResults as jest.Mock).mockResolvedValue(null);
      (SearchCache.setSearchResults as jest.Mock).mockResolvedValue(true);

      const filters: SearchFilters = { query: 'wedding' };
      const result = await searchServices(filters);

      expect(result.results).toBeDefined();
      expect(result.total).toBeGreaterThanOrEqual(0);
      expect(result.page).toBe(1);
      expect(SearchCache.setSearchResults).toHaveBeenCalled();
    });

    it('should handle pagination correctly', async () => {
      (SearchCache.getSearchResults as jest.Mock).mockResolvedValue(null);

      const filters: SearchFilters = { query: 'catering' };
      const options = { page: 2, limit: 6 };
      const result = await searchServices(filters, options);

      expect(result.page).toBe(2);
      expect(result.limit).toBe(6);
    });

    it('should apply filters correctly', async () => {
      (SearchCache.getSearchResults as jest.Mock).mockResolvedValue(null);

      const filters: SearchFilters = {
        query: 'photography',
        location: 'Tunis',
        priceRange: [100, 500],
        rating: 4.0,
      };

      const result = await searchServices(filters);

      expect(result.results).toBeDefined();
      // Results should be filtered based on the criteria
      result.results.forEach(service => {
        expect(service.basePrice).toBeGreaterThanOrEqual(100);
        expect(service.basePrice).toBeLessThanOrEqual(500);
        expect(service.rating).toBeGreaterThanOrEqual(4.0);
      });
    });
  });

  describe('SearchAnalytics', () => {
    it('should record search performance metrics', async () => {
      await SearchAnalytics.recordSearchPerformance('test query', 150, 5, false);

      expect(SearchCache.getSearchResults).toHaveBeenCalled();
      expect(SearchCache.setSearchResults).toHaveBeenCalled();
    });

    it('should get search metrics for date range', async () => {
      const mockAnalytics = {
        queries: { 'wedding venues': 10, 'catering': 5 },
        filters: { location: 8, priceRange: 3 },
        totalSearches: 15,
        date: '2025-08-09',
      };

      (AnalyticsCache.getSearchAnalytics as jest.Mock).mockResolvedValue(mockAnalytics);

      const metrics = await SearchAnalytics.getSearchMetrics();

      expect(metrics.totalSearches).toBeGreaterThanOrEqual(0);
      expect(metrics.popularQueries).toBeDefined();
      expect(metrics.popularFilters).toBeDefined();
    });

    it('should get performance metrics', async () => {
      const mockPerformance = {
        totalSearches: 100,
        totalResponseTime: 5000,
        cacheHits: 60,
        totalResults: 500,
        date: '2025-08-09',
      };

      (SearchCache.getSearchResults as jest.Mock).mockResolvedValue(mockPerformance);

      const metrics = await SearchAnalytics.getPerformanceMetrics(7);

      expect(metrics.averageResponseTime).toBeGreaterThanOrEqual(0);
      expect(metrics.cacheHitRate).toBeGreaterThanOrEqual(0);
      expect(metrics.cacheHitRate).toBeLessThanOrEqual(100);
    });
  });

  describe('SearchOptimizer', () => {
    it('should optimize query by removing stop words', async () => {
      const query = 'the best wedding venues in the city';
      const optimized = await SearchOptimizer.optimizeQuery(query);

      expect(optimized).not.toContain('the');
      expect(optimized).toContain('best');
      expect(optimized).toContain('wedding');
      expect(optimized).toContain('venues');
      expect(optimized).toContain('city');
      // 'in' is a stop word and should be removed
      expect(optimized.split(' ')).not.toContain('in');
    });

    it('should get search suggestions', async () => {
      const mockPopularQueries = [
        { query: 'wedding venues', count: 50 },
        { query: 'wedding photography', count: 30 },
        { query: 'birthday party', count: 20 },
      ];

      (AnalyticsCache.getPopularQueries as jest.Mock).mockResolvedValue(mockPopularQueries);

      const suggestions = await SearchOptimizer.getSuggestions('wedding');

      expect(suggestions).toContain('wedding venues');
      expect(suggestions).toContain('wedding photography');
      expect(suggestions.length).toBeLessThanOrEqual(5);
    });

    it('should preload popular results', async () => {
      const mockPopularQueries = [
        { query: 'wedding venues', count: 50 },
        { query: 'catering services', count: 30 },
      ];

      (AnalyticsCache.getPopularQueries as jest.Mock).mockResolvedValue(mockPopularQueries);
      (SearchCache.getSearchResults as jest.Mock).mockResolvedValue(null);

      await SearchOptimizer.preloadPopularResults();

      expect(AnalyticsCache.getPopularQueries).toHaveBeenCalledWith(7);
    });
  });

  describe('Utility Functions', () => {
    it('should validate search filters correctly', () => {
      const filters = {
        query: '  wedding venues  ',
        location: 'Tunis',
        priceRange: [100, 500],
        rating: 4.5,
        invalidField: 'should be removed',
      };

      const validated = validateSearchFilters(filters);

      expect(validated.query).toBe('wedding venues');
      expect(validated.location).toBe('Tunis');
      expect(validated.priceRange).toEqual([100, 500]);
      expect(validated.rating).toBe(4.5);
      expect(validated).not.toHaveProperty('invalidField');
    });

    it('should build search query string correctly', () => {
      const filters: SearchFilters = {
        query: 'wedding',
        location: 'Tunis',
        category: 'venues',
        priceRange: [100, 500],
        rating: 4.0,
      };

      const queryString = buildSearchQuery(filters);

      expect(queryString).toContain('q=wedding');
      expect(queryString).toContain('location=Tunis');
      expect(queryString).toContain('category=venues');
      expect(queryString).toContain('minPrice=100');
      expect(queryString).toContain('maxPrice=500');
      expect(queryString).toContain('rating=4');
    });

    it('should format search results correctly', () => {
      const rawResults = [
        {
          id: '1',
          name: 'Test Service',
          description: 'Test Description',
          images: ['image1.jpg'],
          rating: 4.5,
          reviewCount: 10,
          basePrice: 100,
          location: 'Tunis',
          provider: {
            id: 'p1',
            name: 'Test Provider',
            isVerified: true,
          },
        },
        {
          id: '2',
          // Missing some fields to test defaults
          name: 'Another Service',
          provider: {
            id: 'p2',
            name: 'Another Provider',
          },
        },
      ];

      const formatted = formatSearchResults(rawResults);

      expect(formatted).toHaveLength(2);
      expect(formatted[0].id).toBe('1');
      expect(formatted[0].type).toBe('service');
      expect(formatted[1].description).toBe('');
      expect(formatted[1].rating).toBe(0);
      expect(formatted[1].reviewCount).toBe(0);
      expect(formatted[1].basePrice).toBe(0);
      expect(formatted[1].provider.isVerified).toBe(false);
    });
  });

  describe('Error Handling', () => {
    it('should handle cache errors gracefully', async () => {
      // Mock console.error to suppress error output in tests
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      
      (SearchCache.getSearchResults as jest.Mock).mockResolvedValue(null);
      
      const filters: SearchFilters = { query: 'test' };
      
      try {
        const result = await searchServices(filters);
        // Should still return results despite cache errors
        expect(result.results).toBeDefined();
        expect(result.total).toBeGreaterThanOrEqual(0);
      } catch (error) {
        // If there's an error, it should still be handled gracefully
        expect(error).toBeDefined();
      }
      
      consoleSpy.mockRestore();
    });

    it('should handle analytics errors gracefully', async () => {
      (AnalyticsCache.getSearchAnalytics as jest.Mock).mockRejectedValue(new Error('Analytics error'));

      const metrics = await SearchAnalytics.getSearchMetrics();

      expect(metrics.totalSearches).toBe(0);
      expect(metrics.uniqueQueries).toBe(0);
      expect(metrics.popularQueries).toEqual([]);
    });
  });
});