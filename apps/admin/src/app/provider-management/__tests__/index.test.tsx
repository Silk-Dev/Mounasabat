import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import ProviderManagementPage from '../index';

// Mock Next.js Link component
jest.mock('next/link', () => {
  return ({ children, href }: { children: React.ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  );
});

// Mock fetch globally
global.fetch = jest.fn();

const mockFetch = fetch as jest.MockedFunction<typeof fetch>;

describe('ProviderManagementPage', () => {
  beforeEach(() => {
    mockFetch.mockClear();
  });

  it('should display loading state initially', () => {
    mockFetch.mockImplementation(() => new Promise(() => {})); // Never resolves
    
    render(<ProviderManagementPage />);
    
    expect(screen.getByText('Loading providers...')).toBeInTheDocument();
  });

  it('should display providers when data is loaded successfully', async () => {
    const mockProviders = [
      {
        id: '1',
        name: 'Test Provider 1',
        description: 'Test description',
        isVerified: true,
        rating: 4.5,
        reviewCount: 10,
        services: ['Wedding Planning'],
        serviceOfferings: [
          { id: '1', name: 'Wedding Planning', category: 'Events' }
        ],
        user: {
          id: 'user1',
          name: 'John Doe',
          email: 'john@example.com'
        },
        _count: {
          serviceOfferings: 1,
          reviews: 10
        },
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z'
      }
    ];

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        success: true,
        providers: mockProviders,
        pagination: {
          page: 1,
          limit: 10,
          total: 1,
          totalPages: 1
        }
      })
    } as Response);

    render(<ProviderManagementPage />);

    await waitFor(() => {
      expect(screen.getByText('Test Provider 1')).toBeInTheDocument();
    });

    expect(screen.getByText('User: John Doe (john@example.com)')).toBeInTheDocument();
    expect(screen.getByText('Services: Wedding Planning')).toBeInTheDocument();
    expect(screen.getByText('Verified')).toBeInTheDocument();
    expect(screen.getByText('⭐ 4.5')).toBeInTheDocument();
    expect(screen.getByText('1 service')).toBeInTheDocument();
    expect(screen.getByText('10 reviews')).toBeInTheDocument();
  });

  it('should display empty state when no providers exist', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        success: true,
        providers: [],
        pagination: {
          page: 1,
          limit: 10,
          total: 0,
          totalPages: 0
        }
      })
    } as Response);

    render(<ProviderManagementPage />);

    await waitFor(() => {
      expect(screen.getByText('No providers found')).toBeInTheDocument();
    });

    expect(screen.getByText('No service providers have registered on the platform yet. Providers will appear here once they sign up.')).toBeInTheDocument();
  });

  it('should display empty state with search message when search returns no results', async () => {
    // First call for initial load
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        success: true,
        providers: [],
        pagination: {
          page: 1,
          limit: 10,
          total: 0,
          totalPages: 0
        }
      })
    } as Response);

    // Second call for search
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        success: true,
        providers: [],
        pagination: {
          page: 1,
          limit: 10,
          total: 0,
          totalPages: 0
        }
      })
    } as Response);

    render(<ProviderManagementPage />);

    // Wait for initial load
    await waitFor(() => {
      expect(screen.getByText('No providers found')).toBeInTheDocument();
    });

    // Perform search
    const searchInput = screen.getByPlaceholderText('Search by provider name, user name, or email...');
    const searchButton = screen.getByText('Search');

    fireEvent.change(searchInput, { target: { value: 'nonexistent' } });
    fireEvent.click(searchButton);

    await waitFor(() => {
      expect(screen.getByText('No providers match your search "nonexistent". Try adjusting your search terms.')).toBeInTheDocument();
    });

    expect(screen.getByText('Clear search')).toBeInTheDocument();
  });

  it('should display error state when API call fails', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 500,
      statusText: 'Internal Server Error'
    } as Response);

    render(<ProviderManagementPage />);

    await waitFor(() => {
      expect(screen.getByText('Failed to load providers')).toBeInTheDocument();
    });

    expect(screen.getByText('Failed to fetch providers: 500 Internal Server Error')).toBeInTheDocument();
    expect(screen.getByText('Try again')).toBeInTheDocument();
  });

  it('should display error state when API returns error response', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        success: false,
        error: 'Database connection failed'
      })
    } as Response);

    render(<ProviderManagementPage />);

    await waitFor(() => {
      expect(screen.getByText('Failed to load providers')).toBeInTheDocument();
    });

    expect(screen.getByText('Database connection failed')).toBeInTheDocument();
  });

  it('should retry loading when retry button is clicked', async () => {
    // First call fails
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 500,
      statusText: 'Internal Server Error'
    } as Response);

    // Second call succeeds
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        success: true,
        providers: [],
        pagination: {
          page: 1,
          limit: 10,
          total: 0,
          totalPages: 0
        }
      })
    } as Response);

    render(<ProviderManagementPage />);

    await waitFor(() => {
      expect(screen.getByText('Failed to load providers')).toBeInTheDocument();
    });

    const retryButton = screen.getByText('Try again');
    fireEvent.click(retryButton);

    await waitFor(() => {
      expect(screen.getByText('No providers found')).toBeInTheDocument();
    });
  });

  it('should handle search functionality', async () => {
    // Initial load
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        success: true,
        providers: [],
        pagination: {
          page: 1,
          limit: 10,
          total: 0,
          totalPages: 0
        }
      })
    } as Response);

    // Search call
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        success: true,
        providers: [],
        pagination: {
          page: 1,
          limit: 10,
          total: 0,
          totalPages: 0
        }
      })
    } as Response);

    render(<ProviderManagementPage />);

    await waitFor(() => {
      expect(screen.getByText('No providers found')).toBeInTheDocument();
    });

    const searchInput = screen.getByPlaceholderText('Search by provider name, user name, or email...');
    const searchButton = screen.getByText('Search');

    fireEvent.change(searchInput, { target: { value: 'test search' } });
    fireEvent.click(searchButton);

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('search=test+search')
      );
    });
  });

  it('should not contain any hardcoded mock data', () => {
    // This test ensures no hardcoded provider arrays exist in the component
    const componentSource = ProviderManagementPage.toString();
    
    // Check that there are no hardcoded arrays with provider-like objects
    expect(componentSource).not.toMatch(/\[\s*\{[^}]*id[^}]*name[^}]*\}/);
    expect(componentSource).not.toMatch(/mockProviders/i);
    expect(componentSource).not.toMatch(/hardcoded/i);
  });
});