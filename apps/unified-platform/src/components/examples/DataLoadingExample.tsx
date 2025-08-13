'use client';

import React, { useState } from 'react';
import { DataLoader, withDataLoader } from '@/components/ui/data-loader';
import { useDataLoader, usePaginatedDataLoader } from '@/hooks/useDataLoader';
import { useLoadingState, useSequentialLoading } from '@/hooks/useLoadingState';
import { 
  LoadingSpinner, 
  LoadingOverlay, 
  ProgressLoading, 
  StepLoading,
  InlineLoading,
  ButtonLoading,
  LoadingState 
} from '@/components/ui/loading-states';
import {
  SearchErrorBoundary,
  BookingErrorBoundary,
  DashboardErrorBoundary,
  ProviderErrorBoundary,
} from '@/components/error/ErrorBoundaryProvider';
import {
  CardSkeleton,
  ListSkeleton,
  TableSkeleton,
  ServiceCardSkeleton,
  ProviderCardSkeleton,
  BookingCardSkeleton,
  DashboardStatsSkeleton,
  SearchResultsSkeleton,
  ProfileSkeleton,
  FormSkeleton,
} from '@/components/ui/skeleton-loaders';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

// Mock API functions for demonstration
const mockApiCall = (delay: number = 1000, shouldFail: boolean = false) => 
  new Promise((resolve, reject) => {
    setTimeout(() => {
      if (shouldFail) {
        reject(new Error('API call failed'));
      } else {
        resolve({ data: 'Success!', timestamp: new Date().toISOString() });
      }
    }, delay);
  });

const mockPaginatedApiCall = (page: number, limit: number) =>
  new Promise<{ data: any[]; total: number; hasMore: boolean }>((resolve) => {
    setTimeout(() => {
      const total = 50;
      const start = (page - 1) * limit;
      const data = Array.from({ length: Math.min(limit, total - start) }, (_, i) => ({
        id: start + i + 1,
        name: `Item ${start + i + 1}`,
      }));
      resolve({
        data,
        total,
        hasMore: start + limit < total,
      });
    }, 1000);
  });

// Example component using DataLoader wrapper
function BasicDataLoaderExample() {
  const [shouldFail, setShouldFail] = useState(false);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Basic DataLoader Example</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="shouldFail"
              checked={shouldFail}
              onChange={(e) => setShouldFail(e.target.checked)}
            />
            <label htmlFor="shouldFail">Simulate API failure</label>
          </div>
          
          <DataLoader
            fetchFn={() => mockApiCall(2000, shouldFail)}
            dependencies={[shouldFail]}
            loadingComponent={<LoadingSpinner text="Loading data..." />}
            emptyTitle="No data found"
            emptyDescription="Try adjusting your settings"
            section="example"
          >
            {(data: any) => (
              <div className="p-4 bg-green-50 rounded">
                <p>Data loaded successfully!</p>
                <pre className="text-sm mt-2">{JSON.stringify(data, null, 2)}</pre>
              </div>
            )}
          </DataLoader>
        </div>
      </CardContent>
    </Card>
  );
}

// Example component using useDataLoader hook
function HookDataLoaderExample() {
  const { data, loading, error, isEmpty, refetch, isRefetching } = useDataLoader(
    () => mockApiCall(1500),
    [],
    {
      retryCount: 2,
      retryDelay: 1000,
      timeout: 5000,
      onSuccess: (data) => console.log('Data loaded:', data),
      onError: (error) => console.error('Load failed:', error),
    }
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle>useDataLoader Hook Example</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <Button onClick={refetch} disabled={loading || isRefetching}>
            {isRefetching ? 'Refetching...' : 'Refetch Data'}
          </Button>
          
          <LoadingState
            loading={loading}
            error={error}
            success={!!data}
            loadingComponent={<LoadingSpinner text="Loading with hook..." />}
            errorComponent={
              <div className="text-red-600">
                Error: {error}
                <Button onClick={refetch} className="ml-2" size="sm">
                  Retry
                </Button>
              </div>
            }
          >
            {data && (
              <div className="p-4 bg-blue-50 rounded">
                <p>Hook data loaded!</p>
                <pre className="text-sm mt-2">{JSON.stringify(data, null, 2)}</pre>
              </div>
            )}
          </LoadingState>
        </div>
      </CardContent>
    </Card>
  );
}

