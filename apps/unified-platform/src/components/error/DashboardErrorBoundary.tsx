'use client';

import React from 'react';
import ErrorBoundary, { ErrorBoundaryFallbackProps } from './ErrorBoundary';
import { BarChart3, RefreshCw, Settings, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

const DashboardErrorFallback: React.FC<ErrorBoundaryFallbackProps> = ({ error, retry }) => {
  const handleRefreshData = () => {
    // Clear dashboard cache and retry
    localStorage.removeItem('dashboardCache');
    sessionStorage.removeItem('dashboardFilters');
    retry();
  };

  const handleBasicView = () => {
    // Redirect to basic dashboard view
    const currentPath = window.location.pathname;
    const basePath = currentPath.includes('/provider/') ? '/provider/dashboard' : '/admin/dashboard';
    window.location.href = `${basePath}?view=basic`;
  };

  const handleSettings = () => {
    // Go to settings page
    const currentPath = window.location.pathname;
    const settingsPath = currentPath.includes('/provider/') ? '/provider/settings' : '/admin/settings';
    window.location.href = settingsPath;
  };

  const handleLogout = () => {
    // Logout and redirect to login
    fetch('/api/auth/logout', { method: 'POST' })
      .then(() => {
        window.location.href = '/auth/signin';
      })
      .catch(() => {
        window.location.href = '/auth/signin';
      });
  };

  return (
    <div className="flex items-center justify-center p-8">
      <Card className="w-full max-w-lg">
        <CardHeader className="text-center">
          <div className="mx-auto w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mb-4">
            <BarChart3 className="w-6 h-6 text-purple-600" />
          </div>
          <CardTitle className="text-xl font-semibold text-gray-900">
            Dashboard Error
          </CardTitle>
          <CardDescription>
            We encountered an issue loading your dashboard. This might be due to a data loading problem or session issue.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <Button onClick={retry} className="w-full">
            <RefreshCw className="w-4 h-4 mr-2" />
            Reload Dashboard
          </Button>
          <Button variant="outline" onClick={handleRefreshData} className="w-full">
            <RefreshCw className="w-4 h-4 mr-2" />
            Clear Cache & Reload
          </Button>
          <Button variant="outline" onClick={handleBasicView} className="w-full">
            <BarChart3 className="w-4 h-4 mr-2" />
            Basic View
          </Button>
          <Button variant="ghost" onClick={handleSettings} className="w-full">
            <Settings className="w-4 h-4 mr-2" />
            Settings
          </Button>
          <Button variant="ghost" onClick={handleLogout} className="w-full text-red-600 hover:text-red-700">
            <LogOut className="w-4 h-4 mr-2" />
            Logout
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

interface DashboardErrorBoundaryProps {
  children: React.ReactNode;
}

const DashboardErrorBoundary: React.FC<DashboardErrorBoundaryProps> = ({ children }) => {
  return (
    <ErrorBoundary
      fallback={DashboardErrorFallback}
      section="dashboard"
      onError={(error, errorInfo) => {
        // Log dashboard-specific error context
        console.error('Dashboard error:', {
          error: error.message,
          userRole: localStorage.getItem('userRole'),
          dashboardFilters: sessionStorage.getItem('dashboardFilters'),
          componentStack: errorInfo.componentStack,
        });
      }}
    >
      {children}
    </ErrorBoundary>
  );
};

export default DashboardErrorBoundary;