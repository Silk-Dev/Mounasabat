'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  AlertTriangle, 
  Activity, 
  Users, 
  Clock, 
  TrendingUp, 
  TrendingDown, 
  Minus,
  RefreshCw,
  Bell,
  CheckCircle,
  XCircle,
  AlertCircle
} from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { toast } from 'sonner';

interface SentryDashboardProps {
  className?: string;
}

interface DashboardMetrics {
  errorCount: number;
  errorRate: number;
  performanceMetrics: {
    averageResponseTime: number;
    slowestEndpoints: Array<{
      endpoint: string;
      averageTime: number;
      count: number;
    }>;
    p95ResponseTime: number;
    p99ResponseTime: number;
  };
  userImpact: {
    affectedUsers: number;
    totalUsers: number;
    impactPercentage: number;
  };
  systemHealth: {
    uptime: number;
    memoryUsage: number;
    errorsByCategory: Record<string, number>;
    criticalErrors: number;
  };
  trends: {
    errorTrend: 'increasing' | 'decreasing' | 'stable';
    performanceTrend: 'improving' | 'degrading' | 'stable';
    userSatisfactionTrend: 'improving' | 'degrading' | 'stable';
  };
}

interface SentryAlert {
  id: string;
  type: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  message: string;
  timestamp: Date;
  resolved: boolean;
  affectedComponents: string[];
  actionRequired: boolean;
}