// Example component using paginated data loader
function PaginatedDataExample() {
  const {
    data,
    loading,
    error,
    hasMore,
    total,
    page,
    loadMore,
    reset,
  } = usePaginatedDataLoader(
    mockPaginatedApiCall,
    [],
    { pageSize: 10 }
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle>Paginated Data Example</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <span>Total items: {total}</span>
            <Button onClick={reset} variant="outline" size="sm">
              Reset
            </Button>
          </div>
          
          {loading && page === 1 ? (
            <ListSkeleton items={5} />
          ) : (
            <div className="space-y-2">
              {data.map((item: any) => (
                <div key={item.id} className="p-2 border rounded">
                  {item.name}
                </div>
              ))}
            </div>
          )}
          
          {error && (
            <div className="text-red-600">Error: {error}</div>
          )}
          
          {hasMore && (
            <Button onClick={loadMore} disabled={loading} className="w-full">
              <ButtonLoading isLoading={loading} loadingText="Loading more...">
                Load More
              </ButtonLoading>
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

// Example component using loading states
function LoadingStatesExample() {
  const loadingState = useLoadingState();
  const [progress, setProgress] = useState(0);
  const [showOverlay, setShowOverlay] = useState(false);

  const simulateOperation = async () => {
    await loadingState.execute(async () => {
      await mockApiCall(2000);
    });
  };

  const simulateProgress = () => {
    setProgress(0);
    const interval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          return 100;
        }
        return prev + 10;
      });
    }, 200);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Loading States Example</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {/* Basic loading spinner */}
          <div>
            <h4 className="font-medium mb-2">Basic Loading Spinner</h4>
            <LoadingSpinner size="lg" text="Processing..." />
          </div>

          {/* Progress loading */}
          <div>
            <h4 className="font-medium mb-2">Progress Loading</h4>
            <ProgressLoading progress={progress} text="Uploading files..." />
            <Button onClick={simulateProgress} className="mt-2" size="sm">
              Simulate Progress
            </Button>
          </div>

          {/* Step loading */}
          <div>
            <h4 className="font-medium mb-2">Step Loading</h4>
            <StepLoading
              currentStep={2}
              totalSteps={4}
              stepLabels={['Validate', 'Process', 'Save', 'Complete']}
            />
          </div>

          {/* Loading overlay */}
          <div>
            <h4 className="font-medium mb-2">Loading Overlay</h4>
            <LoadingOverlay isLoading={showOverlay} text="Saving changes...">
              <div className="p-4 border rounded bg-gray-50">
                <p>This content will be overlaid when loading</p>
                <Button 
                  onClick={() => setShowOverlay(!showOverlay)} 
                  className="mt-2"
                  size="sm"
                >
                  Toggle Overlay
                </Button>
              </div>
            </LoadingOverlay>
          </div>

          {/* Button loading */}
          <div>
            <h4 className="font-medium mb-2">Button Loading</h4>
            <Button onClick={simulateOperation} disabled={loadingState.loading}>
              <ButtonLoading 
                isLoading={loadingState.loading} 
                loadingText="Processing..."
              >
                Execute Operation
              </ButtonLoading>
            </Button>
            {loadingState.error && (
              <p className="text-red-600 text-sm mt-2">{loadingState.error}</p>
            )}
            {loadingState.success && (
              <p className="text-green-600 text-sm mt-2">Operation completed!</p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// Example component using sequential loading
function SequentialLoadingExample() {
  const sequentialLoader = useSequentialLoading();

  const runSequentialOperations = async () => {
    const operations = [
      () => mockApiCall(1000),
      () => mockApiCall(1500),
      () => mockApiCall(800),
      () => mockApiCall(1200),
    ];

    try {
      await sequentialLoader.executeSequential(
        operations,
        (step, result) => console.log(`Step ${step} completed:`, result)
      );
    } catch (error) {
      console.error('Sequential operation failed:', error);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Sequential Loading Example</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <Button 
            onClick={runSequentialOperations} 
            disabled={sequentialLoader.loading}
          >
            Run Sequential Operations
          </Button>
          
          {sequentialLoader.loading && (
            <div className="space-y-4">
              <ProgressLoading 
                progress={sequentialLoader.progress} 
                text={`Step ${sequentialLoader.currentStep} of ${sequentialLoader.totalSteps}`}
              />
              <StepLoading
                currentStep={sequentialLoader.currentStep}
                totalSteps={sequentialLoader.totalSteps}
                stepLabels={['Initialize', 'Process', 'Validate', 'Complete']}
              />
            </div>
          )}
          
          {sequentialLoader.error && (
            <div className="text-red-600">Error: {sequentialLoader.error}</div>
          )}
          
          {sequentialLoader.success && (
            <div className="text-green-600">All operations completed successfully!</div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

// Example component using skeleton loaders
function SkeletonLoadersExample() {
  const [showSkeletons, setShowSkeletons] = useState(true);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Skeleton Loaders Example</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          <Button 
            onClick={() => setShowSkeletons(!showSkeletons)}
            variant="outline"
          >
            {showSkeletons ? 'Show Content' : 'Show Skeletons'}
          </Button>

          {showSkeletons ? (
            <div className="space-y-6">
              <div>
                <h4 className="font-medium mb-2">Service Cards</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <ServiceCardSkeleton />
                  <ServiceCardSkeleton />
                </div>
              </div>

              <div>
                <h4 className="font-medium mb-2">Provider Cards</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <ProviderCardSkeleton />
                  <ProviderCardSkeleton />
                </div>
              </div>

              <div>
                <h4 className="font-medium mb-2">Dashboard Stats</h4>
                <DashboardStatsSkeleton />
              </div>

              <div>
                <h4 className="font-medium mb-2">Profile</h4>
                <ProfileSkeleton />
              </div>
            </div>
          ) : (
            <div className="p-4 bg-gray-50 rounded">
              <p>Real content would be displayed here</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

// Main example component demonstrating all patterns
export default function DataLoadingExample() {
  return (
    <div className="container mx-auto p-6 space-y-8">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold mb-2">Data Loading Patterns Examples</h1>
        <p className="text-gray-600">
          Comprehensive examples of consistent data loading patterns, error boundaries, and skeleton loaders
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <SearchErrorBoundary>
          <BasicDataLoaderExample />
        </SearchErrorBoundary>

        <BookingErrorBoundary>
          <HookDataLoaderExample />
        </BookingErrorBoundary>

        <DashboardErrorBoundary>
          <PaginatedDataExample />
        </DashboardErrorBoundary>

        <ProviderErrorBoundary>
          <LoadingStatesExample />
        </ProviderErrorBoundary>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <SequentialLoadingExample />
        <SkeletonLoadersExample />
      </div>
    </div>
  );
}