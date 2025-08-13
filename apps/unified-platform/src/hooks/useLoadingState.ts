import { useState, useCallback } from 'react';

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