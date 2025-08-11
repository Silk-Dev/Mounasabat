import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import ErrorBoundary from '../ErrorBoundary';
import SearchErrorBoundary from '../SearchErrorBoundary';
import BookingErrorBoundary from '../BookingErrorBoundary';
import DashboardErrorBoundary from '../DashboardErrorBoundary';

// Mock components that throw errors
const ThrowError = ({ shouldThrow = true }: { shouldThrow?: boolean }) => {
  if (shouldThrow) {
    throw new Error('Test error');
  }
  return <div>No error</div>;
};

const ConsoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

describe('Error Boundaries', () => {
  beforeEach(() => {
    ConsoleErrorSpy.mockClear();
    
    // Mock fetch for error logging
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ success: true }),
    });

    // Mock localStorage
    Object.defineProperty(window, 'localStorage', {
      value: {
        getItem: jest.fn(),
        setItem: jest.fn(),
        removeItem: jest.fn(),
      },
      writable: true,
    });

    // Mock sessionStorage
    Object.defineProperty(window, 'sessionStorage', {
      value: {
        getItem: jest.fn(),
        setItem: jest.fn(),
        removeItem: jest.fn(),
      },
      writable: true,
    });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('ErrorBoundary', () => {
    it('should render children when there is no error', () => {
      render(
        <ErrorBoundary>
          <ThrowError shouldThrow={false} />
        </ErrorBoundary>
      );

      expect(screen.getByText('No error')).toBeInTheDocument();
    });

    it('should render error UI when child throws', () => {
      render(
        <ErrorBoundary>
          <ThrowError />
        </ErrorBoundary>
      );

      expect(screen.getByText('Something went wrong')).toBeInTheDocument();
      expect(screen.getByText(/An unexpected error occurred/)).toBeInTheDocument();
    });

    it('should show section-specific error message', () => {
      render(
        <ErrorBoundary section="test-section">
          <ThrowError />
        </ErrorBoundary>
      );

      expect(screen.getByText(/An error occurred in the test-section section/)).toBeInTheDocument();
    });

    it('should call onError callback when error occurs', () => {
      const onError = jest.fn();
      
      render(
        <ErrorBoundary onError={onError}>
          <ThrowError />
        </ErrorBoundary>
      );

      expect(onError).toHaveBeenCalledWith(
        expect.any(Error),
        expect.objectContaining({
          componentStack: expect.any(String),
        })
      );
    });

    it('should retry when retry button is clicked', () => {
      const { rerender } = render(
        <ErrorBoundary>
          <ThrowError />
        </ErrorBoundary>
      );

      expect(screen.getByText('Something went wrong')).toBeInTheDocument();

      const retryButton = screen.getByText('Try Again');
      fireEvent.click(retryButton);

      // Re-render with no error
      rerender(
        <ErrorBoundary>
          <ThrowError shouldThrow={false} />
        </ErrorBoundary>
      );

      expect(screen.getByText('No error')).toBeInTheDocument();
    });

    it('should show error details in development', () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'development';

      render(
        <ErrorBoundary showDetails={true}>
          <ThrowError />
        </ErrorBoundary>
      );

      expect(screen.getByText('Error Details (Development)')).toBeInTheDocument();

      process.env.NODE_ENV = originalEnv;
    });

    it('should log error to monitoring service', async () => {
      render(
        <ErrorBoundary>
          <ThrowError />
        </ErrorBoundary>
      );

      // Wait for async error logging
      await new Promise(resolve => setTimeout(resolve, 0));

      expect(global.fetch).toHaveBeenCalledWith('/api/errors', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: expect.stringContaining('Test error'),
      });
    });
  });

  describe('SearchErrorBoundary', () => {
    it('should render search-specific error UI', () => {
      render(
        <SearchErrorBoundary>
          <ThrowError />
        </SearchErrorBoundary>
      );

      expect(screen.getByText('Search Error')).toBeInTheDocument();
      expect(screen.getByText(/We encountered an issue while searching/)).toBeInTheDocument();
    });

    it('should provide search-specific recovery options', () => {
      render(
        <SearchErrorBoundary>
          <ThrowError />
        </SearchErrorBoundary>
      );

      expect(screen.getByText('Try Search Again')).toBeInTheDocument();
      expect(screen.getByText('Clear Filters & Retry')).toBeInTheDocument();
      expect(screen.getByText('Simple Search')).toBeInTheDocument();
    });

    it('should clear filters when clear filters button is clicked', () => {
      const mockRemoveItem = localStorage.removeItem as jest.MockedFunction<typeof localStorage.removeItem>;
      
      render(
        <SearchErrorBoundary>
          <ThrowError />
        </SearchErrorBoundary>
      );

      const clearFiltersButton = screen.getByText('Clear Filters & Retry');
      fireEvent.click(clearFiltersButton);

      expect(mockRemoveItem).toHaveBeenCalledWith('searchFilters');
      expect(mockRemoveItem).toHaveBeenCalledWith('searchQuery');
    });
  });

  describe('BookingErrorBoundary', () => {
    it('should render booking-specific error UI', () => {
      render(
        <BookingErrorBoundary>
          <ThrowError />
        </BookingErrorBoundary>
      );

      expect(screen.getByText('Booking Error')).toBeInTheDocument();
      expect(screen.getByText(/We encountered an issue while processing your booking/)).toBeInTheDocument();
    });

    it('should provide booking-specific recovery options', () => {
      render(
        <BookingErrorBoundary>
          <ThrowError />
        </BookingErrorBoundary>
      );

      expect(screen.getByText('Try Again')).toBeInTheDocument();
      expect(screen.getByText('Save Progress & Retry')).toBeInTheDocument();
      expect(screen.getByText('Start Over')).toBeInTheDocument();
      expect(screen.getByText('Contact Support')).toBeInTheDocument();
    });

    it('should save booking progress when save progress button is clicked', () => {
      const mockGetItem = sessionStorage.getItem as jest.MockedFunction<typeof sessionStorage.getItem>;
      const mockSetItem = localStorage.setItem as jest.MockedFunction<typeof localStorage.setItem>;
      
      mockGetItem.mockReturnValue('{"step": "payment", "data": "test"}');
      
      render(
        <BookingErrorBoundary>
          <ThrowError />
        </BookingErrorBoundary>
      );

      const saveProgressButton = screen.getByText('Save Progress & Retry');
      fireEvent.click(saveProgressButton);

      expect(mockSetItem).toHaveBeenCalledWith('savedBooking', '{"step": "payment", "data": "test"}');
      expect(mockSetItem).toHaveBeenCalledWith('savedBookingTimestamp', expect.any(String));
    });
  });

  describe('DashboardErrorBoundary', () => {
    it('should render dashboard-specific error UI', () => {
      render(
        <DashboardErrorBoundary>
          <ThrowError />
        </DashboardErrorBoundary>
      );

      expect(screen.getByText('Dashboard Error')).toBeInTheDocument();
      expect(screen.getByText(/We encountered an issue loading your dashboard/)).toBeInTheDocument();
    });

    it('should provide dashboard-specific recovery options', () => {
      render(
        <DashboardErrorBoundary>
          <ThrowError />
        </DashboardErrorBoundary>
      );

      expect(screen.getByText('Reload Dashboard')).toBeInTheDocument();
      expect(screen.getByText('Clear Cache & Reload')).toBeInTheDocument();
      expect(screen.getByText('Basic View')).toBeInTheDocument();
      expect(screen.getByText('Settings')).toBeInTheDocument();
      expect(screen.getByText('Logout')).toBeInTheDocument();
    });

    it('should clear dashboard cache when clear cache button is clicked', () => {
      const mockRemoveItem = localStorage.removeItem as jest.MockedFunction<typeof localStorage.removeItem>;
      const mockSessionRemoveItem = sessionStorage.removeItem as jest.MockedFunction<typeof sessionStorage.removeItem>;
      
      render(
        <DashboardErrorBoundary>
          <ThrowError />
        </DashboardErrorBoundary>
      );

      const clearCacheButton = screen.getByText('Clear Cache & Reload');
      fireEvent.click(clearCacheButton);

      expect(mockRemoveItem).toHaveBeenCalledWith('dashboardCache');
      expect(mockSessionRemoveItem).toHaveBeenCalledWith('dashboardFilters');
    });

    it('should handle logout when logout button is clicked', async () => {
      const mockFetch = global.fetch as jest.MockedFunction<typeof fetch>;
      mockFetch.mockResolvedValueOnce({
        ok: true,
      } as Response);

      // Mock window.location.href
      delete (window as any).location;
      window.location = { href: '' } as any;

      render(
        <DashboardErrorBoundary>
          <ThrowError />
        </DashboardErrorBoundary>
      );

      const logoutButton = screen.getByText('Logout');
      fireEvent.click(logoutButton);

      expect(mockFetch).toHaveBeenCalledWith('/api/auth/logout', { method: 'POST' });
    });
  });

  describe('Error Boundary Integration', () => {
    it('should handle nested error boundaries', () => {
      render(
        <ErrorBoundary section="outer">
          <SearchErrorBoundary>
            <ThrowError />
          </SearchErrorBoundary>
        </ErrorBoundary>
      );

      // Should show search-specific error, not outer error boundary
      expect(screen.getByText('Search Error')).toBeInTheDocument();
      expect(screen.queryByText('Something went wrong')).not.toBeInTheDocument();
    });

    it('should handle multiple error boundaries at same level', () => {
      const { rerender } = render(
        <div>
          <SearchErrorBoundary>
            <ThrowError />
          </SearchErrorBoundary>
          <BookingErrorBoundary>
            <div>Booking content</div>
          </BookingErrorBoundary>
        </div>
      );

      expect(screen.getByText('Search Error')).toBeInTheDocument();
      expect(screen.getByText('Booking content')).toBeInTheDocument();

      // Now make booking component throw
      rerender(
        <div>
          <SearchErrorBoundary>
            <div>Search content</div>
          </SearchErrorBoundary>
          <BookingErrorBoundary>
            <ThrowError />
          </BookingErrorBoundary>
        </div>
      );

      expect(screen.getByText('Search content')).toBeInTheDocument();
      expect(screen.getByText('Booking Error')).toBeInTheDocument();
    });
  });
});