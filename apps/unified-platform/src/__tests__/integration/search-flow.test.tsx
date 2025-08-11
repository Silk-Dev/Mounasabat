import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import { BrowserRouter } from 'react-router-dom';

// Mock Next.js router
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    prefetch: jest.fn(),
  }),
  useSearchParams: () => new URLSearchParams(),
  usePathname: () => '/search',
}));

// Mock API responses
global.fetch = jest.fn();

const mockSearchResults = [
  {
    id: 'service-1',
    name: 'Wedding Photography Package',
    description: 'Professional wedding photography',
    category: 'Photography',
    basePrice: 1500,
    rating: 4.8,
    reviewCount: 25,
    provider: {
      id: 'provider-1',
      businessName: 'Amazing Photos',
      isVerified: true,
      location: { city: 'New York' },
    },
    images: ['photo1.jpg'],
  },
  {
    id: 'service-2',
    name: 'Grand Ballroom Venue',
    description: 'Elegant wedding venue',
    category: 'Venues',
    basePrice: 2500,
    rating: 4.9,
    reviewCount: 15,
    provider: {
      id: 'provider-2',
      businessName: 'Grand Events',
      isVerified: true,
      location: { city: 'New York' },
    },
    images: ['venue1.jpg'],
  },
];

const mockCategories = [
  { id: 'photography', name: 'Photography', count: 150 },
  { id: 'venues', name: 'Venues', count: 85 },
  { id: 'catering', name: 'Catering', count: 120 },
];

// Mock components
jest.mock('../../components/search/SearchBar', () => ({
  SearchBar: ({ onSearch, onLocationChange }: any) => (
    <div data-testid="search-bar">
      <input 
        data-testid="search-input"
        placeholder="Search for venues, catering, photography..."
        onChange={(e) => onSearch({ query: e.target.value, location: '' })}
      />
      <input 
        data-testid="location-input"
        placeholder="Location"
        onChange={(e) => onLocationChange(e.target.value)}
      />
      <button data-testid="search-button" onClick={() => onSearch({ query: 'wedding', location: 'New York' })}>
        Search
      </button>
    </div>
  ),
}));

jest.mock('../../components/search/FilterPanel', () => ({
  FilterPanel: ({ onFiltersChange }: any) => (
    <div data-testid="filter-panel">
      <h3>Filters</h3>
      <button 
        data-testid="category-photography"
        onClick={() => onFiltersChange({ category: 'Photography' })}
      >
        Photography
      </button>
      <button 
        data-testid="category-venues"
        onClick={() => onFiltersChange({ category: 'Venues' })}
      >
        Venues
      </button>
      <input 
        data-testid="price-min"
        placeholder="Min price"
        onChange={(e) => onFiltersChange({ priceMin: parseInt(e.target.value) })}
      />
      <input 
        data-testid="price-max"
        placeholder="Max price"
        onChange={(e) => onFiltersChange({ priceMax: parseInt(e.target.value) })}
      />
      <button data-testid="apply-filters">Apply Filters</button>
    </div>
  ),
}));

jest.mock('../../components/search/SearchResults', () => ({
  SearchResults: ({ results, loading, onServiceClick }: any) => (
    <div data-testid="search-results">
      {loading && <div data-testid="loading">Loading...</div>}
      {results.map((result: any) => (
        <div 
          key={result.id} 
          data-testid="service-card"
          onClick={() => onServiceClick(result)}
        >
          <h3>{result.name}</h3>
          <p>{result.provider.businessName}</p>
          <span data-testid="service-price">${result.basePrice}</span>
          <span data-testid="service-rating">{result.rating}</span>
        </div>
      ))}
      {results.length === 0 && !loading && (
        <div data-testid="no-results">No results found</div>
      )}
    </div>
  ),
}));

