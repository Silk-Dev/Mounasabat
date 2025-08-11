'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { SearchBar, CategoryBrowser, PopularSearches } from '@/components/search';
import { searchServices, buildSearchQuery } from '@/lib/search';
import { SearchLoadingState, SearchNoResultsState, SearchErrorState } from '@/components/search/SearchEmptyStates';
import type { SearchFilters, SearchResult } from '@/types';
import { Button } from '@mounasabet/ui';
import { Card } from '@mounasabet/ui';
import { Badge } from '@mounasabet/ui';
import { Star, MapPin, Verified } from 'lucide-react';
import { ResponsiveImage } from '@/components/ui/ResponsiveImage';
import { useIsMobile } from '@/hooks/use-mobile';

export default function HomePage() {
  const router = useRouter();
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [hasSearched, setHasSearched] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [lastSearchFilters, setLastSearchFilters] = useState<SearchFilters>({});
  const [selectedCategory, setSelectedCategory] = useState<string>();
  const isMobile = useIsMobile();

  const handleSearch = async (filters: SearchFilters) => {
    setIsSearching(true);
    setHasSearched(true);
    setSearchError(null);
    setLastSearchFilters(filters);

    try {
      const response = await searchServices(filters);
      setSearchResults(response.results);

      // Update URL with search parameters
      const queryString = buildSearchQuery(filters);
      if (queryString) {
        router.push(`/search?${queryString}`);
      }
    } catch (error) {
      console.error('Search error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Search failed. Please try again.';
      setSearchError(errorMessage);
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  const handleRetrySearch = () => {
    if (lastSearchFilters) {
      handleSearch(lastSearchFilters);
    }
  };

  const handleClearSearch = () => {
    setHasSearched(false);
    setSearchResults([]);
    setSearchError(null);
    setLastSearchFilters({});
  };

  const handleCategorySelect = (categoryId: string) => {
    if (categoryId === 'all') {
      router.push('/categories');
      return;
    }

    setSelectedCategory(categoryId);
    handleSearch({ category: categoryId });
  };

  const handlePopularSearchSelect = (query: string) => {
    handleSearch({ query });
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-TN', {
      style: 'currency',
      currency: 'TND',
      minimumFractionDigits: 0,
    }).format(price);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      {/* Hero Section */}
      <section className={`relative ${isMobile ? 'py-8 px-4' : 'py-20 px-4'}`}>
        <div className="container mx-auto text-center">
          <h1 className={`font-bold text-gray-900 mb-6 ${
            isMobile ? 'text-3xl' : 'text-5xl md:text-6xl'
          }`}>
            Find Perfect Event Services
          </h1>
          <p className={`text-gray-600 max-w-3xl mx-auto mb-8 ${
            isMobile ? 'text-base mb-6' : 'text-xl mb-12'
          }`}>
            Discover, compare, and book the best venues, catering, photography, and more
            for your special occasions - all in one place.
          </p>

          {/* Main Search Bar */}
          <div className="mb-8">
            <SearchBar
              onSearch={handleSearch}
              isLoading={isSearching}
              showLocationDetection={true}
              showDatePicker={false}
              showGuestCount={false}
            />
          </div>

          {/* Popular Searches */}
          {!hasSearched && (
            <div className="max-w-4xl mx-auto">
              <PopularSearches onSearchSelect={handlePopularSearchSelect} />
            </div>
          )}
        </div>
      </section>

      {/* Search Results Section */}
      {hasSearched && (
        <section className={`bg-white ${isMobile ? 'py-6 px-4' : 'py-12 px-4'}`}>
          <div className="container mx-auto">
            {isSearching ? (
              <SearchLoadingState message="Searching for the perfect services..." />
            ) : searchError ? (
              <SearchErrorState 
                error={searchError}
                onRetry={handleRetrySearch}
              />
            ) : (
              <>
                <div className={`mb-6 ${isMobile ? 'mb-4' : 'mb-8'}`}>
                  <h2 className={`font-bold text-gray-900 mb-2 ${isMobile ? 'text-xl' : 'text-2xl'}`}>
                    Search Results
                  </h2>
                  <p className="text-gray-600">
                    Found {searchResults.length} services matching your criteria
                  </p>
                </div>

                {searchResults.length > 0 ? (
                  <div className={`grid gap-4 ${
                    isMobile ? 'mobile-grid' : 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'
                  }`}>
                    {searchResults.map((result) => (
                      <Card key={result.id} className="overflow-hidden hover:shadow-lg transition-shadow mobile-card">
                        <ResponsiveImage
                          src={result.images[0] || ''}
                          alt={result.name}
                          aspectRatio="video"
                          className="relative"
                          fallback={
                            <div className="w-full h-full flex items-center justify-center text-gray-400 bg-gray-100">
                              No image available
                            </div>
                          }
                        />
                        <div className="absolute top-3 right-3">
                          <Badge variant="secondary" className="bg-white/90">
                            {formatPrice(result.basePrice)}
                          </Badge>
                        </div>

                        <div className={`p-4 ${isMobile ? 'p-3' : 'p-4'}`}>
                          <div className="flex items-start justify-between mb-2">
                            <h3 className={`font-semibold text-gray-900 line-clamp-1 ${
                              isMobile ? 'text-base' : 'text-lg'
                            }`}>
                              {result.name}
                            </h3>
                            <div className="flex items-center gap-1 text-sm">
                              <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                              <span className="font-medium">{result.rating}</span>
                              <span className="text-gray-500">({result.reviewCount})</span>
                            </div>
                          </div>

                          <p className="text-gray-600 text-sm mb-3 line-clamp-2">
                            {result.description}
                          </p>

                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <div className="flex items-center gap-1 text-sm text-gray-500">
                                <MapPin className="h-4 w-4" />
                                <span className="truncate">{result.location}</span>
                              </div>
                              {result.provider.isVerified && (
                                <Verified className="h-4 w-4 text-blue-500 flex-shrink-0" />
                              )}
                            </div>

                            <Button
                              size="sm"
                              onClick={() => router.push(`/providers/${result.provider.id}`)}
                              className={isMobile ? 'text-xs px-2' : ''}
                            >
                              View Details
                            </Button>
                          </div>

                          <div className="mt-2 text-xs text-gray-500">
                            by {result.provider.name}
                          </div>
                        </div>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <SearchNoResultsState 
                    filters={lastSearchFilters}
                    onClearFilters={handleClearSearch}
                  />
                )}
              </>
            )}
          </div>
        </section>
      )}

      {/* Categories Section */}
      {!hasSearched && (
        <section className={`bg-white ${isMobile ? 'py-8 px-4' : 'py-16 px-4'}`}>
          <div className="container mx-auto">
            <CategoryBrowser
              onCategorySelect={handleCategorySelect}
              selectedCategory={selectedCategory}
            />
          </div>
        </section>
      )}

      {/* Features Section */}
      {!hasSearched && (
        <section className={`bg-gray-50 ${isMobile ? 'py-8 px-4' : 'py-16 px-4'}`}>
          <div className="container mx-auto">
            <div className={`text-center ${isMobile ? 'mb-8' : 'mb-12'}`}>
              <h2 className={`font-bold text-gray-900 mb-4 ${isMobile ? 'text-2xl' : 'text-3xl'}`}>
                Why Choose Mounasabet?
              </h2>
              <p className={`text-gray-600 max-w-2xl mx-auto ${isMobile ? 'text-base' : 'text-xl'}`}>
                We make event planning simple, reliable, and stress-free
              </p>
            </div>

            <div className={`grid gap-6 ${isMobile ? 'mobile-grid' : 'grid-cols-1 md:grid-cols-3 gap-8'}`}>
              <div className="text-center">
                <div className={`bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4 ${
                  isMobile ? 'w-12 h-12' : 'w-16 h-16'
                }`}>
                  <svg className={`text-primary ${isMobile ? 'w-6 h-6' : 'w-8 h-8'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
                <h3 className={`font-semibold text-gray-900 mb-2 ${isMobile ? 'text-lg' : 'text-xl'}`}>
                  Easy Discovery
                </h3>
                <p className="text-gray-600">
                  Find the perfect services with our advanced search and filtering system
                </p>
              </div>

              <div className="text-center">
                <div className={`bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4 ${
                  isMobile ? 'w-12 h-12' : 'w-16 h-16'
                }`}>
                  <Verified className={`text-primary ${isMobile ? 'w-6 h-6' : 'w-8 h-8'}`} />
                </div>
                <h3 className={`font-semibold text-gray-900 mb-2 ${isMobile ? 'text-lg' : 'text-xl'}`}>
                  Verified Providers
                </h3>
                <p className="text-gray-600">
                  All our service providers are verified and reviewed by real customers
                </p>
              </div>

              <div className="text-center">
                <div className={`bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4 ${
                  isMobile ? 'w-12 h-12' : 'w-16 h-16'
                }`}>
                  <svg className={`text-primary ${isMobile ? 'w-6 h-6' : 'w-8 h-8'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h3 className={`font-semibold text-gray-900 mb-2 ${isMobile ? 'text-lg' : 'text-xl'}`}>
                  Secure Booking
                </h3>
                <p className="text-gray-600">
                  Book with confidence using our secure payment system and booking protection
                </p>
              </div>
            </div>
          </div>
        </section>
      )}
    </div>
  );
}