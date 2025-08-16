import { useState, useCallback } from 'react';
import { toast } from 'sonner';

export interface FeedbackOptions {
  successMessage?: string;
  errorMessage?: string;
  loadingMessage?: string;
  duration?: number;
  showToast?: boolean;
}

export interface UserFeedbackState {
  isLoading: boolean;
  error: string | null;
  success: boolean;
  message: string | null;
}

export function useUserFeedback() {
  const [state, setState] = useState<UserFeedbackState>({
    isLoading: false,
    error: null,
    success: false,
    message: null,
  });

  const showSuccess = useCallback((message: string, duration?: number) => {
    setState({
      isLoading: false,
      error: null,
      success: true,
      message,
    });
    toast.success(message, { duration: duration || 4000 });
  }, []);

  const showError = useCallback((message: string, duration?: number) => {
    setState({
      isLoading: false,
      error: message,
      success: false,
      message,
    });
    toast.error(message, { duration: duration || 5000 });
  }, []);

  const showLoading = useCallback((message?: string) => {
    setState({
      isLoading: true,
      error: null,
      success: false,
      message: message || 'Loading...',
    });
  }, []);

  const showInfo = useCallback((message: string, duration?: number) => {
    setState({
      isLoading: false,
      error: null,
      success: false,
      message,
    });
    toast.info(message, { duration: duration || 3000 });
  }, []);

  const showWarning = useCallback((message: string, duration?: number) => {
    setState({
      isLoading: false,
      error: null,
      success: false,
      message,
    });
    toast.warning(message, { duration: duration || 4000 });
  }, []);

  const clear = useCallback(() => {
    setState({
      isLoading: false,
      error: null,
      success: false,
      message: null,
    });
  }, []);

  const executeWithFeedback = useCallback(async <T>(
    asyncFn: () => Promise<T>,
    options: FeedbackOptions = {}
  ): Promise<T | null> => {
    try {
      if (options.loadingMessage) {
        showLoading(options.loadingMessage);
      } else {
        setState(prev => ({ ...prev, isLoading: true, error: null }));
      }

      const result = await asyncFn();

      if (options.successMessage) {
        showSuccess(options.successMessage, options.duration);
      } else {
        setState(prev => ({ ...prev, isLoading: false, success: true }));
      }

      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : (options.errorMessage || 'An error occurred');
      showError(errorMessage, options.duration);
      return null;
    }
  }, [showLoading, showSuccess, showError]);

  return {
    ...state,
    showSuccess,
    showError,
    showLoading,
    showInfo,
    showWarning,
    clear,
    executeWithFeedback,
  };
}

// Hook for managing multiple feedback states (e.g., different forms on the same page)
export function useMultipleFeedback<T extends Record<string, any>>(
  keys: (keyof T)[]
): Record<keyof T, ReturnType<typeof useUserFeedback>> {
  const feedbacks = {} as Record<keyof T, ReturnType<typeof useUserFeedback>>;
  
  keys.forEach(key => {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    feedbacks[key] = useUserFeedback();
  });

  return feedbacks;
}

// Hook for action confirmation with feedback
export function useActionConfirmation() {
  const feedback = useUserFeedback();
  const [isConfirming, setIsConfirming] = useState(false);

  const confirmAction = useCallback(async <T>(
    action: () => Promise<T>,
    options: {
      confirmMessage: string;
      successMessage?: string;
      errorMessage?: string;
      loadingMessage?: string;
    }
  ): Promise<T | null> => {
    const confirmed = window.confirm(options.confirmMessage);
    
    if (!confirmed) {
      return null;
    }

    setIsConfirming(true);
    
    try {
      const result = await feedback.executeWithFeedback(action, {
        successMessage: options.successMessage,
        errorMessage: options.errorMessage,
        loadingMessage: options.loadingMessage,
      });
      
      return result;
    } finally {
      setIsConfirming(false);
    }
  }, [feedback]);

  return {
    ...feedback,
    isConfirming,
    confirmAction,
  };
}