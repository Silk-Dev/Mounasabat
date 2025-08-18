import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { RealTimeDashboard } from '../RealTimeDashboard';

// Mock the websocket service
jest.mock('@/lib/websocket', () => ({
  websocketService: {
    connect: jest.fn(),
    subscribe: jest.fn(() => jest.fn()), // Return unsubscribe function
    isConnected: jest.fn(() => true),
  },
}));

// Mock date-fns
jest.mock('date-fns', () => ({
  format: jest.fn((date, formatStr) => {
    if (formatStr === 'h:mm:ss a') return '12:00:00 PM';
    if (formatStr === 'MMM d') return 'Jan 1';
    return '2024-01-01';
  }),
}));

// Mock fetch
global.fetch = jest.fn();

describe('RealTimeDashboard', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (global.fetch as jest.Mock).mockClear();
  });

  it('should display loading state initially', () => {
    (global.fetch as jest.Mock).mockImplementation(() => 
      new Promise(() => {}) // Never resolves to keep loading state
    );

    render(<RealTimeDashboard providerId="test-provider" userRole="provider" />);
    
    // Should show loading skeleton
    expect(screen.getAllByRole('generic')).toHaveLength(8); // 8 skeleton cards
  });

  it('should display error state when API fails', async () => {
    (global.fetch as jest.Mock).mockRejectedValue(new Error('API Error'));

    render(<RealTimeDashboard providerId="test-provider" userRole="provider" />);
    
    await waitFor(() => {
      expect(screen.getByText('Dashboard Unavailable')).toBeInTheDocument();
      expect(screen.getByText('Failed to load dashboard data')).toBeInTheDocument();
      expect(screen.getByText('Try Again')).toBeInTheDocument();
    });
  });

  it('should display provider dashboard with real data', async () => {
    const mockProviderData = {
      metrics: {
        totalBookings: 25,
        totalRevenue: 5000,
        averageRating: 4.5,
        activeCustomers: 15,
        pendingBookings: 3,
        completedBookings: 20,
        cancelledBookings: 2,
        monthlyGrowth: 15,
        revenueGrowth: 10,
        lastUpdated: new Date('2024-01-01T12:00:00Z')
      },
      recentBookings: [
        {
          id: 'booking-1',
          customerName: 'John Doe',
          serviceName: 'Wedding Photography',
          amount: 1500,
          status: 'confirmed',
          date: new Date('2024-01-01')
        }
      ]
    };

    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockProviderData)
    });

    render(<RealTimeDashboard providerId="test-provider" userRole="provider" />);
    
    await waitFor(() => {
      expect(screen.getByText('Provider Dashboard')).toBeInTheDocument();
      expect(screen.getByText('25')).toBeInTheDocument(); // Total bookings
      expect(screen.getByText('$5,000')).toBeInTheDocument(); // Total revenue
      expect(screen.getByText('4.5')).toBeInTheDocument(); // Average rating
      expect(screen.getByText('15')).toBeInTheDocument(); // Active customers
      expect(screen.getByText('John Doe')).toBeInTheDocument(); // Recent booking
      expect(screen.getByText('Wedding Photography')).toBeInTheDocument();
    });
  });

  it('should display admin dashboard with real data', async () => {
    const mockAdminData = {
      metrics: {
        overview: {
          totalBookings: { value: 100, growth: '+20%', trend: 'up' },
          totalUsers: { value: 500, growth: '+15%', trend: 'up' },
          totalOrders: { value: 75 }
        },
        breakdowns: {
          bookingsByStatus: {
            PENDING: 10,
            CONFIRMED: 80,
            CANCELLED: 10
          }
        },
        recentActivity: [
          {
            type: 'booking',
            message: 'Jane Smith booked Wedding Catering',
            timestamp: '2024-01-01T12:00:00Z',
            bookingId: 'booking-1'
          }
        ]
      }
    };

    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockAdminData)
    });

    render(<RealTimeDashboard userRole="admin" />);
    
    await waitFor(() => {
      expect(screen.getByText('Platform Dashboard')).toBeInTheDocument();
      expect(screen.getByText('100')).toBeInTheDocument(); // Total bookings
      expect(screen.getByText('500')).toBeInTheDocument(); // Active customers (users)
      expect(screen.getByText('Jane Smith')).toBeInTheDocument(); // Recent activity
    });
  });

  it('should display empty state when no recent bookings', async () => {
    const mockData = {
      metrics: {
        totalBookings: 0,
        totalRevenue: 0,
        averageRating: 0,
        activeCustomers: 0,
        pendingBookings: 0,
        completedBookings: 0,
        cancelledBookings: 0,
        monthlyGrowth: 0,
        revenueGrowth: 0,
        lastUpdated: new Date()
      },
      recentBookings: []
    };

    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockData)
    });

    render(<RealTimeDashboard providerId="test-provider" userRole="provider" />);
    
    await waitFor(() => {
      expect(screen.getByText('No recent bookings')).toBeInTheDocument();
    });
  });

  it('should retry loading data when retry button is clicked', async () => {
    (global.fetch as jest.Mock)
      .mockRejectedValueOnce(new Error('API Error'))
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          metrics: {
            totalBookings: 5,
            totalRevenue: 1000,
            averageRating: 4.0,
            activeCustomers: 3,
            pendingBookings: 1,
            completedBookings: 4,
            cancelledBookings: 0,
            monthlyGrowth: 5,
            revenueGrowth: 8,
            lastUpdated: new Date()
          },
          recentBookings: []
        })
      });

    render(<RealTimeDashboard providerId="test-provider" userRole="provider" />);
    
    // Wait for error state
    await waitFor(() => {
      expect(screen.getByText('Dashboard Unavailable')).toBeInTheDocument();
    });

    // Click retry button
    fireEvent.click(screen.getByText('Try Again'));

    // Wait for successful load
    await waitFor(() => {
      expect(screen.getByText('Provider Dashboard')).toBeInTheDocument();
      expect(screen.getByText('5')).toBeInTheDocument(); // Total bookings
    });

    expect(global.fetch).toHaveBeenCalledTimes(2);
  });

  it('should not contain any hardcoded mock data', async () => {
    const mockData = {
      metrics: {
        totalBookings: 0,
        totalRevenue: 0,
        averageRating: 0,
        activeCustomers: 0,
        pendingBookings: 0,
        completedBookings: 0,
        cancelledBookings: 0,
        monthlyGrowth: 0,
        revenueGrowth: 0,
        lastUpdated: new Date()
      },
      recentBookings: []
    };

    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockData)
    });

    render(<RealTimeDashboard providerId="test-provider" userRole="provider" />);
    
    await waitFor(() => {
      expect(screen.getByText('Provider Dashboard')).toBeInTheDocument();
    });

    // Verify no hardcoded mock values are displayed
    expect(screen.queryByText('1,234')).not.toBeInTheDocument();
    expect(screen.queryByText('12,345')).not.toBeInTheDocument();
    expect(screen.queryByText('56')).not.toBeInTheDocument();
    expect(screen.queryByText('current-user-id')).not.toBeInTheDocument();
  });
});