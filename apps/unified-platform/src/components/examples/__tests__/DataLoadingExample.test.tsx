import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { useDataLoader, usePaginatedDataLoader } from '@/hooks/useDataLoader';
import { useLoadingState, useSequentialLoading } from '@/hooks/useLoadingState';
import { DataLoader } from '@/components/ui/data-loader';
import { LoadingSpinner, LoadingOverlay, ProgressLoading } from '@/components/ui/loading-states';
import ErrorBoundary from '@/components/error/ErrorBoundary';

// Mock API functions
const mockSuccessfulApi = () => Promise.resolve({ data: 'success' });
const mockFailingApi = () => Promise.reject(new Error('API Error'));
const mockDelayedApi = (delay: number = 1000) => 
  new Promise(resolve => setTimeout(() => resolve({ data: 'delayed success' }), delay));

// Test useDataLoader hook
describe('useDataLoader', () => {
  function TestComponent({ fetchFn, dependencies = [] }: any) {
    const { data, loading, error, isEmpty, refetch } = useDataLoader(fetchFn, dependencies);
    
    return (
      <div>
        {loading && <div data-testid="loading">Loading...</div>}
        {error && <div data-testid="error">{error}</div>}
        {isEmpty && <div data-testid="empty">No data</div>}
        {data && <div data-testid="data">{JSON.stringify(data)}</div>}
        <button onClick={refetch} data-testid="refetch">Refetch</button>
      </div>
    );
  }

  it('should handle successful data loading', async () => {
    render(<TestComponent fetchFn={mockSuccessfulApi} />);
    
    expect(screen.getByTestId('loading')).toBeInTheDocument();
    
    await waitFor(() => {
      expect(screen.getByTestId('data')).toBeInTheDocument();
    });
    
    expect(screen.queryByTestId('loading')).not.toBeInTheDocument();
    expect(screen.queryByTestId('error')).not.toBeInTheDocument();
  });

  it('should handle API errors', async () => {
    render(<TestComponent fetchFn={mockFailingApi} />);
    
    expect(screen.getByTestId('loading')).toBeInTheDocument();
    
    await waitFor(() => {
      expect(screen.getByTestId('error')).toBeInTheDocument();
    });
    
    expect(screen.getByTestId('error')).toHaveTextContent('API Error');
    expect(screen.queryByTestId('loading')).not.toBeInTheDocument();
    expect(screen.queryByTestId('data')).not.toBeInTheDocument();
  });

  it('should handle empty data', async () => {
    const emptyApi = () => Promise.resolve([]);
    render(<TestComponent fetchFn={emptyApi} />);
    
    await waitFor(() => {
      expect(screen.getByTestId('empty')).toBeInTheDocument();
    });
  });

  it('should allow refetching data', async () => {
    let callCount = 0;
    const countingApi = () => {
      callCount++;
      return Promise.resolve({ data: `call ${callCount}` });
    };
    
    render(<TestComponent fetchFn={countingApi} />);
    
    await waitFor(() => {
      expect(screen.getByTestId('data')).toHaveTextContent('call 1');
    });
    
    fireEvent.click(screen.getByTestId('refetch'));
    
    await waitFor(() => {
      expect(screen.getByTestId('data')).toHaveTextContent('call 2');
    });
  });
});

