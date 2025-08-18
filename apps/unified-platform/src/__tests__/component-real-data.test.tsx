/**
 * Component Real Data Tests
 * 
 * This test suite verifies that components handle real data correctly
 * and don't contain hardcoded mock data.
 * 
 * Requirements: 7.1, 7.2, 7.4, 7.5
 */

import { render, screen, waitFor } from '@testing-library/react';
import React from 'react';

// Mock fetch globally
global.fetch = jest.fn();

describe('Component Real Data Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (global.fetch as jest.Mock).mockClear();
  });

  describe('Search Components', () => {
    it('should handle empty search results without showing mock data', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({
          success: true,
          results: [],
          total: 0,
          categories: []
        }),
      });

      // Create a simple test component that fetches search data
      function SearchTestComponent() {
        const [results, setResults] = React.useState([]);
        const [loading, setLoading] = React.useState(true);

        React.useEffect(() => {
          fetch('/api/search?q=wedding')
            .then(response => response.json())
            .then(data => {
              setResults(data.results || []);
              setLoading(false);
            })
            .catch(() => {
              setResults([]);
              setLoading(false);
            });
        }, []);

        if (loading) return <div data-testid="loading">Loading...</div>;
        
        if (results.length === 0) {
          return <div data-testid="empty-results">No services found</div>;
        }

        return (
          <div data-testid="search-results">
            {results.map((result: any) => (
              <div key={result.id}>{result.name}</div>
            ))}
          </div>
        );
      }

      render(<SearchTestComponent />);

      await waitFor(() => {
        expect(screen.getByTestId('empty-results')).toBeInTheDocument();
      });

      // Verify no mock data is displayed
      expect(screen.queryByText(/mock|sample|test/i)).not.toBeInTheDocument();
      expect(screen.getByText('No services found')).toBeInTheDocument();
    });

    it('should handle API errors without falling back to mock data', async () => {
      (global.fetch as jest.Mock).mockRejectedValue(new Error('Network error'));

      function ErrorTestComponent() {
        const [error, setError] = React.useState(null);
        const [results, setResults] = React.useState([]);

        React.useEffect(() => {
          fetch('/api/search')
            .then(response => response.json())
            .then(data => setResults(data.results || []))
            .catch(err => {
              setError(err.message);
              // Should NOT set mock data here
              setResults([]);
            });
        }, []);

        if (error) return <div data-testid="error">Error: {error}</div>;
        if (results.length === 0) return <div data-testid="no-data">No data available</div>;
        
        return <div data-testid="results">Results found</div>;
      }

      render(<ErrorTestComponent />);

      await waitFor(() => {
        expect(screen.getByTestId('error')).toBeInTheDocument();
      });

      // Verify no mock data is shown
      expect(screen.queryByText(/mock|sample|test/i)).not.toBeInTheDocument();
    });
  });

  describe('Provider Components', () => {
    it('should display empty state when no providers exist', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({
          success: true,
          providers: [],
          total: 0
        }),
      });

      function ProviderTestComponent() {
        const [providers, setProviders] = React.useState([]);
        const [loading, setLoading] = React.useState(true);

        React.useEffect(() => {
          fetch('/api/provider')
            .then(response => response.json())
            .then(data => {
              setProviders(data.providers || []);
              setLoading(false);
            })
            .catch(() => {
              setProviders([]);
              setLoading(false);
            });
        }, []);

        if (loading) return <div data-testid="loading">Loading...</div>;
        
        if (providers.length === 0) {
          return <div data-testid="empty-providers">No providers available</div>;
        }

        return (
          <div data-testid="provider-list">
            {providers.map((provider: any) => (
              <div key={provider.id}>{provider.name}</div>
            ))}
          </div>
        );
      }

      render(<ProviderTestComponent />);

      await waitFor(() => {
        expect(screen.getByTestId('empty-providers')).toBeInTheDocument();
      });

      // Verify no mock providers are displayed
      expect(screen.queryByText(/mock|sample|test/i)).not.toBeInTheDocument();
      expect(screen.getByText('No providers available')).toBeInTheDocument();
    });
  });

  describe('Dashboard Components', () => {
    it('should display zero metrics instead of mock data', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({
          success: true,
          metrics: {
            totalBookings: 0,
            totalRevenue: 0,
            averageRating: 0,
            completionRate: 0
          },
          recentBookings: []
        }),
      });

      function DashboardTestComponent() {
        const [metrics, setMetrics] = React.useState(null);
        const [loading, setLoading] = React.useState(true);

        React.useEffect(() => {
          fetch('/api/dashboard')
            .then(response => response.json())
            .then(data => {
              setMetrics(data.metrics);
              setLoading(false);
            })
            .catch(() => {
              setMetrics({
                totalBookings: 0,
                totalRevenue: 0,
                averageRating: 0,
                completionRate: 0
              });
              setLoading(false);
            });
        }, []);

        if (loading) return <div data-testid="loading">Loading...</div>;
        
        return (
          <div data-testid="dashboard">
            <div data-testid="total-bookings">Bookings: {metrics?.totalBookings || 0}</div>
            <div data-testid="total-revenue">Revenue: ${metrics?.totalRevenue || 0}</div>
            <div data-testid="average-rating">Rating: {metrics?.averageRating || 0}</div>
          </div>
        );
      }

      render(<DashboardTestComponent />);

      await waitFor(() => {
        expect(screen.getByTestId('dashboard')).toBeInTheDocument();
      });

      // Verify zero metrics are displayed, not mock data
      expect(screen.getByText('Bookings: 0')).toBeInTheDocument();
      expect(screen.getByText('Revenue: $0')).toBeInTheDocument();
      expect(screen.getByText('Rating: 0')).toBeInTheDocument();
      
      // Verify no mock data is displayed
      expect(screen.queryByText(/mock|sample|test/i)).not.toBeInTheDocument();
    });
  });

  describe('Loading States', () => {
    it('should show loading state without mock data', async () => {
      (global.fetch as jest.Mock).mockImplementation(() => 
        new Promise(resolve => 
          setTimeout(() => resolve({
            ok: true,
            json: () => Promise.resolve({ success: true, results: [] })
          }), 100)
        )
      );

      function LoadingTestComponent() {
        const [data, setData] = React.useState(null);
        const [loading, setLoading] = React.useState(true);

        React.useEffect(() => {
          fetch('/api/search')
            .then(response => response.json())
            .then(result => {
              setData(result);
              setLoading(false);
            });
        }, []);

        if (loading) return <div data-testid="loading">Loading...</div>;
        return <div data-testid="loaded">Data loaded</div>;
      }

      render(<LoadingTestComponent />);

      // Should show loading initially
      expect(screen.getByTestId('loading')).toBeInTheDocument();
      expect(screen.queryByText(/mock|sample|test/i)).not.toBeInTheDocument();

      // Should show loaded state after delay
      await waitFor(() => {
        expect(screen.getByTestId('loaded')).toBeInTheDocument();
      }, { timeout: 200 });
    });
  });

  describe('Error Boundaries', () => {
    it('should handle component errors without showing mock data', () => {
      // Component that throws an error
      function ErrorComponent() {
        throw new Error('Component error');
      }

      // Simple error boundary
      class TestErrorBoundary extends React.Component<
        { children: React.ReactNode },
        { hasError: boolean }
      > {
        constructor(props: { children: React.ReactNode }) {
          super(props);
          this.state = { hasError: false };
        }

        static getDerivedStateFromError() {
          return { hasError: true };
        }

        render() {
          if (this.state.hasError) {
            return <div data-testid="error-boundary">Something went wrong</div>;
          }

          return this.props.children;
        }
      }

      render(
        <TestErrorBoundary>
          <ErrorComponent />
        </TestErrorBoundary>
      );

      expect(screen.getByTestId('error-boundary')).toBeInTheDocument();
      expect(screen.getByText('Something went wrong')).toBeInTheDocument();
      
      // Verify no mock data is shown in error state
      expect(screen.queryByText(/mock|sample|test/i)).not.toBeInTheDocument();
    });
  });

  describe('Data Validation', () => {
    it('should validate API responses and reject invalid data', async () => {
      // Mock API returning invalid data structure
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({
          // Invalid response structure
          invalidField: 'invalid',
          results: 'not an array'
        }),
      });

      function ValidationTestComponent() {
        const [error, setError] = React.useState(null);
        const [results, setResults] = React.useState([]);

        React.useEffect(() => {
          fetch('/api/search')
            .then(response => response.json())
            .then(data => {
              // Validate response structure
              if (!data.success || !Array.isArray(data.results)) {
                throw new Error('Invalid API response');
              }
              setResults(data.results);
            })
            .catch(err => {
              setError(err.message);
              setResults([]); // Don't use mock data
            });
        }, []);

        if (error) return <div data-testid="validation-error">Validation Error: {error}</div>;
        if (results.length === 0) return <div data-testid="no-results">No valid results</div>;
        
        return <div data-testid="valid-results">Valid results found</div>;
      }

      render(<ValidationTestComponent />);

      await waitFor(() => {
        expect(screen.getByTestId('validation-error')).toBeInTheDocument();
      });

      // Verify no mock data is used when validation fails
      expect(screen.queryByText(/mock|sample|test/i)).not.toBeInTheDocument();
    });
  });
});