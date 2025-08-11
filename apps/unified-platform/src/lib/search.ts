// Search utilities for the unified platform
import React from 'react';
import type { SearchFilters, SearchResult } from '@/types';
import { memoryCache } from './cache';
import { prisma } from './prisma';
import { SearchAnalytics } from './search-analytics';
import { CategoryService } from './categories';

export interface SearchOptions {
  page?: number;
  limit?: number;
  useCache?: boolean;
  sortBy?: 'relevance' | 'price_low' | 'price_high' | 'rating' | 'reviews' | 'distance';
}

export interface SearchResponse {
  results: SearchResult[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
  totalPages: number;
}

export async function searchServices(
  filters: SearchFilters, 
  options: SearchOptions = {}
): Promise<SearchResponse> {
  const { page = 1, limit = 12, useCache = true, sortBy = 'relevance' } = options;
  
  // Create cache key including pagination and sorting
  const cacheKey = JSON.stringify({ filters, page, limit, sortBy });

  // Try to get from cache first
  if (useCache) {
    const cachedResponse = memoryCache.get(cacheKey);
    if (cachedResponse) {
      return cachedResponse;
    }
  }

  let allResults: SearchResult[];

  try {
    // Use database search
    allResults = await searchServicesFromDatabase(filters, sortBy);
  } catch (error) {
    console.error('Database search failed:', error);
    // Throw error instead of returning empty results to allow proper error handling
    throw new Error('Search service temporarily unavailable. Please try again.');
  }

  // Apply pagination
  const total = allResults.length;
  const totalPages = Math.ceil(total / limit);
  const startIndex = (page - 1) * limit;
  const endIndex = startIndex + limit;
  const results = allResults.slice(startIndex, endIndex);
  const hasMore = page < totalPages;

  const response: SearchResponse = {
    results,
    total,
    page,
    limit,
    hasMore,
    totalPages,
  };

  // Record search analytics
  if (filters.query) {
    await SearchAnalytics.recordSearch(filters.query, filters, total);
  }

  // Cache the response
  if (useCache) {
    memoryCache.set(cacheKey, response, 5 * 60 * 1000); // 5 minutes cache
  }

  return response;
}

async function searchServicesFromDatabase(filters: SearchFilters, sortBy: string = 'relevance'): Promise<SearchResult[]> {
  if (!prisma) {
    throw new Error('Database not available');
  }

  const whereClause: any = {
    isActive: true,
  };

  // Full-text search on name and description
  if (filters.query) {
    whereClause.OR = [
      {
        name: {
          contains: filters.query,
          mode: 'insensitive',
        },
      },
      {
        description: {
          contains: filters.query,
          mode: 'insensitive',
        },
      },
      {
        provider: {
          name: {
            contains: filters.query,
            mode: 'insensitive',
          },
        },
      },
    ];
  }

  // Category filter
  if (filters.category) {
    whereClause.category = {
      equals: filters.category,
      mode: 'insensitive',
    };
  }

  // Service type filter
  if (filters.serviceType && filters.serviceType.length > 0) {
    whereClause.category = {
      in: filters.serviceType,
      mode: 'insensitive',
    };
  }

  // Price range filter
  if (filters.priceRange) {
    const [minPrice, maxPrice] = filters.priceRange;
    whereClause.basePrice = {
      gte: minPrice,
      lte: maxPrice,
    };
  }

  // Location filter
  if (filters.location) {
    whereClause.OR = [
      ...(whereClause.OR || []),
      {
        location: {
          contains: filters.location,
          mode: 'insensitive',
        },
      },
      {
        coverageArea: {
          has: filters.location,
        },
      },
      {
        provider: {
          coverageAreas: {
            has: filters.location,
          },
        },
      },
    ];
  }

  // Provider rating filter
  if (filters.rating) {
    whereClause.provider = {
      ...whereClause.provider,
      rating: {
        gte: filters.rating,
      },
    };
  }

  const services = await prisma.service.findMany({
    where: whereClause,
    include: {
      provider: {
        select: {
          id: true,
          name: true,
          isVerified: true,
          rating: true,
          reviewCount: true,
        },
      },
      reviews: {
        select: {
          rating: true,
        },
      },
    },
    orderBy: getSortOrder(sortBy),
    take: 100, // Limit results for performance
  });

  return services.map(service => ({
    id: service.id,
    type: 'service' as const,
    name: service.name,
    description: service.description || '',
    images: service.images,
    rating: service.provider.rating || 0,
    reviewCount: service.provider.reviewCount,
    basePrice: service.basePrice || 0,
    location: service.location || '',
    provider: {
      id: service.provider.id,
      name: service.provider.name,
      isVerified: service.provider.isVerified,
    },
  }));
}

function getSortOrder(sortBy: string) {
  switch (sortBy) {
    case 'price_low':
      return [{ basePrice: 'asc' as const }];
    case 'price_high':
      return [{ basePrice: 'desc' as const }];
    case 'rating':
      return [{ provider: { rating: 'desc' as const } }];
    case 'reviews':
      return [{ provider: { reviewCount: 'desc' as const } }];
    case 'distance':
      // For now, sort by location name - in real implementation, use coordinates
      return [{ location: 'asc' as const }];
    case 'relevance':
    default:
      return [
        { provider: { rating: 'desc' as const } },
        { provider: { reviewCount: 'desc' as const } },
      ];
  }
}



export function buildSearchQuery(filters: SearchFilters): string {
  const params = new URLSearchParams();
  
  if (filters.query) params.set('q', filters.query);
  if (filters.location) params.set('location', filters.location);
  if (filters.category) params.set('category', filters.category);
  if (filters.priceRange) {
    params.set('minPrice', filters.priceRange[0].toString());
    params.set('maxPrice', filters.priceRange[1].toString());
  }
  if (filters.rating) params.set('rating', filters.rating.toString());
  if (filters.availability) {
    params.set('startDate', filters.availability.startDate.toISOString());
    params.set('endDate', filters.availability.endDate.toISOString());
  }
  
  return params.toString();
}

export function validateSearchFilters(filters: Partial<SearchFilters>): SearchFilters {
  const validated: SearchFilters = {};
  
  if (filters.query && typeof filters.query === 'string' && filters.query.trim()) {
    validated.query = filters.query.trim();
  }
  
  if (filters.location && typeof filters.location === 'string' && filters.location.trim()) {
    validated.location = filters.location.trim();
  }
  
  if (filters.category && typeof filters.category === 'string') {
    validated.category = filters.category;
  }
  
  if (filters.priceRange && Array.isArray(filters.priceRange) && filters.priceRange.length === 2) {
    const [min, max] = filters.priceRange;
    if (typeof min === 'number' && typeof max === 'number' && min >= 0 && max > min) {
      validated.priceRange = [min, max];
    }
  }
  
  if (filters.rating && typeof filters.rating === 'number' && filters.rating >= 0 && filters.rating <= 5) {
    validated.rating = filters.rating;
  }
  
  if (filters.availability && filters.availability.startDate && filters.availability.endDate) {
    validated.availability = filters.availability;
  }
  
  if (filters.serviceType && Array.isArray(filters.serviceType)) {
    validated.serviceType = filters.serviceType.filter(type => typeof type === 'string');
  }
  
  return validated;
}

export function formatSearchResults(results: any[]): SearchResult[] {
  return results.map(result => ({
    id: result.id || '',
    type: result.type || 'service',
    name: result.name || '',
    description: result.description || '',
    images: Array.isArray(result.images) ? result.images : [],
    rating: typeof result.rating === 'number' ? result.rating : 0,
    reviewCount: typeof result.reviewCount === 'number' ? result.reviewCount : 0,
    basePrice: typeof result.basePrice === 'number' ? result.basePrice : 0,
    location: result.location || '',
    provider: {
      id: result.provider?.id || '',
      name: result.provider?.name || '',
      isVerified: Boolean(result.provider?.isVerified)
    }
  }));
}

// Helper function to get popular searches from analytics
export async function getPopularSearches(): Promise<string[]> {
  try {
    const popularQueries = await SearchAnalytics.getPopularQueries(7);
    return popularQueries.map(({ query }) => query);
  } catch (error) {
    console.error('Failed to get popular searches:', error);
    return [];
  }
}

// Helper function to get trending categories from database
export async function getTrendingCategories() {
  try {
    return await CategoryService.getTrendingCategories();
  } catch (error) {
    console.error('Failed to get trending categories:', error);
    return [];
  }
}

// Helper function to get all categories
export async function getServiceCategories() {
  try {
    return await CategoryService.getAllCategories();
  } catch (error) {
    console.error('Failed to get service categories:', error);
    return [];
  }
}



// Search optimization utilities
export class SearchOptimizer {
  static async optimizeQuery(query: string): Promise<string> {
    // Remove common stop words
    const stopWords = ['the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by'];
    const words = query.toLowerCase().split(/\s+/);
    const filteredWords = words.filter(word => !stopWords.includes(word) && word.length > 2);
    
    return filteredWords.join(' ');
  }

