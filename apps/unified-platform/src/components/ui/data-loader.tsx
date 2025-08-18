'use client';

import React from 'react';
import { useDataLoader, DataLoadingState } from '@/hooks/useDataLoader';
import ErrorBoundary from '@/components/error/ErrorBoundary';
import { EmptyState } from './empty-state';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { Button } from './button';

interface DataLoaderProps<T> {
  fetchFn: () => Promise<T>;
  dependencies?: any[];
  children: (data: T) => React.ReactNode;
  loadingComponent?: React.ReactNode;
  errorComponent?: (error: string, retry: () => void) => React.ReactNode;
  emptyComponent?: React.ReactNode;
  emptyTitle?: string;
  emptyDescription?: string;
  emptyAction?: {
    label: string;
    onClick: () => void;
  };
  className?: string;
  section?: string;
}

export function DataLoader<T>({
  fetchFn,
  dependencies = [],
  children,
  loadingComponent,
  errorComponent,
  emptyComponent,
  emptyTitle = 'No data available',
  emptyDescription = 'There is no data to display at the moment.',
  emptyAction,
  className = '',
  section,
}: DataLoaderProps<T>) {
  const { data, loading, error, isEmpty, refetch } = useDataLoader(fetchFn, dependencies);

  if (loading) {
    return (
      <div className={className}>
        {loadingComponent || <DefaultLoadingComponent />}
      </div>
    );
  }

  if (error) {
    return (
      <div className={className}>
        {errorComponent ? (
          errorComponent(error, refetch)
        ) : (
          <DefaultErrorComponent error={error} retry={refetch} section={section} />
        )}
      </div>
    );
  }

  if (isEmpty) {
    return (
      <div className={className}>
        {emptyComponent || (
          <EmptyState
            title={emptyTitle}
            description={emptyDescription}
            action={emptyAction}
          />
        )}
      </div>
    );
  }

  return (
    <ErrorBoundary section={section}>
      <div className={className}>
        {children(data!)}
      </div>
    </ErrorBoundary>
  );
}

function DefaultLoadingComponent() {
  return (
    <div className="flex items-center justify-center p-8">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
    </div>
  );
}

function DefaultErrorComponent({ 
  error, 
  retry, 
  section 
}: { 
  error: string; 
  retry: () => void; 
  section?: string; 
}) {
  return (
    <div className="flex flex-col items-center justify-center p-8 text-center">
      <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mb-4">
        <AlertTriangle className="w-6 h-6 text-red-600" />
      </div>
      <h3 className="text-lg font-semibold text-gray-900 mb-2">
        {section ? `Error loading ${section}` : 'Something went wrong'}
      </h3>
      <p className="text-gray-600 mb-4 max-w-md">
        {error}
      </p>
      <Button onClick={retry} variant="outline">
        <RefreshCw className="w-4 h-4 mr-2" />
        Try Again
      </Button>
    </div>
  );
}

// Higher-order component for wrapping components with data loading
export function withDataLoader<T, P extends object>(
  Component: React.ComponentType<P & { data: T }>,
  fetchFn: (props: P) => Promise<T>,
  options?: {
    getDependencies?: (props: P) => any[];
    loadingComponent?: React.ReactNode;
    errorComponent?: (error: string, retry: () => void) => React.ReactNode;
    emptyComponent?: React.ReactNode;
    emptyTitle?: string;
    emptyDescription?: string;
    section?: string;
  }
) {
  return function WrappedComponent(props: P) {
    const dependencies = options?.getDependencies?.(props) || [];
    
    return (
      <DataLoader
        fetchFn={() => fetchFn(props)}
        dependencies={dependencies}
        loadingComponent={options?.loadingComponent}
        errorComponent={options?.errorComponent}
        emptyComponent={options?.emptyComponent}
        emptyTitle={options?.emptyTitle}
        emptyDescription={options?.emptyDescription}
        section={options?.section}
      >
        {(data) => <Component {...props} data={data} />}
      </DataLoader>
    );
  };
}

// Hook for manual data loading with consistent state management
export function useAsyncData<T>(
  fetchFn: () => Promise<T>,
  dependencies: any[] = []
): DataLoadingState<T> & {
  execute: () => Promise<void>;
} {
  const state = useDataLoader(fetchFn, dependencies);
  
  const execute = async () => {
    state.refetch();
  };

  return {
    ...state,
    execute,
  };
}