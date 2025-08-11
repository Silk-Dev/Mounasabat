'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { validateSearchFilters, buildSearchQuery } from '@/lib/search';
import type { SearchFilters, SearchResult, SearchResponse } from '@/types';

interface UseAdvancedSearchOptions {
  initialFilters?: SearchFilters;
  debounceMs?: number;
  autoSearch?: boolean;
}

interface UseAdvancedSearchReturn {
  // State
  filters: SearchFilters;
  results: SearchResult[];
  isLoading: boolean;
  error: string | null;
  totalResults: number;
  
  // Actions
  updateFilters: (newFilters: Partial<SearchFilters>) => void;
  clearFilters: () => void;
  search: (customFilters?: SearchFilters) => Promise<void>;
  
  // Utilities
  hasActiveFilters: boolean;
  activeFiltersCount: number;
}

export function useAdvancedSearch(options: UseAdvancedSearchOptions = {}): UseAdvancedSearchReturn {
  const {
    initialFilters = {},
    debounceMs = 300,
    autoSearch = true
  } = options;

  const router = useRouter();
  const searchParams = useSearchParams();
  
  const [filters, setFilters] = useState<SearchFilters>(initialFilters);
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [totalResults, setTotalResults] = useState(0);

  // Initialize filters from URL parameters
  useEffect(() => {
    const urlFilters: Partial<SearchFilters> = {
      query: searchParams.get('q') || undefined,
      location: searchParams.get('location') || undefined,
      category: searchParams.get('category') || undefined,
      rating: searchParams.get('rating') ? parseFloat(searchParams.get('rating')!) : undefined,
    };

    const minPrice = searchParams.get('minPrice');
    const maxPrice = searchParams.get('maxPrice');
    if (minPrice && maxPrice) {
      urlFilters.priceRange = [parseFloat(minPrice), parseFloat(maxPrice)];
    }

    const serviceTypes = searchParams.get('serviceTypes');
    if (serviceTypes) {
      urlFilters.serviceType = serviceTypes.split(',');
    }

    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    if (startDate && endDate) {
      urlFilters.availability = {
        startDate: new Date(startDate),
        endDate: new Date(endDate)
      };
    }

    const validatedFilters = validateSearchFilters({ ...initialFilters, ...urlFilters });
    setFilters(validatedFilters);

    if (autoSearch && Object.keys(validatedFilters).length > 0) {
      performSearch(validatedFilters);
    }
  }, [searchParams, initialFilters, autoSearch]);

  // Perform the actual search
  const performSearch = useCallback(async (searchFilters: SearchFilters) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const queryString = buildSearchQuery(searchFilters);
      const response = await fetch(`/api/search?${queryString}`);
      
      if (!response.ok) {
        throw new Error(`Search failed: ${response.status}`);
      }
      
      const data: SearchResponse = await response.json();
      
      if (data.success) {
        setResults(data.data);
        setTotalResults(data.total);
        setFilters(data.filters);
      } else {
        throw new Error(data.error || 'Search failed');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An error occurred while searching';
      setError(errorMessage);
      setResults([]);
      setTotalResults(0);
      console.error('Search error:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Debounced search function
  const debouncedSearch = useMemo(() => {
    let timeoutId: NodeJS.Timeout;
    return (searchFilters: SearchFilters) => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        performSearch(searchFilters);
      }, debounceMs);
    };
  }, [performSearch, debounceMs]);

  // Update filters and optionally trigger search
  const updateFilters = useCallback((newFilters: Partial<SearchFilters>) => {
    const updatedFilters = validateSearchFilters({ ...filters, ...newFilters });
    setFilters(updatedFilters);
    
    // Update URL
    const queryString = buildSearchQuery(updatedFilters);
    const newUrl = queryString ? `/search?${queryString}` : '/search';
    router.push(newUrl, { scroll: false });
    
    if (autoSearch) {
      debouncedSearch(updatedFilters);
    }
  }, [filters, router, autoSearch, debouncedSearch]);

  // Clear all filters
  const clearFilters = useCallback(() => {
    setFilters({});
    setResults([]);
    setTotalResults(0);
    setError(null);
    router.push('/search', { scroll: false });
  }, [router]);

  // Manual search trigger
  const search = useCallback(async (customFilters?: SearchFilters) => {
    const searchFilters = customFilters || filters;
    await performSearch(searchFilters);
  }, [filters, performSearch]);

  // Computed values
  const hasActiveFilters = useMemo(() => {
    return Object.keys(filters).length > 0;
  }, [filters]);

  const activeFiltersCount = useMemo(() => {
    let count = 0;
    if (filters.query) count++;
    if (filters.location) count++;
    if (filters.category || (filters.serviceType && filters.serviceType.length > 0)) count++;
    if (filters.priceRange) count++;
    if (filters.rating) count++;
    if (filters.availability) count++;
    return count;
  }, [filters]);

  return {
    // State
    filters,
    results,
    isLoading,
    error,
    totalResults,
    
    // Actions
    updateFilters,
    clearFilters,
    search,
    
    // Utilities
    hasActiveFilters,
    activeFiltersCount
  };
}