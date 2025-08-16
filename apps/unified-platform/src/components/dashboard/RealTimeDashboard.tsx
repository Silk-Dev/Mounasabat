'use client';

import { useState, useEffect } from 'react';
import { TrendingUp, TrendingDown, Users, Calendar, DollarSign, Star, Activity } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { websocketService, DashboardUpdate } from '@/lib/websocket';
import { format } from 'date-fns';
import { logger } from '@/lib/production-logger';

interface DashboardMetrics {
  totalBookings: number;
  totalRevenue: number;
  averageRating: number;
  activeCustomers: number;
  pendingBookings: number;
  completedBookings: number;
  cancelledBookings: number;
  monthlyGrowth: number;
  revenueGrowth: number;
  lastUpdated: Date;
}

interface RecentBooking {
  id: string;
  customerName: string;
  serviceName: string;
  amount: number;
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled';
  date: Date;
}

interface RealTimeDashboardProps {
  providerId?: string;
  userRole: 'provider' | 'admin';
}

export function RealTimeDashboard({ providerId, userRole }: RealTimeDashboardProps) {
  const [metrics, setMetrics] = useState<DashboardMetrics>({
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
  });
  
  const [recentBookings, setRecentBookings] = useState<RecentBooking[]>([]);
  const [connectionStatus, setConnectionStatus] = useState<'connected' | 'disconnected' | 'connecting'>('connecting');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Load initial dashboard data
    loadDashboardData();

    // Set up WebSocket connection - only if we have a valid user
    if (typeof window !== 'undefined') {
      // Get user ID from session/auth context in a real implementation
      // For now, we'll skip WebSocket connection if no proper user ID is available
      const userId = providerId || 'anonymous';
      websocketService.connect(userId, userRole);
    }
    
    // Subscribe to dashboard updates
    const unsubscribe = websocketService.subscribe('dashboard_update', handleDashboardUpdate);

    // Monitor connection status
    const checkConnection = setInterval(() => {
      setConnectionStatus(websocketService.isConnected() ? 'connected' : 'disconnected');
    }, 1000);

    return () => {
      unsubscribe();
      clearInterval(checkConnection);
    };
  }, [providerId, userRole]);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const endpoint = userRole === 'admin' ? '/api/admin/dashboard' : `/api/provider/${providerId}/dashboard`;
      const response = await fetch(endpoint);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch dashboard data: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (userRole === 'admin') {
        if (data.metrics) {
          // Transform admin metrics to match dashboard interface
          setMetrics({
            totalBookings: data.metrics.overview?.totalBookings?.value || 0,
            totalRevenue: data.metrics.overview?.totalOrders?.value || 0,
            averageRating: 0, // Admin dashboard doesn't have average rating
            activeCustomers: data.metrics.overview?.totalUsers?.value || 0,
            pendingBookings: data.metrics.breakdowns?.bookingsByStatus?.PENDING || 0,
            completedBookings: data.metrics.breakdowns?.bookingsByStatus?.CONFIRMED || 0,
            cancelledBookings: data.metrics.breakdowns?.bookingsByStatus?.CANCELLED || 0,
            monthlyGrowth: parseFloat(data.metrics.overview?.totalBookings?.growth?.replace(/[+%]/g, '') || '0'),
            revenueGrowth: 0, // Not available in admin metrics
            lastUpdated: new Date()
          });
          
          // Transform recent activity to recent bookings format
          const recentBookings = (data.metrics.recentActivity || [])
            .filter((activity: any) => activity.type === 'booking')
            .slice(0, 5)
            .map((activity: any) => ({
              id: activity.bookingId || Math.random().toString(),
              customerName: activity.message.split(' booked ')[0] || 'Customer',
              serviceName: activity.message.split(' booked ')[1] || 'Service',
              amount: 0, // Not available in activity data
              status: 'confirmed',
              date: new Date(activity.timestamp)
            }));
          
          setRecentBookings(recentBookings);
        }
      } else {
        // Provider dashboard
        setMetrics(data.metrics || {
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
        });
        setRecentBookings(data.recentBookings || []);
      }
    } catch (error) {
      logger.error('Failed to load dashboard data:', error);
      setError(error instanceof Error ? error.message : 'Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const handleDashboardUpdate = (update: DashboardUpdate) => {
    // Filter updates for this provider if specified
    if (providerId && update.providerId !== providerId) {
      return;
    }

    switch (update.type) {
      case 'metrics':
        setMetrics(prev => ({
          ...prev,
          ...update.data,
          lastUpdated: new Date()
        }));
        break;
        
      case 'bookings':
        if (update.data.recentBookings) {
          setRecentBookings(update.data.recentBookings);
        }
        // Update booking-related metrics
        if (update.data.bookingMetrics) {
          setMetrics(prev => ({
            ...prev,
            ...update.data.bookingMetrics,
            lastUpdated: new Date()
          }));
        }
        break;
        
      case 'revenue':
        setMetrics(prev => ({
          ...prev,
          totalRevenue: update.data.totalRevenue,
          revenueGrowth: update.data.revenueGrowth,
          lastUpdated: new Date()
        }));
        break;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-500';
      case 'confirmed':
        return 'bg-blue-500';
      case 'completed':
        return 'bg-green-500';
      case 'cancelled':
        return 'bg-red-500';
      default:
        return 'bg-gray-500';
    }
  };

  const getStatusVariant = (status: string): "default" | "secondary" | "destructive" | "outline" => {
    switch (status) {
      case 'pending':
        return 'outline';
      case 'confirmed':
        return 'default';
      case 'completed':
        return 'secondary';
      case 'cancelled':
        return 'destructive';
      default:
        return 'outline';
    }
  };

  if (loading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[...Array(8)].map((_, i) => (
          <Card key={i}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <div className="h-4 bg-gray-200 rounded w-24 animate-pulse"></div>
              <div className="h-4 w-4 bg-gray-200 rounded animate-pulse"></div>
            </CardHeader>
            <CardContent>
              <div className="h-8 bg-gray-200 rounded w-16 animate-pulse mb-2"></div>
              <div className="h-3 bg-gray-200 rounded w-32 animate-pulse"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold">
            {userRole === 'admin' ? 'Platform Dashboard' : 'Provider Dashboard'}
          </h2>
        </div>
        <Card>
          <CardContent className="p-8 text-center">
            <div className="flex flex-col items-center">
              <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center mb-4">
                <Activity className="h-6 w-6 text-red-600" />
              </div>
              <h3 className="text-lg font-medium mb-2">Dashboard Unavailable</h3>
              <p className="text-muted-foreground mb-4">{error}</p>
              <button 
                onClick={loadDashboardData}
                className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
              >
                Try Again
              </button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Connection Status */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">
          {userRole === 'admin' ? 'Platform Dashboard' : 'Provider Dashboard'}
        </h2>
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${
            connectionStatus === 'connected' ? 'bg-green-500' : 
            connectionStatus === 'connecting' ? 'bg-yellow-500' : 'bg-red-500'
          }`} />
          <span className="text-sm text-muted-foreground">
            {connectionStatus === 'connected' ? 'Live' : connectionStatus}
          </span>
          <Badge variant="outline" className="text-xs">
            Updated {format(metrics.lastUpdated, 'h:mm:ss a')}
          </Badge>
        </div>
      </div>

      {/* Metrics Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Bookings</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.totalBookings}</div>
            <div className="flex items-center text-xs text-muted-foreground">
              {metrics.monthlyGrowth >= 0 ? (
                <TrendingUp className="h-3 w-3 text-green-500 mr-1" />
              ) : (
                <TrendingDown className="h-3 w-3 text-red-500 mr-1" />
              )}
              {Math.abs(metrics.monthlyGrowth)}% from last month
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${metrics.totalRevenue.toLocaleString()}</div>
            <div className="flex items-center text-xs text-muted-foreground">
              {metrics.revenueGrowth >= 0 ? (
                <TrendingUp className="h-3 w-3 text-green-500 mr-1" />
              ) : (
                <TrendingDown className="h-3 w-3 text-red-500 mr-1" />
              )}
              {Math.abs(metrics.revenueGrowth)}% from last month
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Average Rating</CardTitle>
            <Star className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.averageRating.toFixed(1)}</div>
            <div className="flex items-center text-xs text-muted-foreground">
              <Progress value={metrics.averageRating * 20} className="w-16 h-1 mr-2" />
              out of 5.0
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Customers</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.activeCustomers}</div>
            <div className="text-xs text-muted-foreground">
              This month
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Booking Status Overview */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Bookings</CardTitle>
            <Activity className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{metrics.pendingBookings}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completed Bookings</CardTitle>
            <Activity className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{metrics.completedBookings}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Cancelled Bookings</CardTitle>
            <Activity className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{metrics.cancelledBookings}</div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Bookings */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Bookings</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {recentBookings.length === 0 ? (
              <p className="text-muted-foreground text-center py-4">No recent bookings</p>
            ) : (
              recentBookings.map((booking) => (
                <div key={booking.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className={`w-3 h-3 rounded-full ${getStatusColor(booking.status)}`} />
                    <div>
                      <p className="font-medium">{booking.customerName}</p>
                      <p className="text-sm text-muted-foreground">{booking.serviceName}</p>
                    </div>
                  </div>
                  
                  <div className="text-right">
                    <p className="font-medium">${booking.amount.toFixed(2)}</p>
                    <div className="flex items-center gap-2">
                      <Badge variant={getStatusVariant(booking.status)} className="text-xs">
                        {booking.status}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        {format(booking.date, 'MMM d')}
                      </span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}