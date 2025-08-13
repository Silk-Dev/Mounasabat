'use client';

import React from 'react';
import { 
  Search, 
  Filter, 
  MapPin, 
  AlertCircle,
  RefreshCw,
  TrendingUp,
  Star,
  Calendar
} from 'lucide-react';
import { EmptyState } from '@/components/ui/empty-state';
import { Button } from '@/components/ui';
import type { SearchFilters } from '@/types';

interface SearchEmptyStateProps {
  filters: SearchFilters;
  onClearFilters?: () => void;
  onRetry?: () => void;
  className?: string;
}

interface SearchErrorStateProps {
  error: string;
  onRetry?: () => void;
  className?: string;
}

interface SearchLoadingStateProps {
  message?: string;
  className?: string;
}

// Empty state when no search has been performed yet
export const SearchInitialState: React.FC<{ className?: string }> = ({ className }) => {
  return (
    <EmptyState
      title="Start your search"
      description="Use the search bar above to find the perfect services for your event. Browse by category or search for specific services."
      icon={
        <Search className="w-16 h-16" />
      }
      className={className}
    >
      <div className="mt-6 space-y-3">
        <p className="text-sm text-gray-500">Popular searches:</p>
        <div className="flex flex-wrap gap-2 justify-center">
          {['Wedding Photography', 'Event Catering', 'DJ Services', 'Venue Decoration'].map((term) => (
            <Button
              key={term}
              variant="outline"
              size="sm"
              className="text-xs"
              onClick={() => {
                // This would trigger a search - implementation depends on parent component
                console.log(`Search for: ${term}`);
              }}
            >
              {term}
            </Button>
          ))}
        </div>
      </div>
    </EmptyState>
  );
};

// Empty state when search returns no results
export const SearchNoResultsState: React.FC<SearchEmptyStateProps> = ({ 
  filters, 
  onClearFilters,
  className 
}) => {
  const getActiveFiltersCount = () => {
    let count = 0;
    if (filters.query) count++;
    if (filters.location) count++;
    if (filters.category || (filters.serviceType && filters.serviceType.length > 0)) count++;
    if (filters.priceRange) count++;
    if (filters.rating) count++;
    if (filters.availability) count++;
    return count;
  };

  const hasFilters = getActiveFiltersCount() > 0;

  return (
    <EmptyState
      title={hasFilters ? "No results found" : "No services available"}
      description={
        hasFilters 
          ? "We couldn't find any services matching your criteria. Try adjusting your filters or search terms."
          : "There are currently no services available. Please check back later or contact support."
      }
      icon={
        <div className="relative">
          <Search className="w-16 h-16" />
          {hasFilters && (
            <Filter className="w-6 h-6 absolute -top-1 -right-1 text-gray-400" />
          )}
        </div>
      }
      action={
        hasFilters && onClearFilters ? {
          label: "Clear All Filters",
          onClick: onClearFilters,
          variant: "outline"
        } : undefined
      }
      className={className}
    >
      {hasFilters && (
        <div className="mt-6 space-y-3">
          <p className="text-sm text-gray-500">Try these suggestions:</p>
          <div className="space-y-2 text-sm text-gray-600">
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4" />
              <span>Expand your location search area</span>
            </div>
            <div className="flex items-center gap-2">
              <Star className="w-4 h-4" />
              <span>Lower the minimum rating requirement</span>
            </div>
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              <span>Try different dates or remove date filters</span>
            </div>
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4" />
              <span>Browse popular categories instead</span>
            </div>
          </div>
        </div>
      )}
    </EmptyState>
  );
};

// Loading state during search
export const SearchLoadingState: React.FC<SearchLoadingStateProps> = ({ 
  message = "Searching for services...",
  className 
}) => {
  return (
    <div className={`w-full py-12 text-center ${className || ''}`}>
      <div className="flex flex-col items-center space-y-4">
        <div className="relative">
          <Search className="w-12 h-12 text-primary animate-pulse" />
          <div className="absolute inset-0 w-12 h-12 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
        </div>
        <div className="space-y-2">
          <h3 className="text-lg font-medium text-gray-900">
            {message}
          </h3>
          <p className="text-gray-600">
            Please wait while we find the best matches for you.
          </p>
        </div>
      </div>
    </div>
  );
};

// Error state when search fails
export const SearchErrorState: React.FC<SearchErrorStateProps> = ({ 
  error, 
  onRetry,
  className 
}) => {
  return (
    <EmptyState
      title="Search failed"
      description={`We encountered an error while searching: ${error}. Please try again or contact support if the problem persists.`}
      icon={
        <AlertCircle className="w-16 h-16 text-red-400" />
      }
      action={
        onRetry ? {
          label: "Try Again",
          onClick: onRetry,
          variant: "outline"
        } : undefined
      }
      className={className}
    >
      <div className="mt-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => window.location.reload()}
          className="text-gray-500 hover:text-gray-700"
        >
          <RefreshCw className="w-4 h-4 mr-2" />
          Refresh Page
        </Button>
      </div>
    </EmptyState>
  );
};

// Network error state
export const SearchNetworkErrorState: React.FC<SearchErrorStateProps> = ({ 
  onRetry,
  className 
}) => {
  return (
    <EmptyState
      title="Connection problem"
      description="We're having trouble connecting to our servers. Please check your internet connection and try again."
      icon={
        <div className="relative">
          <Search className="w-16 h-16 text-gray-400" />
          <AlertCircle className="w-6 h-6 absolute -top-1 -right-1 text-red-400" />
        </div>
      }
      action={
        onRetry ? {
          label: "Try Again",
          onClick: onRetry,
          variant: "default"
        } : undefined
      }
      className={className}
    />
  );
};