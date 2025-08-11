'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
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
  ChevronDown
} from 'lucide-react';
import ResultCard from './ResultCard';
import { 
  SearchLoadingState, 
  SearchNoResultsState, 
  SearchErrorState 
} from './SearchEmptyStates';
import type { SearchResult, SearchFilters } from '@/types';

interface SearchResultsProps {
  results: SearchResult[];
  filters: SearchFilters;
  isLoading?: boolean;
  error?: string | null;
  onFiltersChange?: (filters: SearchFilters) => void;
  onFavoriteToggle?: (id: string) => void;
  onShare?: (result: SearchResult) => void;
  onRetry?: () => void;
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

const SearchResults: React.FC<SearchResultsProps> = ({
  results,
  filters,
  isLoading = false,
  error = null,
  onFiltersChange,
  onFavoriteToggle,
  onShare,
  onRetry,
  favoriteIds = [],
  className = ''
}) => {
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [sortBy, setSortBy] = useState<SortOption>('relevance');
  const [showSortDropdown, setShowSortDropdown] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(12);

  // Sort results based on selected option
  const sortedResults = useMemo(() => {
    const sorted = [...results];
    
    switch (sortBy) {
      case 'price_low':
        return sorted.sort((a, b) => a.basePrice - b.basePrice);
      case 'price_high':
        return sorted.sort((a, b) => b.basePrice - a.basePrice);
      case 'rating':
        return sorted.sort((a, b) => b.rating - a.rating);
      case 'reviews':
        return sorted.sort((a, b) => b.reviewCount - a.reviewCount);
      case 'distance':
        // Sort by location name (in real implementation, this would use actual coordinates and distance calculation)
        return sorted.sort((a, b) => a.location.localeCompare(b.location));
      case 'relevance':
      default:
        // Relevance sorting based on rating and review count
        return sorted.sort((a, b) => {
          const scoreA = a.rating * Math.log(a.reviewCount + 1);
          const scoreB = b.rating * Math.log(b.reviewCount + 1);
          return scoreB - scoreA;
        });
    }
  }, [results, sortBy]);

  // Paginate results
  const paginatedResults = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return sortedResults.slice(startIndex, endIndex);
  }, [sortedResults, currentPage, itemsPerPage]);

  const totalPages = Math.ceil(sortedResults.length / itemsPerPage);

  // Reset page when results change
  useEffect(() => {
    setCurrentPage(1);
  }, [results, sortBy]);

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

  const handleSortChange = useCallback((option: SortOption) => {
    setSortBy(option);
    setShowSortDropdown(false);
  }, []);

  const handlePageChange = useCallback((page: number) => {
    setCurrentPage(page);
    // Scroll to top of results
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const handleViewModeChange = useCallback((mode: ViewMode) => {
    setViewMode(mode);
  }, []);

  // Handle loading state
  if (isLoading) {
    return (
      <div className={`w-full ${className}`}>
        <SearchLoadingState />
      </div>
    );
  }

  // Handle error state
  if (error) {
    return (
      <div className={`w-full ${className}`}>
        <SearchErrorState 
          error={error}
          onRetry={onRetry}
        />
      </div>
    );
  }

  // Handle empty results
  if (results.length === 0) {
    return (
      <div className={`w-full ${className}`}>
        <SearchNoResultsState 
          filters={filters}
          onClearFilters={onFiltersChange ? () => onFiltersChange({}) : undefined}
        />
      </div>
    );
  }

  return (
    <div className={`w-full space-y-6 ${className}`}>
      {/* Results Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {sortedResults.length} {sortedResults.length === 1 ? 'Service' : 'Services'} Found
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
      <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600">
        <div className="flex items-center gap-1">
          <DollarSign className="h-4 w-4" />
          <span>
            Price range: {formatPrice(Math.min(...sortedResults.map(r => r.basePrice)))} - {formatPrice(Math.max(...sortedResults.map(r => r.basePrice)))}
          </span>
        </div>
        <div className="flex items-center gap-1">
          <Star className="h-4 w-4" />
          <span>
            Average rating: {(sortedResults.reduce((sum, r) => sum + r.rating, 0) / sortedResults.length).toFixed(1)}
          </span>
        </div>
        <div className="flex items-center gap-1">
          <MapPin className="h-4 w-4" />
          <span>
            {new Set(sortedResults.map(r => r.location)).size} location{new Set(sortedResults.map(r => r.location)).size !== 1 ? 's' : ''}
          </span>
        </div>
      </div>

      {/* Results Grid/List */}
      <div className={
        viewMode === 'grid' 
          ? 'grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6'
          : 'space-y-4'
      }>
        {paginatedResults.map((result) => (
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

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 pt-8">
          <Button
            variant="outline"
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage === 1}
          >
            Previous
          </Button>
          
          <div className="flex items-center gap-1">
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              let pageNumber;
              if (totalPages <= 5) {
                pageNumber = i + 1;
              } else if (currentPage <= 3) {
                pageNumber = i + 1;
              } else if (currentPage >= totalPages - 2) {
                pageNumber = totalPages - 4 + i;
              } else {
                pageNumber = currentPage - 2 + i;
              }

              return (
                <Button
                  key={pageNumber}
                  variant={currentPage === pageNumber ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => handlePageChange(pageNumber)}
                  className="w-10 h-10 p-0"
                >
                  {pageNumber}
                </Button>
              );
            })}
          </div>

          <Button
            variant="outline"
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
          >
            Next
          </Button>
        </div>
      )}

      {/* Results Info */}
      <div className="text-center text-sm text-gray-500 pt-4 border-t">
        Showing {((currentPage - 1) * itemsPerPage) + 1} - {Math.min(currentPage * itemsPerPage, sortedResults.length)} of {sortedResults.length} results
        {sortBy !== 'relevance' && (
          <span className="ml-2">• Sorted by {sortOptions.find(option => option.key === sortBy)?.label}</span>
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

export default SearchResults;