// Test usePaginatedDataLoader hook
describe('usePaginatedDataLoader', () => {
  function PaginatedTestComponent() {
    const mockPaginatedApi = (page: number, limit: number) =>
      Promise.resolve({
        data: Array.from({ length: limit }, (_, i) => ({ id: (page - 1) * limit + i + 1 })),
        total: 50,
        hasMore: page * limit < 50,
      });

    const { data, loading, hasMore, loadMore, total } = usePaginatedDataLoader(
      mockPaginatedApi,
      [],
      { pageSize: 10 }
    );

    return (
      <div>
        {loading && <div data-testid="loading">Loading...</div>}
        <div data-testid="total">Total: {total}</div>
        <div data-testid="items">{data.length} items</div>
        {hasMore && (
          <button onClick={loadMore} data-testid="load-more">
            Load More
          </button>
        )}
      </div>
    );
  }

  it('should load paginated data', async () => {
    render(<PaginatedTestComponent />);
    
    await waitFor(() => {
      expect(screen.getByTestId('items')).toHaveTextContent('10 items');
      expect(screen.getByTestId('total')).toHaveTextContent('Total: 50');
    });
    
    expect(screen.getByTestId('load-more')).toBeInTheDocument();
  });

  it('should load more data when requested', async () => {
    render(<PaginatedTestComponent />);
    
    await waitFor(() => {
      expect(screen.getByTestId('items')).toHaveTextContent('10 items');
    });
    
    fireEvent.click(screen.getByTestId('load-more'));
    
    await waitFor(() => {
      expect(screen.getByTestId('items')).toHaveTextContent('20 items');
    });
  });
});

// Test useLoadingState hook
describe('useLoadingState', () => {
  function LoadingStateTestComponent() {
    const { loading, error, success, execute, reset } = useLoadingState();

    const handleSuccess = () => execute(() => mockSuccessfulApi());
    const handleError = () => execute(() => mockFailingApi());

    return (
      <div>
        {loading && <div data-testid="loading">Loading...</div>}
        {error && <div data-testid="error">{error}</div>}
        {success && <div data-testid="success">Success!</div>}
        <button onClick={handleSuccess} data-testid="success-btn">Success</button>
        <button onClick={handleError} data-testid="error-btn">Error</button>
        <button onClick={reset} data-testid="reset-btn">Reset</button>
      </div>
    );
  }

  it('should handle successful operations', async () => {
    render(<LoadingStateTestComponent />);
    
    fireEvent.click(screen.getByTestId('success-btn'));
    
    expect(screen.getByTestId('loading')).toBeInTheDocument();
    
    await waitFor(() => {
      expect(screen.getByTestId('success')).toBeInTheDocument();
    });
    
    expect(screen.queryByTestId('loading')).not.toBeInTheDocument();
  });

  it('should handle failed operations', async () => {
    render(<LoadingStateTestComponent />);
    
    fireEvent.click(screen.getByTestId('error-btn'));
    
    await waitFor(() => {
      expect(screen.getByTestId('error')).toBeInTheDocument();
    });
    
    expect(screen.getByTestId('error')).toHaveTextContent('API Error');
  });

  it('should reset state', async () => {
    render(<LoadingStateTestComponent />);
    
    fireEvent.click(screen.getByTestId('success-btn'));
    
    await waitFor(() => {
      expect(screen.getByTestId('success')).toBeInTheDocument();
    });
    
    fireEvent.click(screen.getByTestId('reset-btn'));
    
    expect(screen.queryByTestId('success')).not.toBeInTheDocument();
    expect(screen.queryByTestId('error')).not.toBeInTheDocument();
    expect(screen.queryByTestId('loading')).not.toBeInTheDocument();
  });
});

// Test DataLoader component
describe('DataLoader', () => {
  it('should render loading state initially', () => {
    render(
      <DataLoader fetchFn={mockDelayedApi}>
        {(data) => <div data-testid="content">{JSON.stringify(data)}</div>}
      </DataLoader>
    );
    
    // Check for loading spinner by looking for the spinner element
    expect(document.querySelector('.animate-spin')).toBeInTheDocument();
  });

  it('should render data when loaded', async () => {
    render(
      <DataLoader fetchFn={mockSuccessfulApi}>
        {(data) => <div data-testid="content">{JSON.stringify(data)}</div>}
      </DataLoader>
    );
    
    await waitFor(() => {
      expect(screen.getByTestId('content')).toBeInTheDocument();
    });
  });

  it('should render error state on failure', async () => {
    render(
      <DataLoader fetchFn={mockFailingApi}>
        {(data) => <div data-testid="content">{JSON.stringify(data)}</div>}
      </DataLoader>
    );
    
    await waitFor(() => {
      expect(screen.getByText(/API Error/)).toBeInTheDocument();
    });
  });

  it('should render empty state for empty data', async () => {
    const emptyApi = () => Promise.resolve([]);
    
    render(
      <DataLoader 
        fetchFn={emptyApi}
        emptyTitle="No items found"
        emptyDescription="Try a different search"
      >
        {(data) => <div data-testid="content">{JSON.stringify(data)}</div>}
      </DataLoader>
    );
    
    await waitFor(() => {
      expect(screen.getByText('No items found')).toBeInTheDocument();
      expect(screen.getByText('Try a different search')).toBeInTheDocument();
    });
  });
});

