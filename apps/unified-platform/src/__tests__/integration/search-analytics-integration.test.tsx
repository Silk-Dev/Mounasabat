/**
 * Integration test for search analytics tracking
 * Tests the complete flow from search API to analytics recording
 */

// Mock Next.js environment
Object.defineProperty(global, 'Request', {
  value: class MockRequest {
    constructor(public url: string, public init?: RequestInit) {}
  },
});

Object.defineProperty(global, 'Response', {
  value: class MockResponse {
    constructor(public body?: any, public init?: ResponseInit) {}
  },
});

import { NextRequest } from 'next/server';
import { GET, POST } from '@/app/api/search/route';
import { GET as AnalyticsGET } from '@/app/api/search/analytics/route';
import { GET as PopularGET } from '@/app/api/search/popular/route';
import { prisma } from '@/lib/prisma';
import { SearchAnalytics } from '@/lib/search-analytics';

// Mock auth to return a test user
jest.mock('@/lib/auth', () => ({
  auth: jest.fn().mockResolvedValue({
    user: { id: 'test-user-123' }
  })
}));

// Mock the search function to return predictable results
jest.mock('@/lib/search', () => ({
  validateSearchFilters: jest.fn((filters) => filters),
  searchWithMonitoring: jest.fn().mockResolvedValue({
    results: [
      {
        id: 'service-1',
        name: 'Wedding Venue',
        type: 'service',
        description: 'Beautiful wedding venue',
        images: [],
        rating: 4.5,
        reviewCount: 10,
        basePrice: 1000,
        location: 'Tunis',
        provider: {
          id: 'provider-1',
          name: 'Venue Provider',
          isVerified: true,
        },
      },
    ],
    total: 1,
    page: 1,
    limit: 12,
    hasMore: false,
    totalPages: 1,
  }),
}));

