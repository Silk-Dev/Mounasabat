import { useState, useEffect, useCallback, useRef } from 'react';

export interface DataLoadingState<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
  isEmpty: boolean;
  refetch: () => void;
  isRefetching: boolean;
  lastFetched: Date | null;
}

export interface DataLoaderOptions {
  enabled?: boolean;
  retryCount?: number;
  retryDelay?: number;
  timeout?: number;
  onSuccess?: (data: any) => void;
  onError?: (error: Error) => void;
  staleTime?: number;
}

export function useDataLoader<T>(
  fetchFn: () => Promise<T>,
  dependencies: any[] = [],
  options: DataLoaderOptions = {}
): DataLoadingState<T> {
  const {
    enabled = true,
    retryCount = 0,
    retryDelay = 1000,
    timeout = 30000,
    onSuccess,
    onError,
    staleTime = 0,
  } = options;

  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(enabled);
  const [error, setError] = useState<string | null>(null);
  const [isRefetching, setIsRefetching] = useState(false);
  const [lastFetched, setLastFetched] = useState<Date | null>(null);
  
  const retryCountRef = useRef(0);
  const timeoutRef = useRef<NodeJS.Timeout>();
  const abortControllerRef = useRef<AbortController>();

  const fetchData = useCallback(async (isRetry = false) => {
    if (!enabled) return;

    // Check if data is still fresh
    if (lastFetched && staleTime > 0) {
      const timeSinceLastFetch = Date.now() - lastFetched.getTime();
      if (timeSinceLastFetch < staleTime) {
        return;
      }
    }

    // Cancel previous request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    abortControllerRef.current = new AbortController();
    
    try {
      if (!isRetry) {
        setLoading(true);
        retryCountRef.current = 0;
      } else {
        setIsRefetching(true);
      }
      
      setError(null);

      // Set timeout
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      
      const timeoutPromise = new Promise<never>((_, reject) => {
        timeoutRef.current = setTimeout(() => {
          reject(new Error('Request timeout'));
        }, timeout);
      });

      const fetchPromise = fetchFn();
      const result = await Promise.race([fetchPromise, timeoutPromise]);
      
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      setData(result);
      setLastFetched(new Date());
      onSuccess?.(result);
      retryCountRef.current = 0;
    } catch (err) {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      // Don't handle aborted requests
      if (err instanceof Error && err.name === 'AbortError') {
        return;
      }

      const errorMessage = err instanceof Error ? err.message : 'An error occurred';
      
      // Retry logic
      if (retryCountRef.current < retryCount) {
        retryCountRef.current++;
        setTimeout(() => {
          fetchData(true);
        }, retryDelay * retryCountRef.current);
        return;
      }

      setError(errorMessage);
      setData(null);
      onError?.(err instanceof Error ? err : new Error(errorMessage));
    } finally {
      setLoading(false);
      setIsRefetching(false);
    }
  }, [...dependencies, enabled, retryCount, retryDelay, timeout, staleTime]);

  useEffect(() => {
    if (enabled) {
      fetchData();
    }

    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [fetchData]);

  const refetch = useCallback(() => {
    setLastFetched(null); // Force refetch even if stale time hasn't passed
    fetchData();
  }, [fetchData]);

  const isEmpty = !loading && !error && (!data || (Array.isArray(data) && data.length === 0));

  return {
    data,
    loading,
    error,
    isEmpty,
    refetch,
    isRefetching,
    lastFetched,
  };
}

// Hook for paginated data loading
export function usePaginatedDataLoader<T>(
  fetchFn: (page: number, limit: number) => Promise<{ data: T[]; total: number; hasMore: boolean }>,
  dependencies: any[] = [],
  options: DataLoaderOptions & { initialPage?: number; pageSize?: number } = {}
) {
  const { initialPage = 1, pageSize = 10, ...dataLoaderOptions } = options;
  const [page, setPage] = useState(initialPage);
  const [allData, setAllData] = useState<T[]>([]);
  const [hasMore, setHasMore] = useState(true);
  const [total, setTotal] = useState(0);

  const paginatedFetchFn = useCallback(async () => {
    const result = await fetchFn(page, pageSize);
    
    if (page === 1) {
      setAllData(result.data);
    } else {
      setAllData(prev => [...prev, ...result.data]);
    }
    
    setHasMore(result.hasMore);
    setTotal(result.total);
    
    return result;
  }, [fetchFn, page, pageSize]);

  const dataLoader = useDataLoader(paginatedFetchFn, [...dependencies, page], dataLoaderOptions);

  const loadMore = useCallback(() => {
    if (hasMore && !dataLoader.loading) {
      setPage(prev => prev + 1);
    }
  }, [hasMore, dataLoader.loading]);

  const reset = useCallback(() => {
    setPage(initialPage);
    setAllData([]);
    setHasMore(true);
    setTotal(0);
  }, [initialPage]);

  return {
    ...dataLoader,
    data: allData,
    hasMore,
    total,
    page,
    loadMore,
    reset,
    isEmpty: !dataLoader.loading && !dataLoader.error && allData.length === 0,
  };
}