// Test Loading Components
describe('Loading Components', () => {
  it('should render LoadingSpinner with text', () => {
    render(<LoadingSpinner text="Loading data..." />);
    expect(screen.getByText('Loading data...')).toBeInTheDocument();
  });

  it('should render LoadingOverlay', () => {
    render(
      <LoadingOverlay isLoading={true} text="Saving...">
        <div data-testid="content">Content</div>
      </LoadingOverlay>
    );
    
    expect(screen.getByTestId('content')).toBeInTheDocument();
    expect(screen.getByText('Saving...')).toBeInTheDocument();
  });

  it('should render ProgressLoading', () => {
    render(<ProgressLoading progress={50} text="Uploading..." />);
    
    expect(screen.getByText('Uploading...')).toBeInTheDocument();
    expect(screen.getByText('50%')).toBeInTheDocument();
  });
});

// Test Error Boundary
describe('ErrorBoundary', () => {
  const ThrowError = ({ shouldThrow }: { shouldThrow: boolean }) => {
    if (shouldThrow) {
      throw new Error('Test error');
    }
    return <div data-testid="no-error">No error</div>;
  };

  it('should catch and display errors', () => {
    // Suppress console.error for this test
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    
    render(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );
    
    expect(screen.getByText('Something went wrong')).toBeInTheDocument();
    expect(screen.getByText('Try Again')).toBeInTheDocument();
    
    consoleSpy.mockRestore();
  });

  it('should render children when no error', () => {
    render(
      <ErrorBoundary>
        <ThrowError shouldThrow={false} />
      </ErrorBoundary>
    );
    
    expect(screen.getByTestId('no-error')).toBeInTheDocument();
  });

  it('should show retry button after error', () => {
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    
    render(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );
    
    expect(screen.getByText('Something went wrong')).toBeInTheDocument();
    expect(screen.getByText('Try Again')).toBeInTheDocument();
    
    consoleSpy.mockRestore();
  });
});

// Integration test
describe('Data Loading Integration', () => {
  function IntegrationTestComponent() {
    const [shouldFail, setShouldFail] = React.useState(false);
    const fetchFn = shouldFail ? mockFailingApi : mockSuccessfulApi;

    return (
      <div>
        <button 
          onClick={() => setShouldFail(!shouldFail)} 
          data-testid="toggle-error"
        >
          Toggle Error
        </button>
        <ErrorBoundary section="test">
          <DataLoader
            fetchFn={fetchFn}
            dependencies={[shouldFail]}
            loadingComponent={<div data-testid="custom-loading">Custom Loading...</div>}
            emptyTitle="No data"
            section="integration-test"
          >
            {(data) => <div data-testid="success-data">{JSON.stringify(data)}</div>}
          </DataLoader>
        </ErrorBoundary>
      </div>
    );
  }

  it('should handle the complete data loading flow', async () => {
    render(<IntegrationTestComponent />);
    
    // Should show loading initially
    expect(screen.getByTestId('custom-loading')).toBeInTheDocument();
    
    // Should show data after loading
    await waitFor(() => {
      expect(screen.getByTestId('success-data')).toBeInTheDocument();
    });
    
    // Toggle to error state
    fireEvent.click(screen.getByTestId('toggle-error'));
    
    // Should show loading again
    expect(screen.getByTestId('custom-loading')).toBeInTheDocument();
    
    // Should show error after failed load
    await waitFor(() => {
      expect(screen.getByText(/API Error/)).toBeInTheDocument();
    });
  });
});