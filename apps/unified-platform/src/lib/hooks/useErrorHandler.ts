import { useState, useCallback } from 'react';
import { errorLogger } from '@/lib/error-logger';
import { apiClient, APIError } from '@/lib/api-client';

interface ErrorState {
  error: Error | null;
  isLoading: boolean;
  retryCount: number;
}

interface UseErrorHandlerOptions {
  maxRetries?: number;
  onError?: (error: Error) => void;
  onRetry?: (retryCount: number) => void;
  onSuccess?: () => void;
  section?: string;
}

export function useErrorHandler(options: UseErrorHandlerOptions = {}) {
  const {
    maxRetries = 3,
    onError,
    onRetry,
    onSuccess,
    section,
  } = options;

  const [state, setState] = useState<ErrorState>({
    error: null,
    isLoading: false,
    retryCount: 0,
  });

  const handleError = useCallback((error: Error) => {
    setState(prev => ({ ...prev, error, isLoading: false }));
    
    // Log error
    errorLogger.logError(error, 'error', { section });
    
    // Call custom error handler
    if (onError) {
      onError(error);
    }
  }, [onError, section]);

  const retry = useCallback(() => {
    if (state.retryCount >= maxRetries) {
      return;
    }

    setState(prev => ({
      ...prev,
      retryCount: prev.retryCount + 1,
      error: null,
      isLoading: true,
    }));

    if (onRetry) {
      onRetry(state.retryCount + 1);
    }
  }, [state.retryCount, maxRetries, onRetry]);

  const reset = useCallback(() => {
    setState({
      error: null,
      isLoading: false,
      retryCount: 0,
    });
  }, []);

  const execute = useCallback(async <T>(
    asyncFunction: () => Promise<T>
  ): Promise<T | null> => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      const result = await asyncFunction();
      setState(prev => ({ ...prev, isLoading: false }));
      
      if (onSuccess) {
        onSuccess();
      }
      
      return result;
    } catch (error) {
      handleError(error instanceof Error ? error : new Error(String(error)));
      return null;
    }
  }, [handleError, onSuccess]);

  const executeWithRetry = useCallback(async <T>(
    asyncFunction: () => Promise<T>
  ): Promise<T | null> => {
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        setState(prev => ({ 
          ...prev, 
          isLoading: true, 
          error: null,
          retryCount: attempt,
        }));

        const result = await asyncFunction();
        
        setState(prev => ({ ...prev, isLoading: false }));
        
        if (onSuccess) {
          onSuccess();
        }
        
        return result;
      } catch (error) {
        const isLastAttempt = attempt === maxRetries;
        
        if (isLastAttempt) {
          handleError(error instanceof Error ? error : new Error(String(error)));
          return null;
        } else {
          // Wait before retrying
          const delay = Math.min(1000 * Math.pow(2, attempt), 10000);
          await new Promise(resolve => setTimeout(resolve, delay));
          
          if (onRetry) {
            onRetry(attempt + 1);
          }
        }
      }
    }

    return null;
  }, [maxRetries, handleError, onRetry, onSuccess]);

  return {
    error: state.error,
    isLoading: state.isLoading,
    retryCount: state.retryCount,
    canRetry: state.retryCount < maxRetries,
    handleError,
    retry,
    reset,
    execute,
    executeWithRetry,
  };
}

// Specialized hooks for different types of operations
export function useSearchErrorHandler() {
  return useErrorHandler({
    maxRetries: 2,
    section: 'search',
    onError: (error) => {
      // Clear search cache on error
      localStorage.removeItem('searchCache');
    },
  });
}

export function useBookingErrorHandler() {
  return useErrorHandler({
    maxRetries: 5,
    section: 'booking',
    onError: (error) => {
      // Save booking progress on error
      const bookingProgress = sessionStorage.getItem('bookingProgress');
      if (bookingProgress) {
        localStorage.setItem('savedBooking', bookingProgress);
        localStorage.setItem('savedBookingTimestamp', Date.now().toString());
      }
    },
  });
}

export function usePaymentErrorHandler() {
  return useErrorHandler({
    maxRetries: 3,
    section: 'payment',
    onError: (error) => {
      // Log payment errors with high priority
      errorLogger.logError(error, 'error', {
        section: 'payment',
        additionalData: {
          priority: 'high',
          requiresImmedateAttention: true,
        },
      });
    },
  });
}

export function useDashboardErrorHandler() {
  return useErrorHandler({
    maxRetries: 2,
    section: 'dashboard',
    onError: (error) => {
      // Clear dashboard cache on error
      localStorage.removeItem('dashboardCache');
      sessionStorage.removeItem('dashboardFilters');
    },
  });
}

// Hook for API requests with built-in error handling
export function useApiRequest<T = any>() {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<APIError | null>(null);

  const request = useCallback(async (
    url: string,
    options?: RequestInit,
    retryConfig?: any
  ) => {
    setLoading(true);
    setError(null);

    try {
      const result = await apiClient.request<T>(url, options, retryConfig);
      setData(result);
      return result;
    } catch (err) {
      const apiError = err as APIError;
      setError(apiError);
      
      // Log API error
      errorLogger.logAPIError(
        url,
        options?.method || 'GET',
        apiError.status || 0,
        apiError.details
      );
      
      throw apiError;
    } finally {
      setLoading(false);
    }
  }, []);

  const get = useCallback((url: string, retryConfig?: any) => {
    return request(url, { method: 'GET' }, retryConfig);
  }, [request]);

  const post = useCallback((url: string, data?: any, retryConfig?: any) => {
    return request(url, {
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    }, retryConfig);
  }, [request]);

  const put = useCallback((url: string, data?: any, retryConfig?: any) => {
    return request(url, {
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
    }, retryConfig);
  }, [request]);

  const del = useCallback((url: string, retryConfig?: any) => {
    return request(url, { method: 'DELETE' }, retryConfig);
  }, [request]);

  const reset = useCallback(() => {
    setData(null);
    setError(null);
    setLoading(false);
  }, []);

  return {
    data,
    loading,
    error,
    request,
    get,
    post,
    put,
    delete: del,
    reset,
  };
}
