'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Button } from '@mounasabet/ui';
import { Card } from '@mounasabet/ui';
import { 
  Grid3X3, 
  List, 
  SortAsc, 
  SortDesc,
  Filter,
  MapPin,
  Star,
  DollarSign,
  TrendingUp,
  ChevronDown,
  Loader2,
  RefreshCw
} from 'lucide-react';
import ResultCard from './ResultCard';
import type { SearchResult, SearchFilters } from '@/types';

interface InfiniteSearchResultsProps {
  initialResults?: SearchResult[];
  filters: SearchFilters;
  isLoading?: boolean;
  onFiltersChange?: (filters: SearchFilters) => void;
  onFavoriteToggle?: (id: string) => void;
  onShare?: (result: SearchResult) => void;
  favoriteIds?: string[];
  className?: string;
}

type SortOption = 'relevance' | 'price_low' | 'price_high' | 'rating' | 'reviews' | 'distance';
type ViewMode = 'grid' | 'list';

interface SortConfig {
  key: SortOption;
  label: string;
  icon: React.ReactNode;
  description: string;
}

const sortOptions: SortConfig[] = [
  {
    key: 'relevance',
    label: 'Best Match',
    icon: <TrendingUp className="h-4 w-4" />,
    description: 'Most relevant to your search'
  },
  {
    key: 'price_low',
    label: 'Price: Low to High',
    icon: <SortAsc className="h-4 w-4" />,
    description: 'Lowest price first'
  },
  {
    key: 'price_high',
    label: 'Price: High to Low',
    icon: <SortDesc className="h-4 w-4" />,
    description: 'Highest price first'
  },
  {
    key: 'rating',
    label: 'Highest Rated',
    icon: <Star className="h-4 w-4" />,
    description: 'Best rated services first'
  },
  {
    key: 'reviews',
    label: 'Most Reviewed',
    icon: <Star className="h-4 w-4" />,
    description: 'Most reviewed services first'
  },
  {
    key: 'distance',
    label: 'Distance',
    icon: <MapPin className="h-4 w-4" />,
    description: 'Closest to your location'
  }
];

