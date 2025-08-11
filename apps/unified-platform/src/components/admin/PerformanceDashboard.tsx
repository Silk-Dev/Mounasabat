'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { usePerformanceMonitor } from '@/lib/performance-monitor';

interface PerformanceMetrics {
  total: number;
  byType: Record<string, {
    count: number;
    values: number[];
    averages: {
      mean: number;
      median: number;
      p75: number;
      p95: number;
      p99: number;
    };
  }>;
  byUrl: Record<string, { count: number }>;
  timeline: Record<string, { count: number }>;
}

export default function PerformanceDashboard() {
  const { metrics: liveMetrics } = usePerformanceMonitor();
  const [serverMetrics, setServerMetrics] = useState<PerformanceMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('24h');

  useEffect(() => {
    fetchServerMetrics();
  }, [timeRange]);

  const fetchServerMetrics = async () => {
    try {
      setLoading(true);
      const endDate = new Date();
      const startDate = new Date();
      
      switch (timeRange) {
        case '1h':
          startDate.setHours(startDate.getHours() - 1);
          break;
        case '24h':
          startDate.setDate(startDate.getDate() - 1);
          break;
        case '7d':
          startDate.setDate(startDate.getDate() - 7);
          break;
        case '30d':
          startDate.setDate(startDate.getDate() - 30);
          break;
      }

      const response = await fetch(
        `/api/analytics/performance?startDate=${startDate.toISOString()}&endDate=${endDate.toISOString()}`
      );
      
      if (response.ok) {
        const data = await response.json();
        setServerMetrics(data);
      }
    } catch (error) {
      console.error('Error fetching performance metrics:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDuration = (ms: number) => {
    if (ms < 1000) return `${Math.round(ms)}ms`;
    return `${(ms / 1000).toFixed(2)}s`;
  };

  const getPerformanceStatus = (type: string, value: number) => {
    switch (type) {
      case 'LCP':
        if (value <= 2500) return 'good';
        if (value <= 4000) return 'needs-improvement';
        return 'poor';
      case 'FID':
        if (value <= 100) return 'good';
        if (value <= 300) return 'needs-improvement';
        return 'poor';
      case 'CLS':
        if (value <= 0.1) return 'good';
        if (value <= 0.25) return 'needs-improvement';
        return 'poor';
      default:
        return 'unknown';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'good':
        return 'text-green-600 bg-green-100';
      case 'needs-improvement':
        return 'text-yellow-600 bg-yellow-100';
      case 'poor':
        return 'text-red-600 bg-red-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="bg-gray-200 rounded-lg h-32 mb-6"></div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="bg-gray-200 rounded-lg h-24"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Performance Dashboard</h1>
        <select
          value={timeRange}
          onChange={(e) => setTimeRange(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="1h">Last Hour</option>
          <option value="24h">Last 24 Hours</option>
          <option value="7d">Last 7 Days</option>
          <option value="30d">Last 30 Days</option>
        </select>
      </div>

      {/* Core Web Vitals */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {['LCP', 'FID', 'CLS'].map((vital) => {
          const data = serverMetrics?.byType[vital];
          const average = data?.averages?.mean || 0;
          const status = getPerformanceStatus(vital, average);
          
          return (
            <Card key={vital}>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">
                  {vital === 'LCP' && 'Largest Contentful Paint'}
                  {vital === 'FID' && 'First Input Delay'}
                  {vital === 'CLS' && 'Cumulative Layout Shift'}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div className="text-2xl font-bold">
                    {vital === 'CLS' ? average.toFixed(3) : formatDuration(average)}
                  </div>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(status)}`}>
                    {status.replace('-', ' ')}
                  </span>
                </div>
                <div className="mt-2 text-sm text-gray-600">
                  {data?.count || 0} measurements
                </div>
                {data?.averages && (
                  <div className="mt-2 text-xs text-gray-500">
                    <div>P75: {vital === 'CLS' ? data.averages.p75.toFixed(3) : formatDuration(data.averages.p75)}</div>
                    <div>P95: {vital === 'CLS' ? data.averages.p95.toFixed(3) : formatDuration(data.averages.p95)}</div>
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Other Performance Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {Object.entries(serverMetrics?.byType || {})
          .filter(([type]) => !['LCP', 'FID', 'CLS'].includes(type))
          .map(([type, data]) => (
            <Card key={type}>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">{type}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{data.count}</div>
                {data.averages && (
                  <div className="mt-2 text-sm text-gray-600">
                    Avg: {formatDuration(data.averages.mean)}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
      </div>

      {/* Top Pages by Performance Issues */}
      <Card>
        <CardHeader>
          <CardTitle>Pages by Traffic</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {Object.entries(serverMetrics?.byUrl || {})
              .sort(([, a], [, b]) => b.count - a.count)
              .slice(0, 10)
              .map(([url, data]) => (
                <div key={url} className="flex justify-between items-center py-2 border-b border-gray-100">
                  <span className="text-sm font-medium">{url || '/'}</span>
                  <span className="text-sm text-gray-600">{data.count} views</span>
                </div>
              ))}
          </div>
        </CardContent>
      </Card>

      {/* Live Metrics (Client-side) */}
      <Card>
        <CardHeader>
          <CardTitle>Live Client Metrics</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {Object.entries(liveMetrics).map(([type, metrics]) => (
              <div key={type} className="text-center">
                <div className="text-lg font-semibold">{Array.isArray(metrics) ? metrics.length : 0}</div>
                <div className="text-sm text-gray-600">{type}</div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Performance Recommendations */}
      <Card>
        <CardHeader>
          <CardTitle>Performance Recommendations</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {getPerformanceRecommendations(serverMetrics).map((recommendation, index) => (
              <div key={index} className="flex items-start space-x-3 p-3 bg-blue-50 rounded-lg">
                <div className="flex-shrink-0 w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                <div>
                  <div className="font-medium text-blue-900">{recommendation.title}</div>
                  <div className="text-sm text-blue-700">{recommendation.description}</div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function getPerformanceRecommendations(metrics: PerformanceMetrics | null) {
  const recommendations = [];

  if (!metrics) return recommendations;

  // Check LCP
  const lcp = metrics.byType.LCP?.averages?.mean;
  if (lcp && lcp > 2500) {
    recommendations.push({
      title: 'Improve Largest Contentful Paint',
      description: 'Consider optimizing images, reducing server response times, and eliminating render-blocking resources.',
    });
  }

  // Check FID
  const fid = metrics.byType.FID?.averages?.mean;
  if (fid && fid > 100) {
    recommendations.push({
      title: 'Reduce First Input Delay',
      description: 'Break up long tasks, optimize JavaScript execution, and use web workers for heavy computations.',
    });
  }

  // Check CLS
  const cls = metrics.byType.CLS?.averages?.mean;
  if (cls && cls > 0.1) {
    recommendations.push({
      title: 'Minimize Cumulative Layout Shift',
      description: 'Set size attributes on images and videos, avoid inserting content above existing content.',
    });
  }

  // Check for long tasks
  const longTasks = metrics.byType.LongTask?.count;
  if (longTasks && longTasks > 10) {
    recommendations.push({
      title: 'Reduce Long Tasks',
      description: 'Break up JavaScript execution into smaller chunks and use requestIdleCallback for non-critical work.',
    });
  }

  // Check API performance
  const apiRequests = metrics.byType.APIRequest?.averages?.mean;
  if (apiRequests && apiRequests > 1000) {
    recommendations.push({
      title: 'Optimize API Performance',
      description: 'Implement caching, optimize database queries, and consider using a CDN for static assets.',
    });
  }

  return recommendations;
}