// Mock search page component
const SearchPage = () => {
  const [results, setResults] = React.useState([]);
  const [loading, setLoading] = React.useState(false);
  const [filters, setFilters] = React.useState({});
  const [query, setQuery] = React.useState('');

  const handleSearch = async (searchParams: any) => {
    setLoading(true);
    setQuery(searchParams.query);
    
    try {
      const response = await fetch('/api/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...searchParams, ...filters }),
      });
      
      const data = await response.json();
      setResults(data.results || []);
    } catch (error) {
      console.error('Search failed:', error);
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  const handleFiltersChange = (newFilters: any) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
  };

  const handleServiceClick = (service: any) => {
    // Navigate to service detail page
    console.log('Navigate to service:', service.id);
  };

  return (
    <div data-testid="search-page">
      <SearchBar onSearch={handleSearch} onLocationChange={() => {}} />
      <FilterPanel onFiltersChange={handleFiltersChange} />
      <SearchResults 
        results={results} 
        loading={loading} 
        onServiceClick={handleServiceClick}
      />
    </div>
  );
};

describe('Search Flow Integration', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Default successful API response
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({
        results: mockSearchResults,
        total: mockSearchResults.length,
        categories: mockCategories,
      }),
    });
  });

  it('performs complete search flow', async () => {
    const user = userEvent.setup();
    
    render(
      <BrowserRouter>
        <SearchPage />
      </BrowserRouter>
    );

    // Initial state - no results
    expect(screen.getByTestId('search-results')).toBeInTheDocument();
    expect(screen.queryByTestId('service-card')).not.toBeInTheDocument();

    // Perform search
    const searchButton = screen.getByTestId('search-button');
    await user.click(searchButton);

    // Should show loading state
    expect(screen.getByTestId('loading')).toBeInTheDocument();

    // Wait for results
    await waitFor(() => {
      expect(screen.queryByTestId('loading')).not.toBeInTheDocument();
    });

    // Should display search results
    expect(screen.getByText('Wedding Photography Package')).toBeInTheDocument();
    expect(screen.getByText('Grand Ballroom Venue')).toBeInTheDocument();
    expect(screen.getByText('Amazing Photos')).toBeInTheDocument();
    expect(screen.getByText('Grand Events')).toBeInTheDocument();

    // Check API was called correctly
    expect(global.fetch).toHaveBeenCalledWith('/api/search', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query: 'wedding', location: 'New York' }),
    });
  });

  it('applies filters and updates results', async () => {
    const user = userEvent.setup();
    
    // Mock filtered results
    const filteredResults = [mockSearchResults[0]]; // Only photography
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({
        results: filteredResults,
        total: filteredResults.length,
      }),
    });

    render(
      <BrowserRouter>
        <SearchPage />
      </BrowserRouter>
    );

    // First perform a search
    await user.click(screen.getByTestId('search-button'));
    
    await waitFor(() => {
      expect(screen.getByText('Wedding Photography Package')).toBeInTheDocument();
      expect(screen.getByText('Grand Ballroom Venue')).toBeInTheDocument();
    });

    // Apply category filter
    await user.click(screen.getByTestId('category-photography'));
    
    // Perform search again with filters
    await user.click(screen.getByTestId('search-button'));

    await waitFor(() => {
      expect(screen.getByText('Wedding Photography Package')).toBeInTheDocument();
      expect(screen.queryByText('Grand Ballroom Venue')).not.toBeInTheDocument();
    });

    // Check API was called with filters
    expect(global.fetch).toHaveBeenLastCalledWith('/api/search', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        query: 'wedding', 
        location: 'New York',
        category: 'Photography'
      }),
    });
  });

  it('applies price range filters', async () => {
    const user = userEvent.setup();
    
    render(
      <BrowserRouter>
        <SearchPage />
      </BrowserRouter>
    );

    // Set price range
    await user.type(screen.getByTestId('price-min'), '1000');
    await user.type(screen.getByTestId('price-max'), '2000');
    
    // Perform search
    await user.click(screen.getByTestId('search-button'));

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith('/api/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          query: 'wedding', 
          location: 'New York',
          priceMin: 1000,
          priceMax: 2000
        }),
      });
    });
  });

  it('handles search with no results', async () => {
    const user = userEvent.setup();
    
    // Mock empty results
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({
        results: [],
        total: 0,
      }),
    });

    render(
      <BrowserRouter>
        <SearchPage />
      </BrowserRouter>
    );

    // Perform search
    await user.click(screen.getByTestId('search-button'));

    await waitFor(() => {
      expect(screen.getByTestId('no-results')).toBeInTheDocument();
      expect(screen.getByText('No results found')).toBeInTheDocument();
    });
  });

  it('handles API errors gracefully', async () => {
    const user = userEvent.setup();
    
    // Mock API error
    (global.fetch as jest.Mock).mockRejectedValue(new Error('API Error'));

    render(
      <BrowserRouter>
        <SearchPage />
      </BrowserRouter>
    );

    // Perform search
    await user.click(screen.getByTestId('search-button'));

    await waitFor(() => {
      expect(screen.getByTestId('no-results')).toBeInTheDocument();
    });
  });

  it('navigates to service detail when service is clicked', async () => {
    const user = userEvent.setup();
    const consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {});

    render(
      <BrowserRouter>
        <SearchPage />
      </BrowserRouter>
    );

    // Perform search first
    await user.click(screen.getByTestId('search-button'));

    await waitFor(() => {
      expect(screen.getByText('Wedding Photography Package')).toBeInTheDocument();
    });

    // Click on service card
    const serviceCard = screen.getAllByTestId('service-card')[0];
    await user.click(serviceCard);

    expect(consoleSpy).toHaveBeenCalledWith('Navigate to service:', 'service-1');
    
    consoleSpy.mockRestore();
  });

  it('maintains search state across filter changes', async () => {
    const user = userEvent.setup();
    
    render(
      <BrowserRouter>
        <SearchPage />
      </BrowserRouter>
    );

    // Perform initial search
    await user.click(screen.getByTestId('search-button'));

    await waitFor(() => {
      expect(screen.getByText('Wedding Photography Package')).toBeInTheDocument();
    });

    // Apply filter
    await user.click(screen.getByTestId('category-photography'));
    
    // Search again - should maintain previous query
    await user.click(screen.getByTestId('search-button'));

    expect(global.fetch).toHaveBeenLastCalledWith('/api/search', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        query: 'wedding', 
        location: 'New York',
        category: 'Photography'
      }),
    });
  });

  it('displays service information correctly', async () => {
    const user = userEvent.setup();
    
    render(
      <BrowserRouter>
        <SearchPage />
      </BrowserRouter>
    );

    await user.click(screen.getByTestId('search-button'));

    await waitFor(() => {
      // Check service names
      expect(screen.getByText('Wedding Photography Package')).toBeInTheDocument();
      expect(screen.getByText('Grand Ballroom Venue')).toBeInTheDocument();
      
      // Check provider names
      expect(screen.getByText('Amazing Photos')).toBeInTheDocument();
      expect(screen.getByText('Grand Events')).toBeInTheDocument();
      
      // Check prices
      const priceElements = screen.getAllByTestId('service-price');
      expect(priceElements[0]).toHaveTextContent('$1500');
      expect(priceElements[1]).toHaveTextContent('$2500');
      
      // Check ratings
      const ratingElements = screen.getAllByTestId('service-rating');
      expect(ratingElements[0]).toHaveTextContent('4.8');
      expect(ratingElements[1]).toHaveTextContent('4.9');
    });
  });

  it('handles multiple filter combinations', async () => {
    const user = userEvent.setup();
    
    render(
      <BrowserRouter>
        <SearchPage />
      </BrowserRouter>
    );

    // Apply multiple filters
    await user.click(screen.getByTestId('category-photography'));
    await user.type(screen.getByTestId('price-min'), '1000');
    await user.type(screen.getByTestId('price-max'), '2000');
    
    // Perform search
    await user.click(screen.getByTestId('search-button'));

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith('/api/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          query: 'wedding', 
          location: 'New York',
          category: 'Photography',
          priceMin: 1000,
          priceMax: 2000
        }),
      });
    });
  });
});