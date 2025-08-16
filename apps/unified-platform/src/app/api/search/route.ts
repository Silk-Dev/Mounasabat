import { NextRequest, NextResponse } from 'next/server';
import { validateSearchFilters, searchWithMonitoring, SearchOptions } from '@/lib/search';
import { SearchAnalytics } from '@/lib/search-analytics';
import type { SearchFilters } from '@/types';
import { auth } from '@/lib/auth';
import { logger } from '../../../lib/production-logger';
import { withApiMiddleware } from '@/lib/api-middleware';
import { ApiResponseBuilder } from '@/lib/api-response';

async function handleGET(request: NextRequest) {
    const { searchParams } = new URL(request.url);
    
    // Extract search parameters with better validation
    const filters: Partial<SearchFilters> = {
      query: searchParams.get('q')?.trim() || undefined,
      location: searchParams.get('location')?.trim() || undefined,
      category: searchParams.get('category')?.trim() || undefined,
    };

    // Handle rating with validation
    const ratingParam = searchParams.get('rating');
    if (ratingParam) {
      const rating = parseFloat(ratingParam);
      if (!isNaN(rating) && rating >= 0 && rating <= 5) {
        filters.rating = rating;
      }
    }

    // Handle price range with validation
    const minPrice = searchParams.get('minPrice');
    const maxPrice = searchParams.get('maxPrice');
    if (minPrice && maxPrice) {
      const min = parseFloat(minPrice);
      const max = parseFloat(maxPrice);
      if (!isNaN(min) && !isNaN(max) && min >= 0 && max > min) {
        filters.priceRange = [min, max];
      }
    }

    // Handle availability dates with validation
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    if (startDate && endDate) {
      try {
        const start = new Date(startDate);
        const end = new Date(endDate);
        if (!isNaN(start.getTime()) && !isNaN(end.getTime()) && start <= end) {
          filters.availability = {
            startDate: start,
            endDate: end
          };
        }
      } catch (dateError) {
        logger.warn('Invalid date format in search parameters:', { startDate, endDate });
      }
    }

    // Handle service types with validation
    const serviceTypes = searchParams.get('serviceTypes');
    if (serviceTypes) {
      const types = serviceTypes.split(',').map(type => type.trim()).filter(Boolean);
      if (types.length > 0) {
        filters.serviceType = types;
      }
    }

    // Extract pagination and sorting parameters
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '12');
    const sortBy = searchParams.get('sortBy') || 'relevance';

    // Validate filters
    const validatedFilters = validateSearchFilters(filters);

    // Search options
    const options: SearchOptions = {
      page: Math.max(1, page),
      limit: Math.min(50, Math.max(1, limit)), // Limit between 1 and 50
      sortBy: sortBy as any,
      useCache: true,
    };

    // Check if we have any meaningful search criteria
    if (Object.keys(validatedFilters).length === 0) {
      return ApiResponseBuilder.success({
        results: [],
        total: 0,
        page: options.page,
        limit: options.limit,
        hasMore: false,
        totalPages: 0,
        filters: validatedFilters,
      }, 'No search criteria provided');
    }

    // Get user information for analytics
    const session = await auth();
    const userId = session?.user?.id;

    // Perform search with monitoring
    const startTime = Date.now();
    const searchResponse = await searchWithMonitoring(validatedFilters, options);
    const responseTime = Date.now() - startTime;

    // Record search analytics with user information
    if (validatedFilters.query) {
      await SearchAnalytics.recordSearch(
        validatedFilters.query,
        validatedFilters,
        searchResponse.total,
        userId
      );

      // Record performance metrics
      await SearchAnalytics.recordSearchPerformance(
        validatedFilters.query,
        responseTime,
        searchResponse.total,
        false // Assuming not from cache for API calls
      );
    }

    // Add search metadata
    const responseData = {
      ...searchResponse,
      filters: validatedFilters,
      metadata: {
        searchTime: Date.now(),
        hasResults: searchResponse.results.length > 0,
        appliedFilters: Object.keys(validatedFilters).length,
        sortBy: options.sortBy,
        responseTime,
      }
    };

    return ApiResponseBuilder.success(responseData, 'Search completed successfully');
}

async function handlePOST(request: NextRequest) {
    const body = await request.json();
    const { filters: rawFilters, options: rawOptions } = body;
    
    const filters = validateSearchFilters(rawFilters || {});
    const options: SearchOptions = {
      page: Math.max(1, rawOptions?.page || 1),
      limit: Math.min(50, Math.max(1, rawOptions?.limit || 12)),
      sortBy: rawOptions?.sortBy || 'relevance',
      useCache: rawOptions?.useCache !== false,
    };
    
    // Get user information for analytics
    const session = await auth();
    const userId = session?.user?.id;

    // Perform search with monitoring
    const startTime = Date.now();
    const searchResponse = await searchWithMonitoring(filters, options);
    const responseTime = Date.now() - startTime;

    // Record search analytics with user information
    if (filters.query) {
      await SearchAnalytics.recordSearch(
        filters.query,
        filters,
        searchResponse.total,
        userId
      );

      // Record performance metrics
      await SearchAnalytics.recordSearchPerformance(
        filters.query,
        responseTime,
        searchResponse.total,
        false // Assuming not from cache for API calls
      );
    }

    const responseData = {
      ...searchResponse,
      filters,
      metadata: {
        searchTime: Date.now(),
        hasResults: searchResponse.results.length > 0,
        appliedFilters: Object.keys(filters).length,
        sortBy: options.sortBy,
        responseTime,
      }
    };

    return ApiResponseBuilder.success(responseData, 'Search completed successfully');
}

// Export wrapped handlers
export const GET = withApiMiddleware(handleGET, {
  component: 'search_api',
  logRequests: true,
});

export const POST = withApiMiddleware(handlePOST, {
  component: 'search_api',
  logRequests: true,
});