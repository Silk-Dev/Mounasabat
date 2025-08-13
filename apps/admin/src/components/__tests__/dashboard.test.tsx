import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import Dashboard from '../dashboard';

// Mock fetch
global.fetch = jest.fn();

describe('Admin Dashboard', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (global.fetch as jest.Mock).mockClear();
  });

  it('should display loading state initially', () => {
    (global.fetch as jest.Mock).mockImplementation(() => 
      new Promise(() => {}) // Never resolves to keep loading state
    );

    render(<Dashboard />);
    
    expect(screen.getByText('Dashboard Overview')).toBeInTheDocument();
    // Should show loading skeleton cards
    expect(screen.getAllByRole('generic')).toHaveLength(6); // 6 skeleton cards
  });

  it('should display error state when API fails', async () => {
    (global.fetch as jest.Mock).mockRejectedValue(new Error('API Error'));

    render(<Dashboard />);
    
    await waitFor(() => {
      expect(screen.getByText('Failed to load dashboard data')).toBeInTheDocument();
      expect(screen.getByText('API Error')).toBeInTheDocument();
      expect(screen.getByText('Retry')).toBeInTheDocument();
    });
  });

  it('should display dashboard with real data from API', async () => {
    const mockData = {
      metrics: {
        overview: {
          totalUsers: {
            value: 1500,
            growth: '+25%',
            trend: 'up'
          },
          totalProviders: {
            value: 200,
            growth: '+15%',
            trend: 'up'
          },
          verifiedProviders: {
            value: 180,
            percentage: '90.0'
          },
          totalBookings: {
            value: 850,
            growth: '+30%',
            trend: 'up'
          },
          totalOrders: {
            value: 750
          },
          openIssues: {
            value: 5,
            trend: 'normal'
          }
        },
        breakdowns: {
          issuesByPriority: {
            HIGH: 2,
            MEDIUM: 2,
            LOW: 1
          },
          usersByRole: {
            customer: 1200,
            provider: 200,
            admin: 5
          },
          bookingsByStatus: {
            PENDING: 50,
            CONFIRMED: 700,
            CANCELLED: 100
          }
        },
        recentActivity: [
          {
            type: 'user_signup',
            message: 'John Doe signed up as customer',
            timestamp: '2024-01-01T12:00:00Z',
            userId: 'user-1'
          },
          {
            type: 'booking',
            message: 'Jane Smith booked Wedding Photography',
            timestamp: '2024-01-01T11:00:00Z',
            bookingId: 'booking-1'
          }
        ]
      }
    };

    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockData)
    });

    render(<Dashboard />);
    
    await waitFor(() => {
      expect(screen.getByText('Dashboard Overview')).toBeInTheDocument();
      
      // Check that real data is displayed
      expect(screen.getByText('1.5K')).toBeInTheDocument(); // Total users (formatted)
      expect(screen.getByText('200')).toBeInTheDocument(); // Total providers
      expect(screen.getByText('180')).toBeInTheDocument(); // Verified providers
      expect(screen.getByText('850')).toBeInTheDocument(); // Total bookings
      expect(screen.getByText('750')).toBeInTheDocument(); // Total orders
      expect(screen.getByText('5')).toBeInTheDocument(); // Open issues
      
      // Check growth indicators
      expect(screen.getByText('+25% from last month')).toBeInTheDocument();
      expect(screen.getByText('+15% from last month')).toBeInTheDocument();
      expect(screen.getByText('+30% from last month')).toBeInTheDocument();
      
      // Check percentage
      expect(screen.getByText('90.0% of all providers')).toBeInTheDocument();
      
      // Check recent activity
      expect(screen.getByText('John Doe signed up as customer')).toBeInTheDocument();
      expect(screen.getByText('Jane Smith booked Wedding Photography')).toBeInTheDocument();
    });
  });

  it('should display empty state when no data is available', async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(null)
    });

    render(<Dashboard />);
    
    await waitFor(() => {
      expect(screen.getByText('No dashboard data available')).toBeInTheDocument();
      expect(screen.getByText('Dashboard metrics could not be loaded. Please try again later.')).toBeInTheDocument();
    });
  });

  it('should retry loading data when retry button is clicked', async () => {
    (global.fetch as jest.Mock)
      .mockRejectedValueOnce(new Error('Network Error'))
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          metrics: {
            overview: {
              totalUsers: { value: 100, growth: '+10%', trend: 'up' },
              totalProviders: { value: 20, growth: '+5%', trend: 'up' },
              verifiedProviders: { value: 18, percentage: '90.0' },
              totalBookings: { value: 50, growth: '+20%', trend: 'up' },
              totalOrders: { value: 45 },
              openIssues: { value: 2, trend: 'normal' }
            },
            breakdowns: {
              issuesByPriority: {},
              usersByRole: {},
              bookingsByStatus: {}
            },
            recentActivity: []
          }
        })
      });

    render(<Dashboard />);
    
    // Wait for error state
    await waitFor(() => {
      expect(screen.getByText('Failed to load dashboard data')).toBeInTheDocument();
    });

    // Click retry button
    fireEvent.click(screen.getByText('Retry'));

    // Wait for successful load
    await waitFor(() => {
      expect(screen.getByText('100')).toBeInTheDocument(); // Total users
      expect(screen.getByText('20')).toBeInTheDocument(); // Total providers
    });

    expect(global.fetch).toHaveBeenCalledTimes(2);
  });

  it('should not contain any hardcoded mock data', async () => {
    const mockData = {
      metrics: {
        overview: {
          totalUsers: { value: 0, growth: '+0%', trend: 'up' },
          totalProviders: { value: 0, growth: '+0%', trend: 'up' },
          verifiedProviders: { value: 0, percentage: '0' },
          totalBookings: { value: 0, growth: '+0%', trend: 'up' },
          totalOrders: { value: 0 },
          openIssues: { value: 0, trend: 'normal' }
        },
        breakdowns: {
          issuesByPriority: {},
          usersByRole: {},
          bookingsByStatus: {}
        },
        recentActivity: []
      }
    };

    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockData)
    });

    render(<Dashboard />);
    
    await waitFor(() => {
      expect(screen.getByText('Dashboard Overview')).toBeInTheDocument();
    });

    // Verify no hardcoded mock values are displayed
    expect(screen.queryByText('1,234')).not.toBeInTheDocument();
    expect(screen.queryByText('12,345')).not.toBeInTheDocument();
    expect(screen.queryByText('56')).not.toBeInTheDocument();
    
    // Should show real zero values instead
    expect(screen.getAllByText('0')).toHaveLength(6); // All metrics should be 0
  });

  it('should format large numbers correctly', async () => {
    const mockData = {
      metrics: {
        overview: {
          totalUsers: { value: 1500000, growth: '+25%', trend: 'up' }, // 1.5M
          totalProviders: { value: 2500, growth: '+15%', trend: 'up' }, // 2.5K
          verifiedProviders: { value: 2000, percentage: '80.0' },
          totalBookings: { value: 850000, growth: '+30%', trend: 'up' }, // 850K
          totalOrders: { value: 750000 }, // 750K
          openIssues: { value: 15, trend: 'warning' }
        },
        breakdowns: {
          issuesByPriority: {},
          usersByRole: {},
          bookingsByStatus: {}
        },
        recentActivity: []
      }
    };

    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockData)
    });

    render(<Dashboard />);
    
    await waitFor(() => {
      expect(screen.getByText('1.5M')).toBeInTheDocument(); // 1,500,000 formatted
      expect(screen.getByText('2.5K')).toBeInTheDocument(); // 2,500 formatted
      expect(screen.getByText('850.0K')).toBeInTheDocument(); // 850,000 formatted
      expect(screen.getByText('750.0K')).toBeInTheDocument(); // 750,000 formatted
      expect(screen.getByText('15')).toBeInTheDocument(); // Small numbers not formatted
    });
  });
});