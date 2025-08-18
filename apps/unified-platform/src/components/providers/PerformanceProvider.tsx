'use client';

import { useEffect } from 'react';
import { initializePerformanceMonitoring } from '@/lib/performance-monitor';

interface PerformanceProviderProps {
  children: React.ReactNode;
}

export default function PerformanceProvider({ children }: PerformanceProviderProps) {
  useEffect(() => {
    // Initialize performance monitoring on client side
    initializePerformanceMonitoring();
    
    // Report initial page load metrics
    if (typeof window !== 'undefined' && 'performance' in window) {
      // Wait for page to fully load
      window.addEventListener('load', () => {
        setTimeout(() => {
          const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
          
          if (navigation) {
            // Send initial page load metrics
            fetch('/api/analytics/performance', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                type: 'PageLoad',
                data: {
                  url: window.location.pathname,
                  loadTime: navigation.loadEventEnd - navigation.navigationStart,
                  domContentLoaded: navigation.domContentLoadedEventEnd - navigation.navigationStart,
                  firstByte: navigation.responseStart - navigation.requestStart,
                  domInteractive: navigation.domInteractive - navigation.navigationStart,
                  transferSize: navigation.transferSize,
                },
                userAgent: navigator.userAgent,
                timestamp: Date.now(),
              }),
            }).catch(() => {
              // Fail silently for analytics
            });
          }
        }, 0);
      });
    }
  }, []);

  return <>{children}</>;
}