export function SentryDashboard({ className }: SentryDashboardProps) {
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [alerts, setAlerts] = useState<SentryAlert[]>([]);
  const [errorTrends, setErrorTrends] = useState<any[]>([]);
  const [performanceTrends, setPerformanceTrends] = useState<any[]>([]);
  const [timeRange, setTimeRange] = useState<'1h' | '24h' | '7d' | '30d'>('24h');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchDashboardData = async (showRefreshing = false) => {
    try {
      if (showRefreshing) setRefreshing(true);
      else setLoading(true);

      const response = await fetch(`/api/admin/monitoring/sentry?timeRange=${timeRange}`);
      const data = await response.json();

      if (data.success) {
        setMetrics(data.data.metrics);
        setAlerts(data.data.alerts);
        setErrorTrends(data.data.errorTrends);
        setPerformanceTrends(data.data.performanceTrends);
      } else {
        toast.error('Failed to load dashboard data');
      }
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, [timeRange]);

  const handleResolveAlert = async (alertId: string) => {
    try {
      const response = await fetch('/api/admin/monitoring/sentry', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'resolve-alert', alertId }),
      });

      const data = await response.json();
      if (data.success) {
        toast.success('Alert resolved successfully');
        fetchDashboardData(true);
      } else {
        toast.error('Failed to resolve alert');
      }
    } catch (error) {
      toast.error('Failed to resolve alert');
    }
  };

  const handleTestAlert = async (type: 'error' | 'performance' | 'memory') => {
    try {
      const response = await fetch('/api/admin/monitoring/sentry', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'test-alert', type }),
      });

      const data = await response.json();
      if (data.success) {
        toast.success(`Test ${type} alert triggered`);
      } else {
        toast.error('Failed to trigger test alert');
      }
    } catch (error) {
      toast.error('Failed to trigger test alert');
    }
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'increasing':
      case 'degrading':
        return <TrendingUp className="h-4 w-4 text-red-500" />;
      case 'decreasing':
      case 'improving':
        return <TrendingDown className="h-4 w-4 text-green-500" />;
      default:
        return <Minus className="h-4 w-4 text-gray-500" />;
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'bg-red-500';
      case 'high': return 'bg-orange-500';
      case 'medium': return 'bg-yellow-500';
      case 'low': return 'bg-blue-500';
      default: return 'bg-gray-500';
    }
  };

  const formatUptime = (seconds: number) => {
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${days}d ${hours}h ${minutes}m`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className={className}>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold">Sentry Monitoring Dashboard</h2>
          <p className="text-muted-foreground">System health and error monitoring</p>
        </div>
        <div className="flex items-center gap-4">
          <Select value={timeRange} onValueChange={(value: any) => setTimeRange(value)}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1h">Last Hour</SelectItem>
              <SelectItem value="24h">Last 24h</SelectItem>
              <SelectItem value="7d">Last 7 days</SelectItem>
              <SelectItem value="30d">Last 30 days</SelectItem>
            </SelectContent>
          </Select>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => fetchDashboardData(true)}
            disabled={refreshing}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Errors</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics?.errorCount || 0}</div>
            <div className="flex items-center text-xs text-muted-foreground">
              {getTrendIcon(metrics?.trends.errorTrend || 'stable')}
              <span className="ml-1">
                {metrics?.trends.errorTrend || 'stable'}
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Error Rate</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {((metrics?.errorRate || 0) * 100).toFixed(2)}%
            </div>
            <p className="text-xs text-muted-foreground">
              of total requests
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Affected Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics?.userImpact.affectedUsers || 0}</div>
            <p className="text-xs text-muted-foreground">
              {(metrics?.userImpact.impactPercentage || 0).toFixed(1)}% of total users
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Response Time</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {(metrics?.performanceMetrics.averageResponseTime || 0).toFixed(0)}ms
            </div>
            <div className="flex items-center text-xs text-muted-foreground">
              {getTrendIcon(metrics?.trends.performanceTrend || 'stable')}
              <span className="ml-1">
                {metrics?.trends.performanceTrend || 'stable'}
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="alerts">
            Alerts
            {alerts.filter(a => !a.resolved).length > 0 && (
              <Badge variant="destructive" className="ml-2">
                {alerts.filter(a => !a.resolved).length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="testing">Testing</TabsTrigger>
        </TabsList> 
       <TabsContent value="overview" className="space-y-6">
          {/* System Health */}
          <Card>
            <CardHeader>
              <CardTitle>System Health</CardTitle>
              <CardDescription>Current system status and metrics</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <div className="text-sm font-medium text-muted-foreground">Uptime</div>
                  <div className="text-2xl font-bold">
                    {formatUptime(metrics?.systemHealth.uptime || 0)}
                  </div>
                </div>
                <div>
                  <div className="text-sm font-medium text-muted-foreground">Memory Usage</div>
                  <div className="text-2xl font-bold">
                    {(metrics?.systemHealth.memoryUsage || 0).toFixed(1)} MB
                  </div>
                </div>
                <div>
                  <div className="text-sm font-medium text-muted-foreground">Critical Errors</div>
                  <div className="text-2xl font-bold text-red-600">
                    {metrics?.systemHealth.criticalErrors || 0}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Error Trends Chart */}
          <Card>
            <CardHeader>
              <CardTitle>Error Trends</CardTitle>
              <CardDescription>Error count and rate over time</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={errorTrends}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      dataKey="timestamp" 
                      tickFormatter={(value) => new Date(value).toLocaleTimeString()}
                    />
                    <YAxis />
                    <Tooltip 
                      labelFormatter={(value) => new Date(value).toLocaleString()}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="errorCount" 
                      stroke="#ef4444" 
                      strokeWidth={2}
                      name="Error Count"
                    />
                    <Line 
                      type="monotone" 
                      dataKey="errorRate" 
                      stroke="#f97316" 
                      strokeWidth={2}
                      name="Error Rate"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Slowest Endpoints */}
          <Card>
            <CardHeader>
              <CardTitle>Slowest Endpoints</CardTitle>
              <CardDescription>API endpoints with highest response times</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {metrics?.performanceMetrics.slowestEndpoints.map((endpoint, index) => (
                  <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <div className="font-medium">{endpoint.endpoint}</div>
                      <div className="text-sm text-muted-foreground">
                        {endpoint.count} requests
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold">{endpoint.averageTime.toFixed(0)}ms</div>
                      <div className="text-sm text-muted-foreground">avg</div>
                    </div>
                  </div>
                ))}
                {(!metrics?.performanceMetrics.slowestEndpoints || 
                  metrics.performanceMetrics.slowestEndpoints.length === 0) && (
                  <div className="text-center text-muted-foreground py-8">
                    No performance data available
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="alerts" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Active Alerts</CardTitle>
              <CardDescription>Current system alerts and notifications</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {alerts.filter(alert => !alert.resolved).map((alert) => (
                  <Alert key={alert.id} className="relative">
                    <div className={`absolute left-0 top-0 bottom-0 w-1 ${getSeverityColor(alert.severity)}`} />
                    <div className="ml-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          {alert.severity === 'critical' && <AlertCircle className="h-4 w-4 text-red-500" />}
                          {alert.severity === 'high' && <AlertTriangle className="h-4 w-4 text-orange-500" />}
                          {alert.severity === 'medium' && <AlertCircle className="h-4 w-4 text-yellow-500" />}
                          {alert.severity === 'low' && <Bell className="h-4 w-4 text-blue-500" />}
                          <AlertTitle>{alert.title}</AlertTitle>
                          <Badge variant="outline" className={getSeverityColor(alert.severity)}>
                            {alert.severity}
                          </Badge>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleResolveAlert(alert.id)}
                        >
                          <CheckCircle className="h-4 w-4 mr-2" />
                          Resolve
                        </Button>
                      </div>
                      <AlertDescription className="mt-2">
                        {alert.message}
                      </AlertDescription>
                      <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                        <span>{new Date(alert.timestamp).toLocaleString()}</span>
                        {alert.affectedComponents.length > 0 && (
                          <span>Components: {alert.affectedComponents.join(', ')}</span>
                        )}
                      </div>
                    </div>
                  </Alert>
                ))}
                {alerts.filter(alert => !alert.resolved).length === 0 && (
                  <div className="text-center text-muted-foreground py-8">
                    <CheckCircle className="h-12 w-12 mx-auto mb-4 text-green-500" />
                    No active alerts
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Resolved Alerts */}
          {alerts.filter(alert => alert.resolved).length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Recently Resolved Alerts</CardTitle>
                <CardDescription>Alerts resolved in the last 24 hours</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {alerts.filter(alert => alert.resolved).slice(0, 5).map((alert) => (
                    <div key={alert.id} className="flex items-center justify-between p-2 border rounded">
                      <div className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-green-500" />
                        <span className="text-sm">{alert.title}</span>
                        <Badge variant="outline" className="text-xs">
                          {alert.severity}
                        </Badge>
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {new Date(alert.timestamp).toLocaleString()}
                      </span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="performance" className="space-y-6">
          {/* Performance Trends Chart */}
          <Card>
            <CardHeader>
              <CardTitle>Performance Trends</CardTitle>
              <CardDescription>Response time and throughput over time</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={performanceTrends}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      dataKey="timestamp" 
                      tickFormatter={(value) => new Date(value).toLocaleTimeString()}
                    />
                    <YAxis />
                    <Tooltip 
                      labelFormatter={(value) => new Date(value).toLocaleString()}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="averageResponseTime" 
                      stroke="#3b82f6" 
                      strokeWidth={2}
                      name="Avg Response Time (ms)"
                    />
                    <Line 
                      type="monotone" 
                      dataKey="p95ResponseTime" 
                      stroke="#ef4444" 
                      strokeWidth={2}
                      name="P95 Response Time (ms)"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Performance Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Average Response Time</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">
                  {(metrics?.performanceMetrics.averageResponseTime || 0).toFixed(0)}ms
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>95th Percentile</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">
                  {(metrics?.performanceMetrics.p95ResponseTime || 0).toFixed(0)}ms
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>99th Percentile</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">
                  {(metrics?.performanceMetrics.p99ResponseTime || 0).toFixed(0)}ms
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="testing" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Alert Testing</CardTitle>
              <CardDescription>Test Sentry alerts and monitoring functionality</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Button
                  variant="outline"
                  onClick={() => handleTestAlert('error')}
                  className="flex items-center gap-2"
                >
                  <XCircle className="h-4 w-4" />
                  Test Error Alert
                </Button>
                <Button
                  variant="outline"
                  onClick={() => handleTestAlert('performance')}
                  className="flex items-center gap-2"
                >
                  <Clock className="h-4 w-4" />
                  Test Performance Alert
                </Button>
                <Button
                  variant="outline"
                  onClick={() => handleTestAlert('memory')}
                  className="flex items-center gap-2"
                >
                  <Activity className="h-4 w-4" />
                  Test Memory Alert
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Configuration</CardTitle>
              <CardDescription>Current Sentry monitoring configuration</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <div className="font-medium">Environment</div>
                    <div className="text-muted-foreground">{process.env.NODE_ENV}</div>
                  </div>
                  <div>
                    <div className="font-medium">DSN Configured</div>
                    <div className="text-muted-foreground">
                      {process.env.SENTRY_DSN ? 'Yes' : 'No'}
                    </div>
                  </div>
                  <div>
                    <div className="font-medium">Traces Sample Rate</div>
                    <div className="text-muted-foreground">
                      {process.env.NODE_ENV === 'production' ? '10%' : '100%'}
                    </div>
                  </div>
                  <div>
                    <div className="font-medium">Profiles Sample Rate</div>
                    <div className="text-muted-foreground">
                      {process.env.NODE_ENV === 'production' ? '10%' : '100%'}
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}