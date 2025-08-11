import { NextRequest, NextResponse } from 'next/server';
import { validateSearchFilters, searchWithMonitoring, SearchOptions } from '@/lib/search';
import type { SearchFilters } from '@/types';

export async function GET(request: NextRequest) {
  try {
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
        console.warn('Invalid date format in search parameters:', { startDate, endDate });
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
      return NextResponse.json({
        success: true,
        results: [],
        total: 0,
        page: options.page,
        limit: options.limit,
        hasMore: false,
        totalPages: 0,
        filters: validatedFilters,
        message: 'No search criteria provided'
      });
    }

    // Perform search with monitoring
    const searchResponse = await searchWithMonitoring(validatedFilters, options);

    // Add search metadata
    const response = {
      success: true,
      ...searchResponse,
      filters: validatedFilters,
      metadata: {
        searchTime: Date.now(),
        hasResults: searchResponse.results.length > 0,
        appliedFilters: Object.keys(validatedFilters).length,
        sortBy: options.sortBy,
      }
    };

    return NextResponse.json(response);

  } catch (error) {
    console.error('Search API error:', error);
    
    const errorResponse = {
      success: false,
      error: 'Internal server error',
      message: 'An error occurred while searching for services',
      data: [],
      total: 0,
      filters: {}
    };
    
    return NextResponse.json(errorResponse, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { filters: rawFilters, options: rawOptions } = body;
    
    const filters = validateSearchFilters(rawFilters || {});
    const options: SearchOptions = {
      page: Math.max(1, rawOptions?.page || 1),
      limit: Math.min(50, Math.max(1, rawOptions?.limit || 12)),
      sortBy: rawOptions?.sortBy || 'relevance',
      useCache: rawOptions?.useCache !== false,
    };
    
    const searchResponse = await searchWithMonitoring(filters, options);

    return NextResponse.json({
      success: true,
      ...searchResponse,
      filters,
      metadata: {
        searchTime: Date.now(),
        hasResults: searchResponse.results.length > 0,
        appliedFilters: Object.keys(filters).length,
        sortBy: options.sortBy,
      }
    });

  } catch (error) {
    console.error('Search API error:', error);
    
    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error',
        message: 'An error occurred while searching for services',
        results: [],
        total: 0,
        page: 1,
        limit: 12,
        hasMore: false,
        totalPages: 0,
      },
      { status: 500 }
    );
  }
}