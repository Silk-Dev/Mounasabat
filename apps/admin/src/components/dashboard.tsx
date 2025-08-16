"use client";

import React, { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@mounasabet/ui";
import { Users, Calendar, DollarSign, TrendingUp, AlertCircle } from "lucide-react";
import { LoadingSpinner } from "./LoadingSpinner";
import { ErrorState } from "./ErrorState";
import { EmptyState } from "./EmptyState";

interface DashboardMetrics {
  overview: {
    totalUsers: {
      value: number;
      growth: string;
      trend: string;
    };
    totalProviders: {
      value: number;
      growth: string;
      trend: string;
    };
    verifiedProviders: {
      value: number;
      percentage: string;
    };
    totalBookings: {
      value: number;
      growth: string;
      trend: string;
    };
    totalOrders: {
      value: number;
    };
    openIssues: {
      value: number;
      trend: string;
    };
  };
  breakdowns: {
    issuesByPriority: Record<string, number>;
    usersByRole: Record<string, number>;
    bookingsByStatus: Record<string, number>;
  };
  recentActivity: Array<{
    type: string;
    message: string;
    timestamp: string;
    userId?: string;
    bookingId?: string;
    issueId?: string;
  }>;
}

const Dashboard: React.FC = () => {
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch('/api/admin/dashboard');
      
      if (!response.ok) {
        throw new Error(`Failed to fetch dashboard data: ${response.status}`);
      }
      
      const data = await response.json();
      setMetrics(data.metrics);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      setError(error instanceof Error ? error.message : 'Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const handleRetry = () => {
    fetchDashboardData();
  };

  if (loading) {
    return (
      <div className="p-4">
        <h2 className="text-2xl font-bold mb-4">Dashboard Overview</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <Card key={i}>
              <CardHeader>
                <div className="h-4 bg-gray-200 rounded w-24 animate-pulse"></div>
              </CardHeader>
              <CardContent>
                <div className="h-8 bg-gray-200 rounded w-16 animate-pulse mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-20 animate-pulse"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4">
        <h2 className="text-2xl font-bold mb-4">Dashboard Overview</h2>
        <ErrorState 
          title="Failed to load dashboard data"
          description={error}
          onRetry={handleRetry}
        />
      </div>
    );
  }

  if (!metrics) {
    return (
      <div className="p-4">
        <h2 className="text-2xl font-bold mb-4">Dashboard Overview</h2>
        <EmptyState 
          title="No dashboard data available"
          description="Dashboard metrics could not be loaded. Please try again later."
          action={{
            label: "Retry",
            onClick: handleRetry
          }}
        />
      </div>
    );
  }

  const formatNumber = (num: number) => {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + 'M';
    }
    if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'K';
    }
    return num.toString();
  };

  const getTrendIcon = (trend: string) => {
    if (trend === 'up') {
      return <TrendingUp className="h-4 w-4 text-green-500" />;
    }
    if (trend === 'warning') {
      return <AlertCircle className="h-4 w-4 text-yellow-500" />;
    }
    return null;
  };

  return (
    <div className="p-4">
      <h2 className="text-2xl font-bold mb-4">Dashboard Overview</h2>
      
      {/* Main Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatNumber(metrics.overview.totalUsers.value)}</div>
            <div className="flex items-center text-xs text-muted-foreground">
              {getTrendIcon(metrics.overview.totalUsers.trend)}
              <span className="ml-1">{metrics.overview.totalUsers.growth} from last month</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Bookings</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatNumber(metrics.overview.totalBookings.value)}</div>
            <div className="flex items-center text-xs text-muted-foreground">
              {getTrendIcon(metrics.overview.totalBookings.trend)}
              <span className="ml-1">{metrics.overview.totalBookings.growth} from last month</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatNumber(metrics.overview.totalOrders.value)}</div>
            <p className="text-xs text-muted-foreground">
              All time orders
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Service Providers</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatNumber(metrics.overview.totalProviders.value)}</div>
            <div className="flex items-center text-xs text-muted-foreground">
              {getTrendIcon(metrics.overview.totalProviders.trend)}
              <span className="ml-1">{metrics.overview.totalProviders.growth} from last month</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Verified Providers</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatNumber(metrics.overview.verifiedProviders.value)}</div>
            <p className="text-xs text-muted-foreground">
              {metrics.overview.verifiedProviders.percentage}% of all providers
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Open Issues</CardTitle>
            <AlertCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatNumber(metrics.overview.openIssues.value)}</div>
            <div className="flex items-center text-xs text-muted-foreground">
              {getTrendIcon(metrics.overview.openIssues.trend)}
              <span className="ml-1">Requires attention</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      {metrics.recentActivity.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {metrics.recentActivity.slice(0, 5).map((activity, index) => (
                <div key={index} className="flex items-center space-x-3 text-sm">
                  <div className={`w-2 h-2 rounded-full ${
                    activity.type === 'user_signup' ? 'bg-green-500' :
                    activity.type === 'booking' ? 'bg-blue-500' :
                    activity.type === 'issue' ? 'bg-red-500' : 'bg-gray-500'
                  }`} />
                  <span className="flex-1">{activity.message}</span>
                  <span className="text-muted-foreground">
                    {new Date(activity.timestamp).toLocaleDateString()}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default Dashboard;