describe('Search Analytics Integration', () => {
  beforeEach(async () => {
    // Clear any existing search analytics data
    await prisma.searchAnalytics.deleteMany({});
  });

  afterAll(async () => {
    // Clean up test data
    await prisma.searchAnalytics.deleteMany({});
  });

  describe('Search API Analytics Tracking', () => {
    it('should record search analytics when performing a search via GET', async () => {
      const url = new URL('http://localhost:3000/api/search?q=wedding+venues&location=Tunis&category=Venues');
      const request = new NextRequest(url);

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.results).toHaveLength(1);

      // Wait a bit for async analytics recording
      await new Promise(resolve => setTimeout(resolve, 100));

      // Verify analytics were recorded
      const analyticsRecords = await prisma.searchAnalytics.findMany({
        where: { query: 'wedding venues' }
      });

      expect(analyticsRecords).toHaveLength(2); // One for search, one for performance
      
      const searchRecord = analyticsRecords.find(record => 
        !record.filters || !(record.filters as any).performance
      );
      const performanceRecord = analyticsRecords.find(record => 
        (record.filters as any)?.performance
      );

      expect(searchRecord).toBeDefined();
      expect(searchRecord?.query).toBe('wedding venues');
      expect(searchRecord?.resultCount).toBe(1);
      expect(searchRecord?.userId).toBe('test-user-123');
      expect((searchRecord?.filters as any)?.location).toBe('Tunis');
      expect((searchRecord?.filters as any)?.category).toBe('Venues');

      expect(performanceRecord).toBeDefined();
      expect((performanceRecord?.filters as any)?.performance?.responseTime).toBeGreaterThan(0);
    });

    it('should record search analytics when performing a search via POST', async () => {
      const url = new URL('http://localhost:3000/api/search');
      const request = new NextRequest(url, {
        method: 'POST',
        body: JSON.stringify({
          filters: {
            query: 'catering services',
            location: 'Sfax',
            priceRange: [100, 500],
          },
          options: {
            page: 1,
            limit: 10,
            sortBy: 'price_low',
          },
        }),
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);

      // Wait for async analytics recording
      await new Promise(resolve => setTimeout(resolve, 100));

      // Verify analytics were recorded
      const analyticsRecords = await prisma.searchAnalytics.findMany({
        where: { query: 'catering services' }
      });

      expect(analyticsRecords.length).toBeGreaterThan(0);
      
      const searchRecord = analyticsRecords.find(record => 
        !record.filters || !(record.filters as any).performance
      );

      expect(searchRecord).toBeDefined();
      expect(searchRecord?.query).toBe('catering services');
      expect(searchRecord?.userId).toBe('test-user-123');
      expect((searchRecord?.filters as any)?.location).toBe('Sfax');
      expect((searchRecord?.filters as any)?.priceRange).toEqual([100, 500]);
    });
  });

  describe('Analytics API Endpoints', () => {
    beforeEach(async () => {
      // Seed some test analytics data
      await prisma.searchAnalytics.createMany({
        data: [
          {
            query: 'wedding venues',
            filters: { category: 'Venues', location: 'Tunis' },
            resultCount: 5,
            userId: 'user-1',
            createdAt: new Date(),
          },
          {
            query: 'wedding venues',
            filters: { category: 'Venues', location: 'Sousse' },
            resultCount: 3,
            userId: 'user-2',
            createdAt: new Date(),
          },
          {
            query: 'catering',
            filters: { category: 'Catering' },
            resultCount: 8,
            userId: 'user-1',
            createdAt: new Date(),
          },
          {
            query: 'photographers',
            filters: { category: 'Photography' },
            resultCount: 0,
            userId: 'user-3',
            createdAt: new Date(),
          },
          {
            query: 'performance test',
            filters: {
              performance: {
                responseTime: 250,
                fromCache: false,
                timestamp: new Date().toISOString(),
              }
            },
            resultCount: 10,
            createdAt: new Date(),
          },
        ],
      });
    });

    it('should return search metrics via analytics API', async () => {
      const url = new URL('http://localhost:3000/api/search/analytics?type=metrics');
      const request = new NextRequest(url);

      const response = await AnalyticsGET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data).toHaveProperty('totalSearches');
      expect(data.data).toHaveProperty('uniqueQueries');
      expect(data.data).toHaveProperty('popularQueries');
      expect(data.data).toHaveProperty('averageResultsPerSearch');
      expect(data.data).toHaveProperty('searchesWithNoResults');

      expect(data.data.totalSearches).toBeGreaterThan(0);
      expect(data.data.searchesWithNoResults).toBeGreaterThan(0);
    });

    it('should return performance metrics via analytics API', async () => {
      const url = new URL('http://localhost:3000/api/search/analytics?type=performance');
      const request = new NextRequest(url);

      const response = await AnalyticsGET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data).toHaveProperty('averageResponseTime');
      expect(data.data).toHaveProperty('cacheHitRate');
      expect(data.data).toHaveProperty('totalSearches');
      expect(data.data).toHaveProperty('slowQueries');
      expect(data.data).toHaveProperty('popularQueries');
      expect(data.data).toHaveProperty('emptyResultQueries');
    });

    it('should return empty search analytics via analytics API', async () => {
      const url = new URL('http://localhost:3000/api/search/analytics?type=empty-searches');
      const request = new NextRequest(url);

      const response = await AnalyticsGET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data).toHaveProperty('totalEmptySearches');
      expect(data.data).toHaveProperty('emptySearchRate');
      expect(data.data).toHaveProperty('commonEmptyQueries');

      expect(data.data.totalEmptySearches).toBeGreaterThan(0);
      expect(data.data.emptySearchRate).toBeGreaterThan(0);
    });

    it('should return user behavior analytics via analytics API', async () => {
      const url = new URL('http://localhost:3000/api/search/analytics?type=user-behavior');
      const request = new NextRequest(url);

      const response = await AnalyticsGET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data).toHaveProperty('uniqueUsers');
      expect(data.data).toHaveProperty('averageSearchesPerUser');
      expect(data.data).toHaveProperty('topSearchingUsers');

      expect(data.data.uniqueUsers).toBeGreaterThan(0);
      expect(data.data.topSearchingUsers).toBeInstanceOf(Array);
    });

    it('should return trending categories via analytics API', async () => {
      const url = new URL('http://localhost:3000/api/search/analytics?type=trending-categories');
      const request = new NextRequest(url);

      const response = await AnalyticsGET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data).toBeInstanceOf(Array);
      
      if (data.data.length > 0) {
        expect(data.data[0]).toHaveProperty('category');
        expect(data.data[0]).toHaveProperty('count');
      }
    });
  });

  describe('Popular Searches API', () => {
    beforeEach(async () => {
      // Seed popular search data
      await prisma.searchAnalytics.createMany({
        data: [
          { query: 'wedding venues', filters: {}, resultCount: 5, createdAt: new Date() },
          { query: 'wedding venues', filters: {}, resultCount: 3, createdAt: new Date() },
          { query: 'wedding venues', filters: {}, resultCount: 8, createdAt: new Date() },
          { query: 'catering services', filters: {}, resultCount: 10, createdAt: new Date() },
          { query: 'catering services', filters: {}, resultCount: 7, createdAt: new Date() },
          { query: 'photographers', filters: {}, resultCount: 12, createdAt: new Date() },
        ],
      });
    });

    it('should return popular searches based on analytics data', async () => {
      const url = new URL('http://localhost:3000/api/search/popular?limit=5');
      const request = new NextRequest(url);

      const response = await PopularGET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.searches).toBeInstanceOf(Array);
      expect(data.searches.length).toBeGreaterThan(0);
      expect(data.searches.length).toBeLessThanOrEqual(5);

      // Should include 'wedding venues' as it appears most frequently
      expect(data.searches).toContain('wedding venues');
    });
  });

  describe('SearchAnalytics Class Methods', () => {
    beforeEach(async () => {
      // Clear and seed test data
      await prisma.searchAnalytics.deleteMany({});
      await prisma.searchAnalytics.createMany({
        data: [
          {
            query: 'wedding planning',
            filters: { category: 'Event Planning' },
            resultCount: 15,
            userId: 'user-1',
            createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
          },
          {
            query: 'wedding planning',
            filters: { category: 'Event Planning' },
            resultCount: 12,
            userId: 'user-2',
            createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // 1 day ago
          },
          {
            query: 'birthday party',
            filters: { category: 'Entertainment' },
            resultCount: 0,
            userId: 'user-3',
            createdAt: new Date(), // today
          },
        ],
      });
    });

    it('should get popular queries correctly', async () => {
      const popularQueries = await SearchAnalytics.getPopularQueries(7);

      expect(popularQueries).toBeInstanceOf(Array);
      expect(popularQueries.length).toBeGreaterThan(0);
      
      const weddingQuery = popularQueries.find(q => q.query === 'wedding planning');
      expect(weddingQuery).toBeDefined();
      expect(weddingQuery?.count).toBe(2);
    });

    it('should get trending categories correctly', async () => {
      const trendingCategories = await SearchAnalytics.getTrendingCategories(7);

      expect(trendingCategories).toBeInstanceOf(Array);
      
      if (trendingCategories.length > 0) {
        const eventPlanningCategory = trendingCategories.find(c => c.category === 'Event Planning');
        expect(eventPlanningCategory).toBeDefined();
        expect(eventPlanningCategory?.count).toBe(2);
      }
    });

    it('should get empty search analytics correctly', async () => {
      const emptyAnalytics = await SearchAnalytics.getEmptySearchAnalytics(7);

      expect(emptyAnalytics).toHaveProperty('totalEmptySearches');
      expect(emptyAnalytics).toHaveProperty('emptySearchRate');
      expect(emptyAnalytics).toHaveProperty('commonEmptyQueries');

      expect(emptyAnalytics.totalEmptySearches).toBe(1);
      expect(emptyAnalytics.emptySearchRate).toBeGreaterThan(0);
      expect(emptyAnalytics.commonEmptyQueries).toContainEqual({
        query: 'birthday party',
        count: 1,
      });
    });

    it('should get user search behavior correctly', async () => {
      const userBehavior = await SearchAnalytics.getUserSearchBehavior(7);

      expect(userBehavior).toHaveProperty('uniqueUsers');
      expect(userBehavior).toHaveProperty('averageSearchesPerUser');
      expect(userBehavior).toHaveProperty('topSearchingUsers');

      expect(userBehavior.uniqueUsers).toBe(3);
      expect(userBehavior.averageSearchesPerUser).toBeCloseTo(1);
      expect(userBehavior.topSearchingUsers).toBeInstanceOf(Array);
    });
  });
});