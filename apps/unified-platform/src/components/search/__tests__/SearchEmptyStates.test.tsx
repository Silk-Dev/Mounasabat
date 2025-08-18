import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import {
  SearchInitialState,
  SearchNoResultsState,
  SearchLoadingState,
  SearchErrorState,
  SearchNetworkErrorState
} from '../SearchEmptyStates';
import type { SearchFilters } from '@/types';

describe('SearchEmptyStates', () => {
  describe('SearchInitialState', () => {
    it('renders initial search state correctly', () => {
      render(<SearchInitialState />);
      
      expect(screen.getByText('Start your search')).toBeInTheDocument();
      expect(screen.getByText(/Use the search bar above to find the perfect services/)).toBeInTheDocument();
      expect(screen.getByText('Popular searches:')).toBeInTheDocument();
    });
  });

  describe('SearchNoResultsState', () => {
    it('renders no results state without filters', () => {
      const filters: SearchFilters = {};
      render(<SearchNoResultsState filters={filters} />);
      
      expect(screen.getByText('No services available')).toBeInTheDocument();
      expect(screen.getByText(/There are currently no services available/)).toBeInTheDocument();
    });

    it('renders no results state with filters', () => {
      const filters: SearchFilters = { query: 'wedding', location: 'Tunis' };
      const mockClearFilters = jest.fn();
      
      render(
        <SearchNoResultsState 
          filters={filters} 
          onClearFilters={mockClearFilters} 
        />
      );
      
      expect(screen.getByText('No results found')).toBeInTheDocument();
      expect(screen.getByText(/We couldn't find any services matching your criteria/)).toBeInTheDocument();
      
      const clearButton = screen.getByText('Clear All Filters');
      expect(clearButton).toBeInTheDocument();
      
      fireEvent.click(clearButton);
      expect(mockClearFilters).toHaveBeenCalled();
    });

    it('shows suggestions when filters are applied', () => {
      const filters: SearchFilters = { query: 'wedding', rating: 4.5 };
      
      render(<SearchNoResultsState filters={filters} />);
      
      expect(screen.getByText('Try these suggestions:')).toBeInTheDocument();
      expect(screen.getByText('Expand your location search area')).toBeInTheDocument();
      expect(screen.getByText('Lower the minimum rating requirement')).toBeInTheDocument();
    });
  });

  describe('SearchLoadingState', () => {
    it('renders loading state with default message', () => {
      render(<SearchLoadingState />);
      
      expect(screen.getByText('Searching for services...')).toBeInTheDocument();
      expect(screen.getByText(/Please wait while we find the best matches/)).toBeInTheDocument();
    });

    it('renders loading state with custom message', () => {
      render(<SearchLoadingState message="Finding perfect venues..." />);
      
      expect(screen.getByText('Finding perfect venues...')).toBeInTheDocument();
    });
  });

  describe('SearchErrorState', () => {
    it('renders error state correctly', () => {
      const mockRetry = jest.fn();
      const error = 'Database connection failed';
      
      render(<SearchErrorState error={error} onRetry={mockRetry} />);
      
      expect(screen.getByText('Search failed')).toBeInTheDocument();
      expect(screen.getByText(/We encountered an error while searching: Database connection failed/)).toBeInTheDocument();
      
      const retryButton = screen.getByText('Try Again');
      expect(retryButton).toBeInTheDocument();
      
      fireEvent.click(retryButton);
      expect(mockRetry).toHaveBeenCalled();
    });

    it('renders refresh page button', () => {
      render(<SearchErrorState error="Test error" />);
      
      expect(screen.getByText('Refresh Page')).toBeInTheDocument();
    });
  });

  describe('SearchNetworkErrorState', () => {
    it('renders network error state correctly', () => {
      const mockRetry = jest.fn();
      
      render(<SearchNetworkErrorState onRetry={mockRetry} />);
      
      expect(screen.getByText('Connection problem')).toBeInTheDocument();
      expect(screen.getByText(/We're having trouble connecting to our servers/)).toBeInTheDocument();
      
      const retryButton = screen.getByText('Try Again');
      fireEvent.click(retryButton);
      expect(mockRetry).toHaveBeenCalled();
    });
  });
});