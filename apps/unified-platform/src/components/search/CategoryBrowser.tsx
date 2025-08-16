'use client';

import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui';
import { Button } from '@/components/ui';
import { Loader2 } from 'lucide-react';
import type { SearchFilters } from '@/types';
import { logger } from '@/lib/production-logger';

interface Category {
  id: string;
  name: string;
  slug: string;
  icon?: string;
  description?: string;
  isActive: boolean;
  sortOrder: number;
}

interface CategoryBrowserProps {
  onCategorySelect: (category: string) => void;
  selectedCategory?: string;
  showAll?: boolean;
}

export default function CategoryBrowser({
  onCategorySelect,
  selectedCategory,
  showAll = false
}: CategoryBrowserProps) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadCategories = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const response = await fetch('/api/categories');
        if (!response.ok) {
          throw new Error('Failed to fetch categories');
        }
        
        const data = await response.json();
        if (!data.success) {
          throw new Error(data.error || 'Failed to load categories');
        }
        
        const loadedCategories = showAll 
          ? data.categories 
          : data.categories.slice(0, 6); // Show first 6 for trending
          
        setCategories(loadedCategories);
      } catch (error) {
        logger.error('Failed to load categories:', error);
        setError(error instanceof Error ? error.message : 'Failed to load categories');
        setCategories([]);
      } finally {
        setLoading(false);
      }
    };

    loadCategories();
  }, [showAll]);

  return (
    <div className="w-full">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Browse by Category
        </h2>
        <p className="text-gray-600">
          Find the perfect services for your event
        </p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin" />
          <span className="ml-3 text-gray-500">Loading categories...</span>
        </div>
      ) : error ? (
        <div className="text-center py-12">
          <div className="text-red-400 mb-4">
            <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">Failed to load categories</h3>
          <p className="text-gray-500 mb-4">{error}</p>
          <Button 
            variant="outline" 
            onClick={() => window.location.reload()}
            className="px-4 py-2"
          >
            Try Again
          </Button>
        </div>
      ) : categories.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-gray-400 mb-4">
            <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No categories available</h3>
          <p className="text-gray-500">Categories are being set up. Please check back later.</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {categories.map((category) => (
            <Card
              key={category.id}
              className={`p-6 cursor-pointer transition-all duration-200 hover:shadow-lg hover:scale-105 border-2 ${
                selectedCategory === category.slug
                  ? 'border-primary bg-primary/5'
                  : 'border-gray-200 hover:border-primary/50'
              }`}
              onClick={() => onCategorySelect(category.slug)}
            >
              <div className="text-center space-y-3">
                <div className="text-4xl mb-2">{category.icon || '📋'}</div>
                <h3 className="font-semibold text-gray-900 text-sm">
                  {category.name}
                </h3>
                {category.description && (
                  <p className="text-xs text-gray-500 line-clamp-2">
                    {category.description}
                  </p>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}

      {!showAll && (
        <div className="text-center mt-8">
          <Button
            variant="outline"
            onClick={() => onCategorySelect('all')}
            className="px-8 py-2"
          >
            View All Categories
          </Button>
        </div>
      )}
    </div>
  );
}