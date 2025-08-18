import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import { SearchBar } from '../SearchBar';

// Mock debounce to make tests synchronous
jest.mock('lodash.debounce', () => (fn: any) => fn);

// Mock geolocation
const mockGeolocation = {
  getCurrentPosition: jest.fn(),
  watchPosition: jest.fn(),
  clearWatch: jest.fn(),
};

Object.defineProperty(global.navigator, 'geolocation', {
  value: mockGeolocation,
  writable: true,
});

describe('SearchBar', () => {
  const mockOnSearch = jest.fn();
  const mockOnLocationChange = jest.fn();
  const mockOnSuggestionSelect = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    global.fetch = jest.fn();
  });

  const defaultProps = {
    onSearch: mockOnSearch,
    onLocationChange: mockOnLocationChange,
    onSuggestionSelect: mockOnSuggestionSelect,
    placeholder: 'Search for venues, catering, photography...',
    locationPlaceholder: 'Location',
  };

  it('renders search input and location input', () => {
    render(<SearchBar {...defaultProps} />);
    
    expect(screen.getByPlaceholderText('Search for venues, catering, photography...')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Location')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /search/i })).toBeInTheDocument();
  });

  it('calls onSearch when search button is clicked', async () => {
    const user = userEvent.setup();
    render(<SearchBar {...defaultProps} />);
    
    const searchInput = screen.getByPlaceholderText('Search for venues, catering, photography...');
    const locationInput = screen.getByPlaceholderText('Location');
    const searchButton = screen.getByRole('button', { name: /search/i });
    
    await user.type(searchInput, 'wedding photography');
    await user.type(locationInput, 'New York');
    await user.click(searchButton);
    
    expect(mockOnSearch).toHaveBeenCalledWith({
      query: 'wedding photography',
      location: 'New York',
    });
  });

  it('calls onSearch when Enter is pressed in search input', async () => {
    const user = userEvent.setup();
    render(<SearchBar {...defaultProps} />);
    
    const searchInput = screen.getByPlaceholderText('Search for venues, catering, photography...');
    
    await user.type(searchInput, 'wedding photography');
    await user.keyboard('{Enter}');
    
    expect(mockOnSearch).toHaveBeenCalledWith({
      query: 'wedding photography',
      location: '',
    });
  });

  it('shows search suggestions when typing', async () => {
    const user = userEvent.setup();
    const mockSuggestions = [
      { id: '1', text: 'wedding photography', type: 'service' },
      { id: '2', text: 'wedding venues', type: 'service' },
      { id: '3', text: 'wedding catering', type: 'service' },
    ];

    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ suggestions: mockSuggestions }),
    });

    render(<SearchBar {...defaultProps} />);
    
    const searchInput = screen.getByPlaceholderText('Search for venues, catering, photography...');
    await user.type(searchInput, 'wedding');
    
    await waitFor(() => {
      expect(screen.getByText('wedding photography')).toBeInTheDocument();
      expect(screen.getByText('wedding venues')).toBeInTheDocument();
      expect(screen.getByText('wedding catering')).toBeInTheDocument();
    });
  });

  it('calls onSuggestionSelect when suggestion is clicked', async () => {
    const user = userEvent.setup();
    const mockSuggestions = [
      { id: '1', text: 'wedding photography', type: 'service' },
    ];

    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ suggestions: mockSuggestions }),
    });

    render(<SearchBar {...defaultProps} />);
    
    const searchInput = screen.getByPlaceholderText('Search for venues, catering, photography...');
    await user.type(searchInput, 'wedding');
    
    await waitFor(() => {
      expect(screen.getByText('wedding photography')).toBeInTheDocument();
    });
    
    await user.click(screen.getByText('wedding photography'));
    
    expect(mockOnSuggestionSelect).toHaveBeenCalledWith(mockSuggestions[0]);
  });

  it('handles location detection', async () => {
    const user = userEvent.setup();
    
    mockGeolocation.getCurrentPosition.mockImplementation((success) => {
      success({
        coords: {
          latitude: 40.7128,
          longitude: -74.0060,
        },
      });
    });

    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ 
        location: 'New York, NY',
        city: 'New York',
        state: 'NY',
      }),
    });

    render(<SearchBar {...defaultProps} />);
    
    const locationButton = screen.getByRole('button', { name: /detect location/i });
    await user.click(locationButton);
    
    await waitFor(() => {
      expect(mockOnLocationChange).toHaveBeenCalledWith('New York, NY');
    });
  });

  it('handles location detection error', async () => {
    const user = userEvent.setup();
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    
    mockGeolocation.getCurrentPosition.mockImplementation((success, error) => {
      error({ code: 1, message: 'Permission denied' });
    });

    render(<SearchBar {...defaultProps} />);
    
    const locationButton = screen.getByRole('button', { name: /detect location/i });
    await user.click(locationButton);
    
    await waitFor(() => {
      expect(consoleSpy).toHaveBeenCalledWith('Location detection failed:', expect.any(Object));
    });
    
    consoleSpy.mockRestore();
  });

  it('clears suggestions when input is cleared', async () => {
    const user = userEvent.setup();
    const mockSuggestions = [
      { id: '1', text: 'wedding photography', type: 'service' },
    ];

    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ suggestions: mockSuggestions }),
    });

    render(<SearchBar {...defaultProps} />);
    
    const searchInput = screen.getByPlaceholderText('Search for venues, catering, photography...');
    await user.type(searchInput, 'wedding');
    
    await waitFor(() => {
      expect(screen.getByText('wedding photography')).toBeInTheDocument();
    });
    
    await user.clear(searchInput);
    
    await waitFor(() => {
      expect(screen.queryByText('wedding photography')).not.toBeInTheDocument();
    });
  });

  it('handles API error for suggestions gracefully', async () => {
    const user = userEvent.setup();
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    
    (global.fetch as jest.Mock).mockRejectedValue(new Error('API Error'));

    render(<SearchBar {...defaultProps} />);
    
    const searchInput = screen.getByPlaceholderText('Search for venues, catering, photography...');
    await user.type(searchInput, 'wedding');
    
    await waitFor(() => {
      expect(consoleSpy).toHaveBeenCalledWith('Failed to fetch suggestions:', expect.any(Error));
    });
    
    consoleSpy.mockRestore();
  });

  it('shows loading state while fetching suggestions', async () => {
    const user = userEvent.setup();
    
    // Mock a delayed response
    (global.fetch as jest.Mock).mockImplementation(() => 
      new Promise(resolve => 
        setTimeout(() => resolve({
          ok: true,
          json: () => Promise.resolve({ suggestions: [] }),
        }), 100)
      )
    );

    render(<SearchBar {...defaultProps} />);
    
    const searchInput = screen.getByPlaceholderText('Search for venues, catering, photography...');
    await user.type(searchInput, 'wedding');
    
    expect(screen.getByText('Loading suggestions...')).toBeInTheDocument();
  });

  it('supports keyboard navigation in suggestions', async () => {
    const user = userEvent.setup();
    const mockSuggestions = [
      { id: '1', text: 'wedding photography', type: 'service' },
      { id: '2', text: 'wedding venues', type: 'service' },
    ];

    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ suggestions: mockSuggestions }),
    });

    render(<SearchBar {...defaultProps} />);
    
    const searchInput = screen.getByPlaceholderText('Search for venues, catering, photography...');
    await user.type(searchInput, 'wedding');
    
    await waitFor(() => {
      expect(screen.getByText('wedding photography')).toBeInTheDocument();
    });
    
    // Navigate down
    await user.keyboard('{ArrowDown}');
    expect(screen.getByText('wedding photography')).toHaveClass('highlighted');
    
    // Navigate down again
    await user.keyboard('{ArrowDown}');
    expect(screen.getByText('wedding venues')).toHaveClass('highlighted');
    
    // Select with Enter
    await user.keyboard('{Enter}');
    expect(mockOnSuggestionSelect).toHaveBeenCalledWith(mockSuggestions[1]);
  });

  it('closes suggestions when clicking outside', async () => {
    const user = userEvent.setup();
    const mockSuggestions = [
      { id: '1', text: 'wedding photography', type: 'service' },
    ];

    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ suggestions: mockSuggestions }),
    });

    render(
      <div>
        <SearchBar {...defaultProps} />
        <div data-testid="outside">Outside element</div>
      </div>
    );
    
    const searchInput = screen.getByPlaceholderText('Search for venues, catering, photography...');
    await user.type(searchInput, 'wedding');
    
    await waitFor(() => {
      expect(screen.getByText('wedding photography')).toBeInTheDocument();
    });
    
    await user.click(screen.getByTestId('outside'));
    
    await waitFor(() => {
      expect(screen.queryByText('wedding photography')).not.toBeInTheDocument();
    });
  });

  it('preserves input values when component re-renders', () => {
    const { rerender } = render(<SearchBar {...defaultProps} initialQuery="wedding" initialLocation="New York" />);
    
    expect(screen.getByDisplayValue('wedding')).toBeInTheDocument();
    expect(screen.getByDisplayValue('New York')).toBeInTheDocument();
    
    rerender(<SearchBar {...defaultProps} initialQuery="wedding" initialLocation="New York" />);
    
    expect(screen.getByDisplayValue('wedding')).toBeInTheDocument();
    expect(screen.getByDisplayValue('New York')).toBeInTheDocument();
  });

  it('handles special characters in search query', async () => {
    const user = userEvent.setup();
    render(<SearchBar {...defaultProps} />);
    
    const searchInput = screen.getByPlaceholderText('Search for venues, catering, photography...');
    const searchButton = screen.getByRole('button', { name: /search/i });
    
    await user.type(searchInput, 'café & restaurant');
    await user.click(searchButton);
    
    expect(mockOnSearch).toHaveBeenCalledWith({
      query: 'café & restaurant',
      location: '',
    });
  });
});