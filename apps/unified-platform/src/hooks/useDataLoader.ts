import { useState, useEffect, useCallback } from 'react';

export interface DataLoadingState<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
  isEmpty: boolean;
  refetch: () => void;
}

export function useDataLoader<T>(
  fetchFn: () => Promise<T>,
  dependencies: any[] = []
): DataLoadingState<T> {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await fetchFn();
      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      setData(null);
    } finally {
      setLoading(false);
    }
  }, dependencies);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const isEmpty = !loading && !error && (!data || (Array.isArray(data) && data.length === 0));

  return {
    data,
    loading,
    error,
    isEmpty,
    refetch: fetchData,
  };
}