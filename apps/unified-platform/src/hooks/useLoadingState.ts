import { useState, useCallback, useEffect } from 'react';

export interface LoadingState {
  loading: boolean;
  error: string | null;
  success: boolean;
}

export interface LoadingActions {
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setSuccess: (success: boolean) => void;
  reset: () => void;
  execute: <T>(asyncFn: () => Promise<T>) => Promise<T | null>;
}

export function useLoadingState(initialState?: Partial<LoadingState>): LoadingState & LoadingActions {
  const [state, setState] = useState<LoadingState>({
    loading: false,
    error: null,
    success: false,
    ...initialState,
  });

  const setLoading = useCallback((loading: boolean) => {
    setState(prev => ({ ...prev, loading, error: loading ? null : prev.error }));
  }, []);

  const setError = useCallback((error: string | null) => {
    setState(prev => ({ ...prev, error, loading: false, success: false }));
  }, []);

  const setSuccess = useCallback((success: boolean) => {
    setState(prev => ({ ...prev, success, error: success ? null : prev.error, loading: false }));
  }, []);

  const reset = useCallback(() => {
    setState({ loading: false, error: null, success: false });
  }, []);

  const execute = useCallback(async <T>(asyncFn: () => Promise<T>): Promise<T | null> => {
    try {
      setLoading(true);
      const result = await asyncFn();
      setSuccess(true);
      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred';
      setError(errorMessage);
      return null;
    }
  }, [setLoading, setError, setSuccess]);

  return {
    ...state,
    setLoading,
    setError,
    setSuccess,
    reset,
    execute,
  };
}

// Hook for managing multiple loading states
export function useMultipleLoadingStates<T extends Record<string, any>>(
  keys: (keyof T)[]
): Record<keyof T, LoadingState & LoadingActions> {
  const states = {} as Record<keyof T, LoadingState & LoadingActions>;
  
  keys.forEach(key => {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    states[key] = useLoadingState();
  });

  return states;
}

// Hook for sequential loading operations
export function useSequentialLoading() {
  const [currentStep, setCurrentStep] = useState(0);
  const [totalSteps, setTotalSteps] = useState(0);
  const loadingState = useLoadingState();

  const executeSequential = useCallback(async <T>(
    operations: (() => Promise<T>)[],
    onStepComplete?: (step: number, result: T) => void
  ): Promise<T[]> => {
    setTotalSteps(operations.length);
    setCurrentStep(0);
    loadingState.setLoading(true);

    const results: T[] = [];

    try {
      for (let i = 0; i < operations.length; i++) {
        setCurrentStep(i + 1);
        const result = await operations[i]();
        results.push(result);
        onStepComplete?.(i + 1, result);
      }
      
      loadingState.setSuccess(true);
      return results;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An error occurred during sequential loading';
      loadingState.setError(errorMessage);
      throw error;
    }
  }, [loadingState]);

  const progress = totalSteps > 0 ? (currentStep / totalSteps) * 100 : 0;

  return {
    ...loadingState,
    currentStep,
    totalSteps,
    progress,
    executeSequential,
  };
}

// Hook for form submission with loading states
export function useFormSubmission<T = any>() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  const submitForm = useCallback(async (
    submitFn: () => Promise<T>,
    options?: {
      onSuccess?: (result: T) => void;
      onError?: (error: string) => void;
      successMessage?: string;
      errorMessage?: string;
    }
  ): Promise<T | null> => {
    try {
      setIsSubmitting(true);
      setSubmitError(null);
      setSubmitSuccess(false);

      const result = await submitFn();
      
      setSubmitSuccess(true);
      options?.onSuccess?.(result);
      
      if (options?.successMessage) {
        // Import toast dynamically to avoid circular dependencies
        const { toast } = await import('sonner');
        toast.success(options.successMessage);
      }
      
      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : (options?.errorMessage || 'An error occurred');
      setSubmitError(errorMessage);
      options?.onError?.(errorMessage);
      
      // Import toast dynamically to avoid circular dependencies
      const { toast } = await import('sonner');
      toast.error(errorMessage);
      
      return null;
    } finally {
      setIsSubmitting(false);
    }
  }, []);

  const resetSubmission = useCallback(() => {
    setIsSubmitting(false);
    setSubmitError(null);
    setSubmitSuccess(false);
  }, []);

  return {
    isSubmitting,
    submitError,
    submitSuccess,
    submitForm,
    resetSubmission,
  };
}

// Hook for data fetching with loading states and retry logic
export function useDataFetching<T>() {
  const [data, setData] = useState<T | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);

  const fetchData = useCallback(async (
    fetchFn: () => Promise<T>,
    options?: {
      maxRetries?: number;
      retryDelay?: number;
      onSuccess?: (data: T) => void;
      onError?: (error: string) => void;
    }
  ): Promise<T | null> => {
    const maxRetries = options?.maxRetries || 3;
    const retryDelay = options?.retryDelay || 1000;

    setIsLoading(true);
    setError(null);

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        const result = await fetchFn();
        setData(result);
        setRetryCount(0);
        options?.onSuccess?.(result);
        return result;
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to fetch data';
        
        if (attempt === maxRetries) {
          setError(errorMessage);
          setRetryCount(attempt + 1);
          options?.onError?.(errorMessage);
          return null;
        }
        
        // Wait before retrying
        if (attempt < maxRetries) {
          await new Promise(resolve => setTimeout(resolve, retryDelay * (attempt + 1)));
        }
      }
    }
    
    return null;
  }, []);

  const retry = useCallback(() => {
    setRetryCount(0);
    setError(null);
  }, []);

  const reset = useCallback(() => {
    setData(null);
    setIsLoading(false);
    setError(null);
    setRetryCount(0);
  }, []);

  useEffect(() => {
    return () => {
      setIsLoading(false);
    };
  }, []);

  return {
    data,
    isLoading: isLoading,
    error,
    retryCount,
    fetchData,
    retry,
    reset,
    setIsLoading,
  };
}