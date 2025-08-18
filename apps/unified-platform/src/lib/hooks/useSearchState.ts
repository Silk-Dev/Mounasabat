'use client';

import { useState, useCallback, useEffect } from 'react';
import { searchServices } from '@/lib/search';
import type { SearchFilters, SearchResult } from '@/types';

export interface SearchState {
  results: SearchResult[];
  isLoading: boolean;
  error: string | null;
  hasSearched: boolean;
  total: number;
  page: number;
  hasMore: boolean;
}

export interface UseSearchStateReturn extends SearchState {
  search: (filters: SearchFilters, options?: { page?: number; append?: boolean }) => Promise<void>;
  clearResults: () => void;
  retry: () => void;
  clearError: () => void;
}

export function useSearchState(initialFilters: SearchFilters = {}): UseSearchStateReturn {
  const [state, setState] = useState<SearchState>({
    results: [],
    isLoading: false,
    error: null,
    hasSearched: false,
    total: 0,
    page: 1,
    hasMore: false,
  });

  const [lastFilters, setLastFilters] = useState<SearchFilters>(initialFilters);

  const search = useCallback(async (
    filters: SearchFilters, 
    options: { page?: number; append?: boolean } = {}
  ) => {
    const { page = 1, append = false } = options;
    
    setState(prev => ({
      ...prev,
      isLoading: true,
      error: null,
      ...(append ? {} : { results: [] }),
    }));

    setLastFilters(filters);

    try {
      const response = await searchServices(filters, { page, limit: 12 });
      
      setState(prev => ({
        ...prev,
        results: append ? [...prev.results, ...response.results] : response.results,
        isLoading: false,
        hasSearched: true,
        total: response.total,
        page: response.page,
        hasMore: response.hasMore,
      }));
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred';
      
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: errorMessage,
        hasSearched: true,
      }));
    }
  }, []);

  const clearResults = useCallback(() => {
    setState({
      results: [],
      isLoading: false,
      error: null,
      hasSearched: false,
      total: 0,
      page: 1,
      hasMore: false,
    });
  }, []);

  const retry = useCallback(() => {
    if (lastFilters) {
      search(lastFilters, { page: state.page });
    }
  }, [search, lastFilters, state.page]);

  const clearError = useCallback(() => {
    setState(prev => ({
      ...prev,
      error: null,
    }));
  }, []);

  return {
    ...state,
    search,
    clearResults,
    retry,
    clearError,
  };
}