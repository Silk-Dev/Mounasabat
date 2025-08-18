'use client';

import React from 'react';
import { SentryDashboard } from '@/components/admin/SentryDashboard';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Activity, AlertTriangle, BarChart3, Shield } from 'lucide-react';

export default function AdminMonitoringPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">System Monitoring</h1>
        <p className="text-muted-foreground mt-2">
          Monitor system health, errors, performance, and security across the platform
        </p>
      </div>

      <Tabs defaultValue="sentry" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="sentry" className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4" />
            Error Monitoring
          </TabsTrigger>
          <TabsTrigger value="performance" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Performance
          </TabsTrigger>
          <TabsTrigger value="health" className="flex items-center gap-2">
            <Activity className="h-4 w-4" />
            Health Checks
          </TabsTrigger>
          <TabsTrigger value="security" className="flex items-center gap-2">
            <Shield className="h-4 w-4" />
            Security
          </TabsTrigger>
        </TabsList>

        <TabsContent value="sentry">
          <SentryDashboard />
        </TabsContent>

        <TabsContent value="performance">
          <div className="grid gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Performance Monitoring</CardTitle>
                <CardDescription>
                  Track API response times, database query performance, and system resources
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8 text-muted-foreground">
                  Performance monitoring dashboard coming soon...
                  <br />
                  This will include detailed performance metrics, slow query analysis, and resource usage tracking.
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="health">
          <div className="grid gap-6">
            <Card>
              <CardHeader>
                <CardTitle>System Health Checks</CardTitle>
                <CardDescription>
                  Monitor database connectivity, external services, and system dependencies
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8 text-muted-foreground">
                  Health check dashboard coming soon...
                  <br />
                  This will include real-time health status for all system components.
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="security">
          <div className="grid gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Security Monitoring</CardTitle>
                <CardDescription>
                  Track security events, failed authentication attempts, and potential threats
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8 text-muted-foreground">
                  Security monitoring dashboard coming soon...
                  <br />
                  This will include security event tracking, threat detection, and compliance monitoring.
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}