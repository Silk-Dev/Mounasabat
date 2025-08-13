'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui';
import { TrendingUp, Loader2, RefreshCw } from 'lucide-react';

interface PopularSearchesProps {
  onSearchSelect: (query: string) => void;
}

export default function PopularSearches({ onSearchSelect }: PopularSearchesProps) {
  const [popularSearches, setPopularSearches] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadPopularSearches = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Use the dedicated popular searches API
      const response = await fetch('/api/search/popular?limit=8');
      if (!response.ok) {
        throw new Error('Failed to fetch popular searches');
      }
      
      const data = await response.json();
      if (!data.success) {
        throw new Error(data.error || 'Failed to load popular searches');
      }
      
      setPopularSearches(data.searches || []);
    } catch (error) {
      console.error('Failed to load popular searches:', error);
      setError(error instanceof Error ? error.message : 'Failed to load popular searches');
      setPopularSearches([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPopularSearches();
  }, []);

  return (
    <div className="w-full">
      <div className="flex items-center gap-2 mb-4">
        <TrendingUp className="h-5 w-5 text-primary" />
        <h3 className="text-lg font-semibold text-gray-900">
          Popular Searches
        </h3>
      </div>

      {loading ? (
        <div className="flex items-center gap-2">
          <Loader2 className="h-4 w-4 animate-spin" />
          <span className="text-sm text-gray-500">Loading popular searches...</span>
        </div>
      ) : error ? (
        <div className="flex items-center gap-2">
          <div className="text-sm text-red-500">{error}</div>
          <Button
            variant="ghost"
            size="sm"
            onClick={loadPopularSearches}
            className="h-6 w-6 p-0"
          >
            <RefreshCw className="h-3 w-3" />
          </Button>
        </div>
      ) : popularSearches.length === 0 ? (
        <div className="text-sm text-gray-500">
          No popular searches available yet. Start searching to see trending queries!
        </div>
      ) : (
        <div className="flex flex-wrap gap-2">
          {popularSearches.map((search, index) => (
            <Button
              key={index}
              variant="outline"
              size="sm"
              onClick={() => onSearchSelect(search)}
              className="text-sm hover:bg-primary hover:text-white transition-colors"
            >
              {search}
            </Button>
          ))}
        </div>
      )}
    </div>
  );
}