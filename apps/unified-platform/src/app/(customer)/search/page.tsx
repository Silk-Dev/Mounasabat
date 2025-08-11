'use client';

import React, { useState, useCallback } from 'react';
import SearchBar from '@/components/search/SearchBar';
import FilterPanel from '@/components/search/FilterPanel';
import SearchResultsComponent from '@/components/search/SearchResults';
import { useAdvancedSearch } from '@/lib/hooks/useAdvancedSearch';
import type { SearchResult, SearchFilters } from '@/types';
import { Button } from '@mounasabet/ui';
import { Filter } from 'lucide-react';

export default function SearchPage() {
  const [showFilters, setShowFilters] = useState(false);
  const [favoriteIds, setFavoriteIds] = useState<string[]>([]);

  const {
    filters,
    results,
    isLoading,
    error,
    totalResults,
    updateFilters,
    clearFilters,
    search,
    hasActiveFilters,
    activeFiltersCount
  } = useAdvancedSearch({
    debounceMs: 300,
    autoSearch: true
  });

  const handleSearch = useCallback(async (searchFilters: SearchFilters) => {
    updateFilters(searchFilters);
  }, [updateFilters]);

  const handleFiltersChange = useCallback(async (newFilters: SearchFilters) => {
    updateFilters(newFilters);
  }, [updateFilters]);

  const handleFavoriteToggle = useCallback((id: string) => {
    setFavoriteIds(prev => 
      prev.includes(id) 
        ? prev.filter(fId => fId !== id)
        : [...prev, id]
    );
  }, []);

  const handleShare = useCallback(async (result: SearchResult) => {
    const url = `${window.location.origin}/providers/${result.provider.id}/services/${result.id}`;
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: result.name,
          text: result.description,
          url
        });
      } catch (shareError) {
        // User cancelled sharing or sharing failed
        console.log('Share cancelled or failed:', shareError);
      }
    } else {
      // Fallback to copying to clipboard
      try {
        await navigator.clipboard.writeText(url);
        // You could show a toast notification here
        console.log('Link copied to clipboard');
      } catch (clipboardError) {
        console.error('Failed to copy to clipboard:', clipboardError);
      }
    }
  }, []);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Search Header */}
      <div className="bg-white border-b sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <SearchBar
            onSearch={handleSearch}
            isLoading={isLoading}
            showLocationDetection={true}
            showDatePicker={true}
            showGuestCount={true}
          />
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">


        <div className="flex flex-col lg:flex-row gap-8">
          {/* Filters Sidebar */}
          <div className="lg:w-1/4">
            <div className="lg:sticky lg:top-24">
              <div className="flex items-center justify-between mb-4 lg:hidden">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowFilters(!showFilters)}
                  className="flex items-center gap-2"
                >
                  <Filter className="h-4 w-4" />
                  {showFilters ? 'Hide' : 'Show'} Filters
                  {activeFiltersCount > 0 && (
                    <span className="ml-1 bg-primary text-primary-foreground text-xs rounded-full px-2 py-0.5">
                      {activeFiltersCount}
                    </span>
                  )}
                </Button>
              </div>

              <div className={`${showFilters ? 'block' : 'hidden lg:block'}`}>
                <FilterPanel
                  filters={filters}
                  onFiltersChange={handleFiltersChange}
                  onClearFilters={clearFilters}
                  isLoading={isLoading}
                />
              </div>
            </div>
          </div>

          {/* Results */}
          <div className="lg:w-3/4">
            <SearchResultsComponent
              results={results}
              filters={filters}
              isLoading={isLoading}
              error={error}
              onFiltersChange={handleFiltersChange}
              onFavoriteToggle={handleFavoriteToggle}
              onShare={handleShare}
              onRetry={() => search(filters)}
              favoriteIds={favoriteIds}
            />
          </div>
        </div>
      </div>
    </div>
  );
}