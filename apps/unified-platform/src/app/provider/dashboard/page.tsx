'use client';

import { Metadata } from 'next';
import { useAuth } from '@/lib/auth-context';
import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@mounasabet/ui';
import { Button } from '@mounasabet/ui';
import { Badge } from '@mounasabet/ui';
import { 
  Calendar, 
  DollarSign, 
  Package, 
  Star, 
  TrendingUp, 
  Users,
  Clock,
  CheckCircle,
  AlertCircle,
  Plus
} from 'lucide-react';
import Link from 'next/link';

interface DashboardMetrics {
  totalBookings: number;
  monthlyRevenue: number;
  activeServices: number;
  averageRating: number;
  pendingBookings: number;
  completedBookings: number;
  recentBookings: any[];
}

export default function ProviderDashboardPage() {
  const { session } = useAuth();
  const [metrics, setMetrics] = useState<DashboardMetrics>({
    totalBookings: 0,
    monthlyRevenue: 0,
    activeServices: 0,
    averageRating: 0,
    pendingBookings: 0,
    completedBookings: 0,
    recentBookings: []
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (session?.user) {
      fetchDashboardData();
    }
  }, [session]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      // Fetch provider metrics
      const metricsResponse = await fetch('/api/provider/metrics');
      if (metricsResponse.ok) {
        const metricsData = await metricsResponse.json();
        setMetrics(metricsData);
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-64 mb-8"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-32 bg-gray-200 rounded-lg"></div>
            ))}
          </div>
          <div className="h-96 bg-gray-200 rounded-lg"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Provider Dashboard</h1>
        <div className="flex gap-4">
          <Button asChild>
            <Link href="/provider/services/new">
              <Plus className="mr-2 h-4 w-4" />
              Add Service
            </Link>
          </Button>
        </div>
      </div>
      
      {/* Metrics cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Bookings</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.totalBookings}</div>
            <p className="text-xs text-muted-foreground">
              {metrics.pendingBookings} pending
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Monthly Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {new Intl.NumberFormat('en-TN', {
                style: 'currency',
                currency: 'TND'
              }).format(metrics.monthlyRevenue)}
            </div>
            <p className="text-xs text-muted-foreground">
              <TrendingUp className="inline h-3 w-3 mr-1" />
              +12% from last month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Services</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.activeServices}</div>
            <p className="text-xs text-muted-foreground">
              Services available for booking
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Average Rating</CardTitle>
            <Star className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold flex items-center">
              {metrics.averageRating.toFixed(1)}
              <Star className="h-5 w-5 text-yellow-400 fill-current ml-1" />
            </div>
            <p className="text-xs text-muted-foreground">
              Based on customer reviews
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Clock className="mr-2 h-5 w-5" />
              Pending Actions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm">Pending Bookings</span>
                <Badge variant="secondary">{metrics.pendingBookings}</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Awaiting Reviews</span>
                <Badge variant="secondary">3</Badge>
              </div>
              <Button variant="outline" size="sm" className="w-full mt-4" asChild>
                <Link href="/provider/bookings?status=pending">
                  View All Pending
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <CheckCircle className="mr-2 h-5 w-5" />
              Recent Activity
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="text-sm">
                <p className="font-medium">New booking received</p>
                <p className="text-muted-foreground">Wedding photography - 2 hours ago</p>
              </div>
              <div className="text-sm">
                <p className="font-medium">Service updated</p>
                <p className="text-muted-foreground">Catering package - 1 day ago</p>
              </div>
              <Button variant="outline" size="sm" className="w-full mt-4" asChild>
                <Link href="/provider/analytics">
                  View Analytics
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Users className="mr-2 h-5 w-5" />
              Customer Insights
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm">Repeat Customers</span>
                <span className="text-sm font-medium">23%</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Customer Satisfaction</span>
                <span className="text-sm font-medium">4.8/5</span>
              </div>
              <Button variant="outline" size="sm" className="w-full mt-4" asChild>
                <Link href="/provider/customers">
                  View Customers
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Bookings */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Bookings</CardTitle>
        </CardHeader>
        <CardContent>
          {metrics.recentBookings.length > 0 ? (
            <div className="space-y-4">
              {metrics.recentBookings.map((booking: any) => (
                <div key={booking.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center space-x-4">
                    <div className="flex-shrink-0">
                      {booking.status === 'CONFIRMED' ? (
                        <CheckCircle className="h-5 w-5 text-green-500" />
                      ) : (
                        <Clock className="h-5 w-5 text-yellow-500" />
                      )}
                    </div>
                    <div>
                      <p className="font-medium">{booking.service?.name || 'Service'}</p>
                      <p className="text-sm text-muted-foreground">
                        {booking.user?.name} • {new Date(booking.startTime).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Badge 
                      variant={booking.status === 'CONFIRMED' ? 'default' : 'secondary'}
                    >
                      {booking.status}
                    </Badge>
                    <Button variant="outline" size="sm" asChild>
                      <Link href={`/provider/bookings/${booking.id}`}>
                        View
                      </Link>
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <AlertCircle className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">No recent bookings</h3>
              <p className="text-muted-foreground mb-4">
                Start by creating your services to receive bookings
              </p>
              <Button asChild>
                <Link href="/provider/services/new">
                  Create Your First Service
                </Link>
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}