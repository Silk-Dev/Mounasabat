'use client';

import React from 'react';
import ErrorBoundary, { ErrorBoundaryFallbackProps } from './ErrorBoundary';
import { Search, RefreshCw, Filter } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

const SearchErrorFallback: React.FC<ErrorBoundaryFallbackProps> = ({ error, retry }) => {
  const handleClearFilters = () => {
    // Clear search filters from localStorage
    localStorage.removeItem('searchFilters');
    localStorage.removeItem('searchQuery');
    retry();
  };

  const handleSimpleSearch = () => {
    // Redirect to simple search without filters
    window.location.href = '/?simple=true';
  };

  return (
    <div className="flex items-center justify-center p-8">
      <Card className="w-full max-w-lg">
        <CardHeader className="text-center">
          <div className="mx-auto w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mb-4">
            <Search className="w-6 h-6 text-blue-600" />
          </div>
          <CardTitle className="text-xl font-semibold text-gray-900">
            Search Error
          </CardTitle>
          <CardDescription>
            We encountered an issue while searching. This might be due to complex filters or a temporary service issue.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <Button onClick={retry} className="w-full">
            <RefreshCw className="w-4 h-4 mr-2" />
            Try Search Again
          </Button>
          <Button variant="outline" onClick={handleClearFilters} className="w-full">
            <Filter className="w-4 h-4 mr-2" />
            Clear Filters & Retry
          </Button>
          <Button variant="ghost" onClick={handleSimpleSearch} className="w-full">
            <Search className="w-4 h-4 mr-2" />
            Simple Search
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

interface SearchErrorBoundaryProps {
  children: React.ReactNode;
}

const SearchErrorBoundary: React.FC<SearchErrorBoundaryProps> = ({ children }) => {
  return (
    <ErrorBoundary
      fallback={SearchErrorFallback}
      section="search"
      onError={(error, errorInfo) => {
        // Log search-specific error context
        logger.componentError('SearchErrorBoundary', error, {
          filters: localStorage.getItem('searchFilters'),
          query: localStorage.getItem('searchQuery'),
          componentStack: errorInfo.componentStack,
        });
      }}
    >
      {children}
    </ErrorBoundary>
  );
};

export default SearchErrorBoundary;