  static async getSuggestions(query: string): Promise<string[]> {
    try {
      // Get popular queries that start with or contain the current query
      const popularQueries = await SearchAnalytics.getPopularQueries(30);
      const suggestions = popularQueries
        .filter(({ query: popularQuery }) => 
          popularQuery.toLowerCase().includes(query.toLowerCase()) ||
          query.toLowerCase().includes(popularQuery.toLowerCase())
        )
        .slice(0, 5)
        .map(({ query: popularQuery }) => popularQuery);

      return suggestions;
    } catch (error) {
      console.error('Failed to get search suggestions:', error);
      return [];
    }
  }

  static async preloadPopularResults() {
    try {
      const popularQueries = await SearchAnalytics.getPopularQueries(7);
      
      // Preload results for top 5 popular queries
      const preloadPromises = popularQueries.slice(0, 5).map(async ({ query }) => {
        const filters: SearchFilters = { query };
        const options: SearchOptions = { page: 1, limit: 12, useCache: false };
        
        try {
          await searchServices(filters, options);
          console.log(`Preloaded results for query: ${query}`);
        } catch (error) {
          console.error(`Failed to preload results for query: ${query}`, error);
        }
      });

      await Promise.all(preloadPromises);
      console.log('Popular search results preloaded successfully');
    } catch (error) {
      console.error('Failed to preload popular results:', error);
    }
  }
}

// Infinite scroll hook for search results
export function useInfiniteSearch(initialFilters: SearchFilters = {}) {
  const [results, setResults] = React.useState<SearchResult[]>([]);
  const [filters, setFilters] = React.useState<SearchFilters>(initialFilters);
  const [loading, setLoading] = React.useState(false);
  const [hasMore, setHasMore] = React.useState(true);
  const [page, setPage] = React.useState(1);
  const [error, setError] = React.useState<string | null>(null);

  const loadMore = React.useCallback(async () => {
    if (loading || !hasMore) return;

    setLoading(true);
    setError(null);

    try {
      const response = await searchServices(filters, { page, limit: 12 });
      
      if (page === 1) {
        setResults(response.results);
      } else {
        setResults(prev => [...prev, ...response.results]);
      }
      
      setHasMore(response.hasMore);
      setPage(prev => prev + 1);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Search failed');
    } finally {
      setLoading(false);
    }
  }, [filters, page, loading, hasMore]);

  const search = React.useCallback((newFilters: SearchFilters) => {
    setFilters(newFilters);
    setPage(1);
    setResults([]);
    setHasMore(true);
    setError(null);
  }, []);

  const reset = React.useCallback(() => {
    setResults([]);
    setPage(1);
    setHasMore(true);
    setError(null);
    setLoading(false);
  }, []);

  return {
    results,
    loading,
    hasMore,
    error,
    loadMore,
    search,
    reset,
    filters,
  };
}

// Performance monitoring wrapper
export async function searchWithMonitoring(
  filters: SearchFilters,
  options: SearchOptions = {}
): Promise<SearchResponse> {
  const startTime = Date.now();
  let fromCache = false;

  try {
    // Check if result is from cache
    const cacheKey = JSON.stringify({ filters, ...options });
    const cachedResult = memoryCache.get(cacheKey);
    fromCache = !!cachedResult;

    const response = await searchServices(filters, options);
    const responseTime = Date.now() - startTime;

    // Log performance metrics (could be enhanced to store in database)
    console.log(`Search performance: ${responseTime}ms, ${response.results.length} results, fromCache: ${fromCache}`);

    return response;
  } catch (error) {
    const responseTime = Date.now() - startTime;
    console.error(`Search failed after ${responseTime}ms:`, error);
    throw error;
  }
}