const InfiniteSearchResults: React.FC<InfiniteSearchResultsProps> = ({
  initialResults = [],
  filters,
  isLoading = false,
  onFiltersChange,
  onFavoriteToggle,
  onShare,
  favoriteIds = [],
  className = ''
}) => {
  const [results, setResults] = useState<SearchResult[]>(initialResults);
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [sortBy, setSortBy] = useState<SortOption>('relevance');
  const [showSortDropdown, setShowSortDropdown] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [total, setTotal] = useState(0);

  const observerRef = useRef<IntersectionObserver | null>(null);
  const loadMoreRef = useRef<HTMLDivElement | null>(null);

  // Load more results
  const loadMore = useCallback(async () => {
    if (loadingMore || !hasMore || isLoading) return;

    setLoadingMore(true);
    setError(null);

    try {
      const searchParams = new URLSearchParams({
        page: (page + 1).toString(),
        limit: '12',
        sortBy,
      });

      // Add filters to search params
      if (filters.query) searchParams.set('q', filters.query);
      if (filters.location) searchParams.set('location', filters.location);
      if (filters.category) searchParams.set('category', filters.category);
      if (filters.priceRange) {
        searchParams.set('minPrice', filters.priceRange[0].toString());
        searchParams.set('maxPrice', filters.priceRange[1].toString());
      }
      if (filters.rating) searchParams.set('rating', filters.rating.toString());
      if (filters.serviceType) searchParams.set('serviceTypes', filters.serviceType.join(','));

      const response = await fetch(`/api/search?${searchParams.toString()}`);
      const data = await response.json();

      if (data.success) {
        setResults(prev => [...prev, ...data.results]);
        setPage(data.page);
        setHasMore(data.hasMore);
        setTotal(data.total);
      } else {
        setError(data.message || 'Failed to load more results');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load more results');
    } finally {
      setLoadingMore(false);
    }
  }, [filters, page, sortBy, loadingMore, hasMore, isLoading]);

  // Search with new filters or sort
  const performSearch = useCallback(async (newFilters: SearchFilters, newSortBy: SortOption) => {
    setError(null);
    setResults([]);
    setPage(1);
    setHasMore(true);

    try {
      const searchParams = new URLSearchParams({
        page: '1',
        limit: '12',
        sortBy: newSortBy,
      });

      // Add filters to search params
      if (newFilters.query) searchParams.set('q', newFilters.query);
      if (newFilters.location) searchParams.set('location', newFilters.location);
      if (newFilters.category) searchParams.set('category', newFilters.category);
      if (newFilters.priceRange) {
        searchParams.set('minPrice', newFilters.priceRange[0].toString());
        searchParams.set('maxPrice', newFilters.priceRange[1].toString());
      }
      if (newFilters.rating) searchParams.set('rating', newFilters.rating.toString());
      if (newFilters.serviceType) searchParams.set('serviceTypes', newFilters.serviceType.join(','));

      const response = await fetch(`/api/search?${searchParams.toString()}`);
      const data = await response.json();

      if (data.success) {
        setResults(data.results);
        setPage(data.page);
        setHasMore(data.hasMore);
        setTotal(data.total);
      } else {
        setError(data.message || 'Search failed');
        setResults([]);
        setTotal(0);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Search failed');
      setResults([]);
      setTotal(0);
    }
  }, []);

  // Set up intersection observer for infinite scroll
  useEffect(() => {
    if (observerRef.current) {
      observerRef.current.disconnect();
    }

    observerRef.current = new IntersectionObserver(
      (entries) => {
        const target = entries[0];
        if (target.isIntersecting && hasMore && !loadingMore && !isLoading) {
          loadMore();
        }
      },
      {
        threshold: 0.1,
        rootMargin: '100px',
      }
    );

    if (loadMoreRef.current) {
      observerRef.current.observe(loadMoreRef.current);
    }

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [loadMore, hasMore, loadingMore, isLoading]);

  // Handle filter changes
  useEffect(() => {
    if (Object.keys(filters).length > 0) {
      performSearch(filters, sortBy);
    }
  }, [filters, performSearch, sortBy]);

  const handleSortChange = useCallback((option: SortOption) => {
    setSortBy(option);
    setShowSortDropdown(false);
    performSearch(filters, option);
  }, [filters, performSearch]);

  const handleViewModeChange = useCallback((mode: ViewMode) => {
    setViewMode(mode);
  }, []);

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-TN', {
      style: 'currency',
      currency: 'TND',
      minimumFractionDigits: 0,
    }).format(price);
  };

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

  if (isLoading && results.length === 0) {
    return (
      <div className={`w-full ${className}`}>
        <div className="text-center py-12">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Searching for services...</h3>
          <p className="text-gray-600">Please wait while we find the best matches for you.</p>
        </div>
      </div>
    );
  }

  if (error && results.length === 0) {
    return (
      <div className={`w-full ${className}`}>
        <div className="text-center py-12">
          <div className="text-red-400 mb-4">
            <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">Search Error</h3>
          <p className="text-gray-600 mb-4">{error}</p>
          <Button
            variant="outline"
            onClick={() => performSearch(filters, sortBy)}
            className="flex items-center gap-2"
          >
            <RefreshCw className="h-4 w-4" />
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  if (results.length === 0 && !isLoading) {
    return (
      <div className={`w-full ${className}`}>
        <div className="text-center py-12">
          <div className="text-gray-400 mb-4">
            <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            {getActiveFiltersCount() > 0 ? 'No results found' : 'Start your search'}
          </h3>
          <p className="text-gray-600 mb-4">
            {getActiveFiltersCount() > 0 
              ? 'Try adjusting your search criteria or browse our categories.'
              : 'Use the search bar above to find the perfect services for your event.'
            }
          </p>
          {getActiveFiltersCount() > 0 && onFiltersChange && (
            <Button
              variant="outline"
              onClick={() => onFiltersChange({})}
            >
              Clear All Filters
            </Button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className={`w-full space-y-6 ${className}`}>
      {/* Results Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {total > 0 ? `${total} Services Found` : `${results.length} Services`}
          </h1>
          {(filters.query || filters.location) && (
            <p className="text-gray-600 mt-1">
              {filters.query && `for "${filters.query}"`}
              {filters.query && filters.location && ' '}
              {filters.location && `in ${filters.location}`}
            </p>
          )}
          {getActiveFiltersCount() > 0 && (
            <div className="flex items-center gap-2 mt-2">
              <Filter className="h-4 w-4 text-gray-500" />
              <span className="text-sm text-gray-600">
                {getActiveFiltersCount()} filter{getActiveFiltersCount() !== 1 ? 's' : ''} applied
              </span>
            </div>
          )}
        </div>

        {/* View Controls */}
        <div className="flex items-center gap-4">
          {/* Sort Dropdown */}
          <div className="relative">
            <Button
              variant="outline"
              onClick={() => setShowSortDropdown(!showSortDropdown)}
              className="flex items-center gap-2"
            >
              <>{sortOptions.find(option => option.key === sortBy)?.icon}</>
              <span className="hidden sm:inline">
                {sortOptions.find(option => option.key === sortBy)?.label}
              </span>
              <span className="sm:hidden">Sort</span>
              <ChevronDown className="h-4 w-4" />
            </Button>

            {showSortDropdown && (
              <Card className="absolute top-full right-0 mt-1 z-50 w-64 p-2">
                {sortOptions.map((option) => (
                  <button
                    key={option.key}
                    onClick={() => handleSortChange(option.key)}
                    className={`w-full text-left px-3 py-2 rounded-md hover:bg-gray-50 transition-colors ${
                      sortBy === option.key ? 'bg-primary/10 text-primary' : 'text-gray-700'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      {option.icon}
                      <div>
                        <div className="font-medium">{option.label}</div>
                        <div className="text-xs text-gray-500">{option.description}</div>
                      </div>
                    </div>
                  </button>
                ))}
              </Card>
            )}
          </div>

          {/* View Mode Toggle */}
          <div className="flex items-center border rounded-lg p-1">
            <Button
              variant={viewMode === 'grid' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => handleViewModeChange('grid')}
              className="h-8 w-8 p-0"
            >
              <Grid3X3 className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === 'list' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => handleViewModeChange('list')}
              className="h-8 w-8 p-0"
            >
              <List className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Results Summary */}
      {results.length > 0 && (
        <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600">
          <div className="flex items-center gap-1">
            <DollarSign className="h-4 w-4" />
            <span>
              Price range: {formatPrice(Math.min(...results.map(r => r.basePrice)))} - {formatPrice(Math.max(...results.map(r => r.basePrice)))}
            </span>
          </div>
          <div className="flex items-center gap-1">
            <Star className="h-4 w-4" />
            <span>
              Average rating: {(results.reduce((sum, r) => sum + r.rating, 0) / results.length).toFixed(1)}
            </span>
          </div>
          <div className="flex items-center gap-1">
            <MapPin className="h-4 w-4" />
            <span>
              {new Set(results.map(r => r.location)).size} location{new Set(results.map(r => r.location)).size !== 1 ? 's' : ''}
            </span>
          </div>
        </div>
      )}

      {/* Results Grid/List */}
      <div className={
        viewMode === 'grid' 
          ? 'grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6'
          : 'space-y-4'
      }>
        {results.map((result) => (
          <ResultCard
            key={result.id}
            result={result}
            viewMode={viewMode}
            onFavoriteToggle={onFavoriteToggle}
            onShare={onShare}
            isFavorited={favoriteIds.includes(result.id)}
          />
        ))}
      </div>

      {/* Load More / Loading Indicator */}
      <div ref={loadMoreRef} className="flex justify-center py-8">
        {loadingMore && (
          <div className="flex items-center gap-2 text-gray-600">
            <Loader2 className="h-5 w-5 animate-spin" />
            <span>Loading more results...</span>
          </div>
        )}
        
        {!hasMore && results.length > 0 && (
          <div className="text-center text-gray-500">
            <p>You've reached the end of the results</p>
            <p className="text-sm mt-1">Showing all {results.length} services</p>
          </div>
        )}
        
        {error && results.length > 0 && (
          <div className="text-center">
            <p className="text-red-600 mb-2">Failed to load more results</p>
            <Button
              variant="outline"
              size="sm"
              onClick={loadMore}
              className="flex items-center gap-2"
            >
              <RefreshCw className="h-4 w-4" />
              Try Again
            </Button>
          </div>
        )}
      </div>

      {/* Click outside to close dropdown */}
      {showSortDropdown && (
        <div 
          className="fixed inset-0 z-40" 
          onClick={() => setShowSortDropdown(false)}
        />
      )}
    </div>
  );
};

export default InfiniteSearchResults;