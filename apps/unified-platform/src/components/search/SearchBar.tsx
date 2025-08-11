'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Search, MapPin, Calendar, Users, Filter, AlertCircle } from 'lucide-react';
import { Button } from '@mounasabet/ui';
import { Input } from '@mounasabet/ui';
import { Card } from '@mounasabet/ui';
import { Sheet, SheetContent, SheetTrigger, SheetHeader, SheetTitle } from '@mounasabet/ui';
import { useIsMobile } from '@/hooks/use-mobile';
import { useSearchErrorHandler } from '@/lib/hooks/useErrorHandler';
import { LoadingSpinner } from '@/components/ui/loading';
import SearchErrorBoundary from '@/components/error/SearchErrorBoundary';
import type { SearchFilters } from '@/types';

interface SearchBarProps {
  onSearch: (filters: SearchFilters) => void;
  isLoading?: boolean;
  placeholder?: string;
  showLocationDetection?: boolean;
  showDatePicker?: boolean;
  showGuestCount?: boolean;
  compact?: boolean;
}

interface LocationSuggestion {
  id: string;
  name: string;
  type: 'city' | 'region' | 'venue';
}

function SearchBarContent({
  onSearch,
  isLoading = false,
  placeholder = "Search for venues, catering, photography...",
  showLocationDetection = true,
  showDatePicker = false,
  showGuestCount = false,
  compact = false
}: SearchBarProps) {
  const [query, setQuery] = useState('');
  const [location, setLocation] = useState('');
  const [eventDate, setEventDate] = useState('');
  const [guestCount, setGuestCount] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [locationSuggestions, setLocationSuggestions] = useState<LocationSuggestion[]>([]);
  const [isDetectingLocation, setIsDetectingLocation] = useState(false);
  const [showMobileFilters, setShowMobileFilters] = useState(false);
  
  const searchRef = useRef<HTMLDivElement>(null);
  const locationRef = useRef<HTMLInputElement>(null);
  const isMobile = useIsMobile();
  
  const { 
    error: searchError, 
    isLoading: isSearching, 
    executeWithRetry,
    reset: resetError 
  } = useSearchErrorHandler();

  // Handle location input changes and show suggestions
  useEffect(() => {
    const loadLocationSuggestions = async () => {
      if (location.length > 1) {
        try {
          // Get location suggestions from database (unique locations from services/providers)
          const response = await fetch(`/api/search/locations?q=${encodeURIComponent(location)}`);
          if (response.ok) {
            const data = await response.json();
            if (data.success) {
              setLocationSuggestions(data.locations || []);
              setShowSuggestions(true);
              return;
            }
          }
        } catch (error) {
          console.error('Failed to load location suggestions:', error);
        }
        
        // Fallback to common Tunisian cities if API fails
        const fallbackLocations: LocationSuggestion[] = [
          { id: '1', name: 'Tunis', type: 'city' },
          { id: '2', name: 'Sfax', type: 'city' },
          { id: '3', name: 'Sousse', type: 'city' },
          { id: '4', name: 'Monastir', type: 'city' },
          { id: '5', name: 'Bizerte', type: 'city' },
          { id: '6', name: 'Gabès', type: 'city' },
        ];
        
        const filtered = fallbackLocations.filter(suggestion =>
          suggestion.name.toLowerCase().includes(location.toLowerCase())
        );
        setLocationSuggestions(filtered);
        setShowSuggestions(true);
      } else {
        setShowSuggestions(false);
      }
    };

    const timeoutId = setTimeout(loadLocationSuggestions, 300); // Debounce
    return () => clearTimeout(timeoutId);
  }, [location]);

  // Close suggestions when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLocationDetection = async () => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by this browser.');
      return;
    }

    setIsDetectingLocation(true);
    
    await executeWithRetry(async () => {
      return new Promise<void>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(
          async (position) => {
            try {
              // In a real implementation, you would reverse geocode the coordinates
              // For now, we'll just set a default location
              setLocation('Current Location');
              resolve();
            } catch (error) {
              reject(new Error('Failed to get location name'));
            }
          },
          (error) => {
            reject(new Error(`Geolocation error: ${error.message}`));
          },
          { timeout: 10000 }
        );
      });
    });
    
    setIsDetectingLocation(false);
  };

  const handleLocationSelect = (suggestion: LocationSuggestion) => {
    setLocation(suggestion.name);
    setShowSuggestions(false);
    locationRef.current?.focus();
  };

  const handleSearch = async () => {
    const filters: SearchFilters = {
      query: query.trim() || undefined,
      location: location.trim() || undefined,
    };

    // Add date filter if provided
    if (eventDate) {
      const date = new Date(eventDate);
      filters.availability = {
        startDate: date,
        endDate: date
      };
    }

    // Reset any previous errors
    resetError();

    // Execute search with retry logic
    await executeWithRetry(async () => {
      onSearch(filters);
    });
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  // Show error state if there's a search error
  if (searchError) {
    return (
      <div className="w-full max-w-4xl mx-auto">
        <Card className="p-4 border-red-200 bg-red-50">
          <div className="flex items-center gap-3 text-red-700">
            <AlertCircle className="h-5 w-5 flex-shrink-0" />
            <div className="flex-1">
              <p className="font-medium">Search Error</p>
              <p className="text-sm text-red-600">
                {searchError.message || 'Failed to perform search. Please try again.'}
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={resetError}
              className="border-red-300 text-red-700 hover:bg-red-100"
            >
              Try Again
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  const currentlyLoading = isLoading || isSearching;

  // Mobile search component
  if (isMobile && !compact) {
    return (
      <div ref={searchRef} className="relative w-full">
        <Card className="p-3 shadow-lg border-0 bg-white">
          <div className="space-y-3">
            {/* Main search input */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
              <Input
                type="text"
                placeholder={placeholder}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyPress={handleKeyPress}
                className="pl-10 h-12 text-base border-gray-200 focus:border-primary focus:ring-primary"
              />
            </div>

            {/* Mobile filters row */}
            <div className="flex gap-2">
              {showLocationDetection && (
                <div className="flex-1 relative">
                  <div className="relative">
                    <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                    <Input
                      ref={locationRef}
                      type="text"
                      placeholder="Location"
                      value={location}
                      onChange={(e) => setLocation(e.target.value)}
                      onKeyPress={handleKeyPress}
                      className="pl-9 pr-9 h-10 text-sm border-gray-200 focus:border-primary focus:ring-primary"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={handleLocationDetection}
                      disabled={isDetectingLocation}
                      className="absolute right-1 top-1/2 transform -translate-y-1/2 h-8 w-8 p-0"
                    >
                      <MapPin className={`h-3 w-3 ${isDetectingLocation ? 'animate-pulse' : ''}`} />
                    </Button>
                  </div>

                  {/* Location suggestions dropdown */}
                  {showSuggestions && locationSuggestions.length > 0 && (
                    <Card className="absolute top-full left-0 right-0 mt-1 z-50 max-h-48 overflow-y-auto">
                      {locationSuggestions.map((suggestion) => (
                        <button
                          key={suggestion.id}
                          onClick={() => handleLocationSelect(suggestion)}
                          className="w-full text-left px-3 py-2 hover:bg-gray-50 flex items-center gap-2 border-b last:border-b-0"
                        >
                          <MapPin className="h-3 w-3 text-gray-400" />
                          <span className="text-xs">{suggestion.name}</span>
                          <span className="text-xs text-gray-500 ml-auto capitalize">
                            {suggestion.type}
                          </span>
                        </button>
                      ))}
                    </Card>
                  )}
                </div>
              )}

              {/* Mobile filters sheet */}
              {(showDatePicker || showGuestCount) && (
                <Sheet open={showMobileFilters} onOpenChange={setShowMobileFilters}>
                  <SheetTrigger asChild>
                    <Button variant="outline" size="sm" className="h-10 px-3">
                      <Filter className="h-4 w-4 mr-1" />
                      Filters
                    </Button>
                  </SheetTrigger>
                  <SheetContent side="bottom" className="h-[60vh]">
                    <SheetHeader>
                      <SheetTitle>Search Filters</SheetTitle>
                    </SheetHeader>
                    
                    <div className="mt-6 space-y-4">
                      {showDatePicker && (
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Event Date
                          </label>
                          <div className="relative">
                            <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                            <Input
                              type="date"
                              value={eventDate}
                              onChange={(e) => setEventDate(e.target.value)}
                              className="pl-10 h-12 text-base border-gray-200 focus:border-primary focus:ring-primary"
                            />
                          </div>
                        </div>
                      )}

                      {showGuestCount && (
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Number of Guests
                          </label>
                          <div className="relative">
                            <Users className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                            <Input
                              type="number"
                              placeholder="Enter guest count"
                              value={guestCount}
                              onChange={(e) => setGuestCount(e.target.value)}
                              min="1"
                              className="pl-10 h-12 text-base border-gray-200 focus:border-primary focus:ring-primary"
                            />
                          </div>
                        </div>
                      )}

                      <Button
                        onClick={() => {
                          setShowMobileFilters(false);
                          handleSearch();
                        }}
                        className="w-full h-12"
                      >
                        Apply Filters
                      </Button>
                    </div>
                  </SheetContent>
                </Sheet>
              )}

              {/* Search button */}
              <Button
                onClick={handleSearch}
                disabled={currentlyLoading}
                className="h-10 px-4 bg-primary hover:bg-primary/90 text-white font-medium"
              >
                {currentlyLoading ? (
                  <LoadingSpinner size="sm" className="text-white" />
                ) : (
                  <Search className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>
        </Card>
      </div>
    );
  }

  // Desktop search component
  return (
    <div ref={searchRef} className="relative w-full max-w-4xl mx-auto">
      <Card className="p-4 shadow-lg border-0 bg-white">
        <div className="flex flex-col lg:flex-row gap-4">
          {/* Main search input */}
          <div className="flex-1 relative">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
              <Input
                type="text"
                placeholder={placeholder}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyPress={handleKeyPress}
                className="pl-10 h-12 text-base border-gray-200 focus:border-primary focus:ring-primary"
              />
            </div>
          </div>

          {/* Location input */}
          {showLocationDetection && (
            <div className="flex-1 relative">
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                <Input
                  ref={locationRef}
                  type="text"
                  placeholder="Where?"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  onKeyPress={handleKeyPress}
                  className="pl-10 pr-10 h-12 text-base border-gray-200 focus:border-primary focus:ring-primary"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={handleLocationDetection}
                  disabled={isDetectingLocation}
                  className="absolute right-1 top-1/2 transform -translate-y-1/2 h-10 w-10 p-0"
                >
                  <MapPin className={`h-4 w-4 ${isDetectingLocation ? 'animate-pulse' : ''}`} />
                </Button>
              </div>

              {/* Location suggestions dropdown */}
              {showSuggestions && locationSuggestions.length > 0 && (
                <Card className="absolute top-full left-0 right-0 mt-1 z-50 max-h-60 overflow-y-auto">
                  {locationSuggestions.map((suggestion) => (
                    <button
                      key={suggestion.id}
                      onClick={() => handleLocationSelect(suggestion)}
                      className="w-full text-left px-4 py-3 hover:bg-gray-50 flex items-center gap-2 border-b last:border-b-0"
                    >
                      <MapPin className="h-4 w-4 text-gray-400" />
                      <span className="text-sm">{suggestion.name}</span>
                      <span className="text-xs text-gray-500 ml-auto capitalize">
                        {suggestion.type}
                      </span>
                    </button>
                  ))}
                </Card>
              )}
            </div>
          )}

          {/* Date picker */}
          {showDatePicker && (
            <div className="flex-1 relative">
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                <Input
                  type="date"
                  value={eventDate}
                  onChange={(e) => setEventDate(e.target.value)}
                  onKeyPress={handleKeyPress}
                  className="pl-10 h-12 text-base border-gray-200 focus:border-primary focus:ring-primary"
                />
              </div>
            </div>
          )}

          {/* Guest count */}
          {showGuestCount && (
            <div className="flex-1 relative">
              <div className="relative">
                <Users className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                <Input
                  type="number"
                  placeholder="Guests"
                  value={guestCount}
                  onChange={(e) => setGuestCount(e.target.value)}
                  onKeyPress={handleKeyPress}
                  min="1"
                  className="pl-10 h-12 text-base border-gray-200 focus:border-primary focus:ring-primary"
                />
              </div>
            </div>
          )}

          {/* Search button */}
          <Button
            onClick={handleSearch}
            disabled={currentlyLoading}
            className="h-12 px-8 bg-primary hover:bg-primary/90 text-white font-medium"
          >
            {currentlyLoading ? (
              <div className="flex items-center gap-2">
                <LoadingSpinner size="sm" className="text-white" />
                Searching...
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Search className="h-5 w-5" />
                Search
              </div>
            )}
          </Button>
        </div>
      </Card>
    </div>
  );
}
export default function SearchBar(props: SearchBarProps) {
  return (
    <SearchErrorBoundary>
      <SearchBarContent {...props} />
    </SearchErrorBoundary>
  );
}