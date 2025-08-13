'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Card } from '@/components/ui';
import { Button } from '@/components/ui';
import { Input } from '@/components/ui';
import { Label } from '@/components/ui';
import { Checkbox } from '@/components/ui';
import { Slider } from '@/components/ui';
import { Badge } from '@/components/ui';
import { 
  MapPin, 
  DollarSign, 
  Star, 
  Calendar, 
  Filter,
  X,
  ChevronDown,
  ChevronUp,
  Search,
  Loader2
} from 'lucide-react';
import { getServiceCategories } from '@/lib/search';
import type { SearchFilters } from '@/types';

interface FilterPanelProps {
  filters: SearchFilters;
  onFiltersChange: (filters: SearchFilters) => void;
  onClearFilters: () => void;
  isLoading?: boolean;
  className?: string;
}

interface FilterSection {
  id: string;
  title: string;
  icon: React.ReactNode;
  isExpanded: boolean;
}

export default function FilterPanel({
  filters,
  onFiltersChange,
  onClearFilters,
  isLoading = false,
  className = ''
}: FilterPanelProps) {
  const [localFilters, setLocalFilters] = useState<SearchFilters>(filters);
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 5000]);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [categoriesLoading, setCategoriesLoading] = useState(true);
  const [availabilityDate, setAvailabilityDate] = useState('');
  const [locationInput, setLocationInput] = useState('');
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    location: true,
    category: true,
    price: true,
    rating: true,
    availability: false
  });

  // Initialize local state from props
  useEffect(() => {
    setLocalFilters(filters);
    if (filters.priceRange) {
      setPriceRange(filters.priceRange);
    }
    if (filters.category) {
      setSelectedCategories([filters.category]);
    }
    if (filters.serviceType) {
      setSelectedCategories(filters.serviceType);
    }
    if (filters.location) {
      setLocationInput(filters.location);
    }
  }, [filters]);

  // Load categories from database
  useEffect(() => {
    const loadCategories = async () => {
      try {
        setCategoriesLoading(true);
        const loadedCategories = await getServiceCategories();
        setCategories(loadedCategories);
      } catch (error) {
        console.error('Failed to load categories:', error);
        setCategories([]);
      } finally {
        setCategoriesLoading(false);
      }
    };

    loadCategories();
  }, []);

  // Debounced filter updates for better performance
  const debouncedUpdateFilters = useCallback(
    useMemo(() => {
      let timeoutId: NodeJS.Timeout;
      return (newFilters: Partial<SearchFilters>) => {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => {
          const updated = { ...localFilters, ...newFilters };
          setLocalFilters(updated);
          onFiltersChange(updated);
        }, 300);
      };
    }, [localFilters, onFiltersChange]),
    [localFilters, onFiltersChange]
  );

  const toggleSection = useCallback((sectionId: string) => {
    setExpandedSections(prev => ({
      ...prev,
      [sectionId]: !prev[sectionId]
    }));
  }, []);

  const updateFilters = useCallback((newFilters: Partial<SearchFilters>) => {
    const updated = { ...localFilters, ...newFilters };
    setLocalFilters(updated);
    onFiltersChange(updated);
  }, [localFilters, onFiltersChange]);

  const handleLocationChange = useCallback((location: string) => {
    setLocationInput(location);
    debouncedUpdateFilters({ location: location.trim() || undefined });
  }, [debouncedUpdateFilters]);

  const handleLocationSelect = useCallback((location: string) => {
    setLocationInput(location);
    updateFilters({ location: location.trim() || undefined });
  }, [updateFilters]);

  const handleCategoryToggle = (categoryId: string) => {
    const newCategories = selectedCategories.includes(categoryId)
      ? selectedCategories.filter(id => id !== categoryId)
      : [...selectedCategories, categoryId];
    
    setSelectedCategories(newCategories);
    updateFilters({ 
      serviceType: newCategories.length > 0 ? newCategories : undefined,
      category: newCategories.length === 1 ? newCategories[0] : undefined
    });
  };

  const handlePriceRangeChange = (values: number[]) => {
    const range: [number, number] = [values[0], values[1]];
    setPriceRange(range);
    updateFilters({ priceRange: range });
  };

  const handleRatingChange = (rating: number) => {
    updateFilters({ rating: rating === localFilters.rating ? undefined : rating });
  };

  const handleAvailabilityChange = (date: string) => {
    setAvailabilityDate(date);
    if (date) {
      const selectedDate = new Date(date);
      updateFilters({
        availability: {
          startDate: selectedDate,
          endDate: selectedDate
        }
      });
    } else {
      updateFilters({ availability: undefined });
    }
  };

  const getActiveFiltersCount = () => {
    let count = 0;
    if (localFilters.location) count++;
    if (localFilters.category || (localFilters.serviceType && localFilters.serviceType.length > 0)) count++;
    if (localFilters.priceRange) count++;
    if (localFilters.rating) count++;
    if (localFilters.availability) count++;
    return count;
  };

  const clearAllFilters = () => {
    setLocalFilters({});
    setPriceRange([0, 5000]);
    setSelectedCategories([]);
    setAvailabilityDate('');
    onClearFilters();
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-TN', {
      style: 'currency',
      currency: 'TND',
      minimumFractionDigits: 0,
    }).format(price);
  };

  const FilterSectionHeader = ({ 
    section, 
    children 
  }: { 
    section: { id: string; title: string; icon: React.ReactNode }; 
    children: React.ReactNode;
  }) => (
    <div className="space-y-3">
      <button
        onClick={() => toggleSection(section.id)}
        className="flex items-center justify-between w-full text-left"
      >
        <div className="flex items-center gap-2">
          {section.icon}
          <span className="font-medium text-gray-900">{section.title}</span>
        </div>
        {expandedSections[section.id] ? (
          <ChevronUp className="h-4 w-4 text-gray-500" />
        ) : (
          <ChevronDown className="h-4 w-4 text-gray-500" />
        )}
      </button>
      {expandedSections[section.id] && (
        <div className="space-y-3">
          {children}
        </div>
      )}
    </div>
  );

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Filter Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Filter className="h-5 w-5 text-gray-600" />
          <h2 className="text-lg font-semibold text-gray-900">Filters</h2>
          {getActiveFiltersCount() > 0 && (
            <Badge variant="secondary" className="text-xs">
              {getActiveFiltersCount()}
            </Badge>
          )}
        </div>
        {getActiveFiltersCount() > 0 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={clearAllFilters}
            className="text-sm text-gray-600 hover:text-gray-900"
          >
            Clear All
          </Button>
        )}
      </div>

      {/* Active Filters */}
      {getActiveFiltersCount() > 0 && (
        <Card className="p-4">
          <h3 className="font-medium text-gray-900 mb-3">Active Filters</h3>
          <div className="flex flex-wrap gap-2">
            {localFilters.location && (
              <Badge variant="secondary" className="flex items-center gap-1">
                <MapPin className="h-3 w-3" />
                {localFilters.location}
                <button
                  onClick={() => handleLocationChange('')}
                  className="ml-1 hover:bg-gray-300 rounded-full p-0.5"
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            )}
            {selectedCategories.map(categoryId => {
              const category = categories.find(c => c.id === categoryId);
              return category ? (
                <Badge key={categoryId} variant="secondary" className="flex items-center gap-1">
                  {category.icon} {category.name}
                  <button
                    onClick={() => handleCategoryToggle(categoryId)}
                    className="ml-1 hover:bg-gray-300 rounded-full p-0.5"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ) : null;
            })}
            {localFilters.priceRange && (
              <Badge variant="secondary" className="flex items-center gap-1">
                <DollarSign className="h-3 w-3" />
                {formatPrice(localFilters.priceRange[0])} - {formatPrice(localFilters.priceRange[1])}
                <button
                  onClick={() => handlePriceRangeChange([0, 5000])}
                  className="ml-1 hover:bg-gray-300 rounded-full p-0.5"
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            )}
            {localFilters.rating && (
              <Badge variant="secondary" className="flex items-center gap-1">
                <Star className="h-3 w-3" />
                {localFilters.rating}+ stars
                <button
                  onClick={() => handleRatingChange(localFilters.rating!)}
                  className="ml-1 hover:bg-gray-300 rounded-full p-0.5"
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            )}
            {localFilters.availability && (
              <Badge variant="secondary" className="flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                Available on {availabilityDate}
                <button
                  onClick={() => handleAvailabilityChange('')}
                  className="ml-1 hover:bg-gray-300 rounded-full p-0.5"
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            )}
          </div>
        </Card>
      )}

      {/* Location Filter */}
      <Card className="p-4">
        <FilterSectionHeader 
          section={{ id: 'location', title: 'Location', icon: <MapPin className="h-4 w-4 text-gray-600" /> }}
        >
          <div className="space-y-2">
            <Label htmlFor="location-input">City or Area</Label>
            <Input
              id="location-input"
              type="text"
              placeholder="Enter location..."
              value={locationInput}
              onChange={(e) => handleLocationChange(e.target.value)}
              className="w-full"
            />
            <div className="flex flex-wrap gap-2 mt-2">
              {['Tunis', 'Sfax', 'Sousse', 'Monastir', 'Bizerte'].map(city => (
                <Button
                  key={city}
                  variant={localFilters.location === city ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => handleLocationSelect(city)}
                  className="text-xs"
                >
                  {city}
                </Button>
              ))}
            </div>
          </div>
        </FilterSectionHeader>
      </Card>

      {/* Category Filter */}
      <Card className="p-4">
        <FilterSectionHeader 
          section={{ id: 'category', title: 'Service Categories', icon: <Filter className="h-4 w-4 text-gray-600" /> }}
        >
          <div className="space-y-2">
            {categoriesLoading ? (
              <div className="flex items-center justify-center py-4">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span className="ml-2 text-sm text-gray-500">Loading categories...</span>
              </div>
            ) : categories.length === 0 ? (
              <div className="text-center py-6">
                <div className="text-gray-400 mb-2">
                  <Filter className="w-8 h-8 mx-auto" />
                </div>
                <p className="text-sm text-gray-500">No categories available</p>
                <p className="text-xs text-gray-400 mt-1">Categories are being set up</p>
              </div>
            ) : (
              categories.map(category => (
                <div key={category.id} className="flex items-center space-x-2">
                  <Checkbox
                    id={`category-${category.id}`}
                    checked={selectedCategories.includes(category.id)}
                    onCheckedChange={() => handleCategoryToggle(category.id)}
                  />
                  <Label 
                    htmlFor={`category-${category.id}`}
                    className="flex items-center gap-2 cursor-pointer"
                  >
                    <span>{category.icon}</span>
                    <span className="text-sm">{category.name}</span>
                  </Label>
                </div>
              ))
            )}
          </div>
        </FilterSectionHeader>
      </Card>

      {/* Price Range Filter */}
      <Card className="p-4">
        <FilterSectionHeader 
          section={{ id: 'price', title: 'Price Range', icon: <DollarSign className="h-4 w-4 text-gray-600" /> }}
        >
          <div className="space-y-4">
            <div className="px-2">
              <Slider
                value={priceRange}
                onValueChange={handlePriceRangeChange}
                max={5000}
                min={0}
                step={50}
                className="w-full"
              />
            </div>
            <div className="flex items-center justify-between text-sm text-gray-600">
              <span>{formatPrice(priceRange[0])}</span>
              <span>{formatPrice(priceRange[1])}</span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label htmlFor="min-price" className="text-xs">Min Price</Label>
                <Input
                  id="min-price"
                  type="number"
                  value={priceRange[0]}
                  onChange={(e) => {
                    const value = parseInt(e.target.value) || 0;
                    handlePriceRangeChange([value, priceRange[1]]);
                  }}
                  className="text-sm"
                />
              </div>
              <div>
                <Label htmlFor="max-price" className="text-xs">Max Price</Label>
                <Input
                  id="max-price"
                  type="number"
                  value={priceRange[1]}
                  onChange={(e) => {
                    const value = parseInt(e.target.value) || 5000;
                    handlePriceRangeChange([priceRange[0], value]);
                  }}
                  className="text-sm"
                />
              </div>
            </div>
          </div>
        </FilterSectionHeader>
      </Card>

      {/* Rating Filter */}
      <Card className="p-4">
        <FilterSectionHeader 
          section={{ id: 'rating', title: 'Minimum Rating', icon: <Star className="h-4 w-4 text-gray-600" /> }}
        >
          <div className="space-y-2">
            {[4.5, 4.0, 3.5, 3.0].map(rating => (
              <div key={rating} className="flex items-center space-x-2">
                <Checkbox
                  id={`rating-${rating}`}
                  checked={localFilters.rating === rating}
                  onCheckedChange={() => handleRatingChange(rating)}
                />
                <Label 
                  htmlFor={`rating-${rating}`}
                  className="flex items-center gap-1 cursor-pointer"
                >
                  <div className="flex items-center">
                    {Array.from({ length: 5 }, (_, i) => (
                      <Star
                        key={i}
                        className={`h-3 w-3 ${
                          i < Math.floor(rating) 
                            ? 'fill-yellow-400 text-yellow-400' 
                            : 'text-gray-300'
                        }`}
                      />
                    ))}
                  </div>
                  <span className="text-sm">{rating} & up</span>
                </Label>
              </div>
            ))}
          </div>
        </FilterSectionHeader>
      </Card>

      {/* Availability Filter */}
      <Card className="p-4">
        <FilterSectionHeader 
          section={{ id: 'availability', title: 'Availability', icon: <Calendar className="h-4 w-4 text-gray-600" /> }}
        >
          <div className="space-y-2">
            <Label htmlFor="availability-date">Available on Date</Label>
            <Input
              id="availability-date"
              type="date"
              value={availabilityDate}
              onChange={(e) => handleAvailabilityChange(e.target.value)}
              min={new Date().toISOString().split('T')[0]}
              className="w-full"
            />
            {availabilityDate && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleAvailabilityChange('')}
                className="w-full text-xs"
              >
                Clear Date Filter
              </Button>
            )}
          </div>
        </FilterSectionHeader>
      </Card>

      {/* Quick Filters */}
      <Card className="p-4">
        <h3 className="font-medium text-gray-900 mb-3">Quick Filters</h3>
        <div className="space-y-2">
          <Button
            variant={localFilters.rating === 4.5 ? 'default' : 'outline'}
            size="sm"
            onClick={() => handleRatingChange(4.5)}
            className="w-full justify-start"
            disabled={isLoading}
          >
            <Star className="h-4 w-4 mr-2" />
            Highly Rated (4.5+)
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setPriceRange([0, 1000]);
              handlePriceRangeChange([0, 1000]);
            }}
            className="w-full justify-start"
            disabled={isLoading}
          >
            <DollarSign className="h-4 w-4 mr-2" />
            Budget Friendly
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleLocationChange('Tunis')}
            className="w-full justify-start"
            disabled={isLoading}
          >
            <MapPin className="h-4 w-4 mr-2" />
            Near Tunis
          </Button>
        </div>
      </Card>
    </div>
  );
}