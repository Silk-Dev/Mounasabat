import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { toast } from 'sonner';
import {
  LoadingSpinner,
  LoadingState,
  LoadingButton,
  FormLoadingOverlay,
  TableLoadingSkeleton,
  CardLoadingSkeleton,
  ProgressIndicator,
} from '@/components/ui/loading';
import { useFormSubmission, useDataFetching } from '@/hooks/useLoadingState';
import { useUserFeedback } from '@/hooks/useUserFeedback';

// Mock sonner toast
jest.mock('sonner', () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
    info: jest.fn(),
    warning: jest.fn(),
  },
}));

describe('Loading Components', () => {
  describe('LoadingSpinner', () => {
    it('renders with default props', () => {
      render(<LoadingSpinner />);
      expect(screen.getByTestId('loading-spinner')).toBeInTheDocument();
    });

    it('renders with different sizes', () => {
      const { rerender } = render(<LoadingSpinner size="sm" />);
      expect(screen.getByTestId('loading-spinner')).toHaveClass('w-4', 'h-4');

      rerender(<LoadingSpinner size="lg" />);
      expect(screen.getByTestId('loading-spinner')).toHaveClass('w-8', 'h-8');
    });
  });

  describe('LoadingButton', () => {
    it('shows loading state when loading prop is true', () => {
      render(
        <LoadingButton loading={true} loadingText="Processing...">
          Submit
        </LoadingButton>
      );
      
      expect(screen.getByText('Processing...')).toBeInTheDocument();
      expect(screen.getByRole('button')).toBeDisabled();
    });

    it('shows normal state when loading prop is false', () => {
      render(
        <LoadingButton loading={false}>
          Submit
        </LoadingButton>
      );
      
      expect(screen.getByText('Submit')).toBeInTheDocument();
      expect(screen.getByRole('button')).not.toBeDisabled();
    });

    it('handles click events when not loading', () => {
      const handleClick = jest.fn();
      render(
        <LoadingButton loading={false} onClick={handleClick}>
          Submit
        </LoadingButton>
      );
      
      fireEvent.click(screen.getByRole('button'));
      expect(handleClick).toHaveBeenCalledTimes(1);
    });

    it('does not handle click events when loading', () => {
      const handleClick = jest.fn();
      render(
        <LoadingButton loading={true} onClick={handleClick}>
          Submit
        </LoadingButton>
      );
      
      fireEvent.click(screen.getByRole('button'));
      expect(handleClick).not.toHaveBeenCalled();
    });
  });

  describe('FormLoadingOverlay', () => {
    it('shows overlay when loading', () => {
      render(
        <FormLoadingOverlay isLoading={true} message="Saving...">
          <form>
            <input type="text" placeholder="Test input" />
          </form>
        </FormLoadingOverlay>
      );
      
      expect(screen.getByText('Saving...')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('Test input')).toBeInTheDocument();
    });

    it('hides overlay when not loading', () => {
      render(
        <FormLoadingOverlay isLoading={false} message="Saving...">
          <form>
            <input type="text" placeholder="Test input" />
          </form>
        </FormLoadingOverlay>
      );
      
      expect(screen.queryByText('Saving...')).not.toBeInTheDocument();
      expect(screen.getByPlaceholderText('Test input')).toBeInTheDocument();
    });
  });

  describe('LoadingState', () => {
    it('renders different loading states based on type', () => {
      const { rerender } = render(<LoadingState type="search" />);
      expect(screen.getByText('Searching for services...')).toBeInTheDocument();

      rerender(<LoadingState type="booking" />);
      expect(screen.getByText('Processing your booking...')).toBeInTheDocument();

      rerender(<LoadingState type="dashboard" />);
      expect(screen.getByText('Loading dashboard...')).toBeInTheDocument();
    });

    it('renders custom message when provided', () => {
      render(<LoadingState message="Custom loading message" />);
      expect(screen.getByText('Custom loading message')).toBeInTheDocument();
    });
  });

  describe('TableLoadingSkeleton', () => {
    it('renders skeleton with default rows and columns', () => {
      render(<TableLoadingSkeleton />);
      // Should render skeleton elements
      const skeletonElements = screen.getAllByTestId('skeleton-element');
      expect(skeletonElements.length).toBeGreaterThan(0);
    });

    it('renders skeleton with custom rows and columns', () => {
      render(<TableLoadingSkeleton rows={3} columns={2} />);
      const skeletonElements = screen.getAllByTestId('skeleton-element');
      expect(skeletonElements.length).toBeGreaterThan(0);
    });
  });

  describe('CardLoadingSkeleton', () => {
    it('renders skeleton cards', () => {
      render(<CardLoadingSkeleton count={2} />);
      const skeletonElements = screen.getAllByTestId('skeleton-element');
      expect(skeletonElements.length).toBeGreaterThan(0);
    });
  });

  describe('ProgressIndicator', () => {
    it('shows progress correctly', () => {
      render(
        <ProgressIndicator
          currentStep={2}
          totalSteps={4}
          stepLabels={['Step 1', 'Step 2', 'Step 3', 'Step 4']}
        />
      );
      
      expect(screen.getByText('Step 2 of 4')).toBeInTheDocument();
      expect(screen.getByText('Step 1')).toBeInTheDocument();
      expect(screen.getByText('Step 2')).toBeInTheDocument();
    });

    it('calculates progress percentage correctly', () => {
      render(<ProgressIndicator currentStep={1} totalSteps={4} />);
      
      const progressBar = screen.getByTestId('progress-bar');
      expect(progressBar).toHaveStyle('width: 25%');
    });
  });
});

describe('Loading Hooks', () => {
  describe('useUserFeedback', () => {
    function TestComponent() {
      const feedback = useUserFeedback();
      
      return (
        <div>
          <div data-testid="loading">{feedback.isLoading.toString()}</div>
          <div data-testid="error">{feedback.error || 'no error'}</div>
          <div data-testid="success">{feedback.success.toString()}</div>
          <button onClick={() => feedback.showSuccess('Success!')}>Show Success</button>
          <button onClick={() => feedback.showError('Error!')}>Show Error</button>
          <button onClick={() => feedback.showLoading('Loading...')}>Show Loading</button>
          <button onClick={() => feedback.clear()}>Clear</button>
        </div>
      );
    }

    it('manages feedback states correctly', () => {
      render(<TestComponent />);
      
      // Initial state
      expect(screen.getByTestId('loading')).toHaveTextContent('false');
      expect(screen.getByTestId('error')).toHaveTextContent('no error');
      expect(screen.getByTestId('success')).toHaveTextContent('false');

      // Show success
      fireEvent.click(screen.getByText('Show Success'));
      expect(screen.getByTestId('success')).toHaveTextContent('true');
      expect(toast.success).toHaveBeenCalledWith('Success!', { duration: 4000 });

      // Show error
      fireEvent.click(screen.getByText('Show Error'));
      expect(screen.getByTestId('error')).toHaveTextContent('Error!');
      expect(toast.error).toHaveBeenCalledWith('Error!', { duration: 5000 });

      // Show loading
      fireEvent.click(screen.getByText('Show Loading'));
      expect(screen.getByTestId('loading')).toHaveTextContent('true');

      // Clear
      fireEvent.click(screen.getByText('Clear'));
      expect(screen.getByTestId('loading')).toHaveTextContent('false');
      expect(screen.getByTestId('error')).toHaveTextContent('no error');
      expect(screen.getByTestId('success')).toHaveTextContent('false');
    });
  });

  describe('useFormSubmission', () => {
    function TestFormComponent() {
      const { isSubmitting, submitError, submitSuccess, submitForm } = useFormSubmission();
      
      const handleSubmit = () => {
        submitForm(
          () => new Promise(resolve => setTimeout(() => resolve('success'), 100)),
          {
            successMessage: 'Form submitted successfully!',
            errorMessage: 'Failed to submit form',
          }
        );
      };

      const handleSubmitError = () => {
        submitForm(
          () => Promise.reject(new Error('Submission failed')),
          {
            successMessage: 'Form submitted successfully!',
            errorMessage: 'Failed to submit form',
          }
        );
      };
      
      return (
        <div>
          <div data-testid="submitting">{isSubmitting.toString()}</div>
          <div data-testid="submit-error">{submitError || 'no error'}</div>
          <div data-testid="submit-success">{submitSuccess.toString()}</div>
          <button onClick={handleSubmit}>Submit Success</button>
          <button onClick={handleSubmitError}>Submit Error</button>
        </div>
      );
    }

    it('manages form submission states correctly', async () => {
      render(<TestFormComponent />);
      
      // Initial state
      expect(screen.getByTestId('submitting')).toHaveTextContent('false');
      expect(screen.getByTestId('submit-error')).toHaveTextContent('no error');
      expect(screen.getByTestId('submit-success')).toHaveTextContent('false');

      // Submit success
      fireEvent.click(screen.getByText('Submit Success'));
      expect(screen.getByTestId('submitting')).toHaveTextContent('true');

      await waitFor(() => {
        expect(screen.getByTestId('submitting')).toHaveTextContent('false');
        expect(screen.getByTestId('submit-success')).toHaveTextContent('true');
      });

      expect(toast.success).toHaveBeenCalledWith('Form submitted successfully!');
    });

    it('handles form submission errors correctly', async () => {
      render(<TestFormComponent />);
      
      // Submit error
      fireEvent.click(screen.getByText('Submit Error'));
      expect(screen.getByTestId('submitting')).toHaveTextContent('true');

      await waitFor(() => {
        expect(screen.getByTestId('submitting')).toHaveTextContent('false');
        expect(screen.getByTestId('submit-error')).toHaveTextContent('Submission failed');
      });

      expect(toast.error).toHaveBeenCalledWith('Submission failed');
    });
  });

  describe('useDataFetching', () => {
    function TestDataComponent() {
      const { data, isLoading, error, fetchData, retry } = useDataFetching<string>();
      
      const handleFetch = () => {
        fetchData(
          () => new Promise(resolve => setTimeout(() => resolve('fetched data'), 100)),
          {
            onSuccess: (data) => console.log('Data fetched:', data),
            onError: (error) => console.log('Fetch error:', error),
          }
        );
      };

      const handleFetchError = () => {
        fetchData(
          () => Promise.reject(new Error('Fetch failed')),
          {
            maxRetries: 1,
            onError: (error) => console.log('Fetch error:', error),
          }
        );
      };
      
      return (
        <div>
          <div data-testid="data">{data || 'no data'}</div>
          <div data-testid="loading">{isLoading.toString()}</div>
          <div data-testid="error">{error || 'no error'}</div>
          <button onClick={handleFetch}>Fetch Success</button>
          <button onClick={handleFetchError}>Fetch Error</button>
          <button onClick={retry}>Retry</button>
        </div>
      );
    }

    it('manages data fetching states correctly', async () => {
      render(<TestDataComponent />);
      
      // Initial state
      expect(screen.getByTestId('data')).toHaveTextContent('no data');
      expect(screen.getByTestId('loading')).toHaveTextContent('false');
      expect(screen.getByTestId('error')).toHaveTextContent('no error');

      // Fetch success
      fireEvent.click(screen.getByText('Fetch Success'));
      expect(screen.getByTestId('loading')).toHaveTextContent('true');

      await waitFor(() => {
        expect(screen.getByTestId('loading')).toHaveTextContent('false');
        expect(screen.getByTestId('data')).toHaveTextContent('fetched data');
      });
    });

    it('handles data fetching errors correctly', async () => {
      render(<TestDataComponent />);
      
      // Fetch error
      fireEvent.click(screen.getByText('Fetch Error'));
      expect(screen.getByTestId('loading')).toHaveTextContent('true');

      await waitFor(() => {
        expect(screen.getByTestId('loading')).toHaveTextContent('false');
        expect(screen.getByTestId('error')).toHaveTextContent('Fetch failed');
      });
    });
  });
});