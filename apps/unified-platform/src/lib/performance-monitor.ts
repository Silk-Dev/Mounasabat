'use client';

// Performance monitoring utilities
export class PerformanceMonitor {
  private static instance: PerformanceMonitor;
  private metrics: Map<string, any[]> = new Map();
  private observers: Map<string, PerformanceObserver> = new Map();

  static getInstance(): PerformanceMonitor {
    if (!PerformanceMonitor.instance) {
      PerformanceMonitor.instance = new PerformanceMonitor();
    }
    return PerformanceMonitor.instance;
  }

  constructor() {
    if (typeof window !== 'undefined') {
      this.initializeObservers();
    }
  }

  private initializeObservers() {
    // Core Web Vitals monitoring
    this.observeWebVitals();
    
    // Navigation timing
    this.observeNavigation();
    
    // Resource loading
    this.observeResources();
    
    // Long tasks
    this.observeLongTasks();
  }

  private observeWebVitals() {
    // Largest Contentful Paint (LCP)
    if ('PerformanceObserver' in window) {
      const lcpObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        const lastEntry = entries[entries.length - 1];
        this.recordMetric('LCP', {
          value: lastEntry.startTime,
          timestamp: Date.now(),
          url: window.location.pathname,
        });
      });
      
      lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });
      this.observers.set('lcp', lcpObserver);

      // First Input Delay (FID)
      const fidObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach((entry: any) => {
          this.recordMetric('FID', {
            value: entry.processingStart - entry.startTime,
            timestamp: Date.now(),
            url: window.location.pathname,
          });
        });
      });
      
      fidObserver.observe({ entryTypes: ['first-input'] });
      this.observers.set('fid', fidObserver);

      // Cumulative Layout Shift (CLS)
      let clsValue = 0;
      const clsObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach((entry: any) => {
          if (!entry.hadRecentInput) {
            clsValue += entry.value;
          }
        });
        
        this.recordMetric('CLS', {
          value: clsValue,
          timestamp: Date.now(),
          url: window.location.pathname,
        });
      });
      
      clsObserver.observe({ entryTypes: ['layout-shift'] });
      this.observers.set('cls', clsObserver);
    }
  }

  private observeNavigation() {
    if ('PerformanceObserver' in window) {
      const navObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach((entry: any) => {
          this.recordMetric('Navigation', {
            domContentLoaded: entry.domContentLoadedEventEnd - entry.domContentLoadedEventStart,
            loadComplete: entry.loadEventEnd - entry.loadEventStart,
            firstByte: entry.responseStart - entry.requestStart,
            domInteractive: entry.domInteractive - entry.navigationStart,
            timestamp: Date.now(),
            url: window.location.pathname,
          });
        });
      });
      
      navObserver.observe({ entryTypes: ['navigation'] });
      this.observers.set('navigation', navObserver);
    }
  }

  private observeResources() {
    if ('PerformanceObserver' in window) {
      const resourceObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach((entry: any) => {
          // Only track significant resources
          if (entry.transferSize > 10000 || entry.duration > 100) {
            this.recordMetric('Resource', {
              name: entry.name,
              type: entry.initiatorType,
              size: entry.transferSize,
              duration: entry.duration,
              timestamp: Date.now(),
              url: window.location.pathname,
            });
          }
        });
      });
      
      resourceObserver.observe({ entryTypes: ['resource'] });
      this.observers.set('resource', resourceObserver);
    }
  }

  private observeLongTasks() {
    if ('PerformanceObserver' in window) {
      const longTaskObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach((entry: any) => {
          this.recordMetric('LongTask', {
            duration: entry.duration,
            startTime: entry.startTime,
            timestamp: Date.now(),
            url: window.location.pathname,
          });
        });
      });
      
      try {
        longTaskObserver.observe({ entryTypes: ['longtask'] });
        this.observers.set('longtask', longTaskObserver);
      } catch (e) {
        // Long task observer not supported
      }
    }
  }

  recordMetric(type: string, data: any) {
    if (!this.metrics.has(type)) {
      this.metrics.set(type, []);
    }
    
    const metrics = this.metrics.get(type)!;
    metrics.push(data);
    
    // Keep only last 100 entries per type
    if (metrics.length > 100) {
      metrics.shift();
    }
    
    // Send to analytics if configured
    this.sendToAnalytics(type, data);
  }

  private sendToAnalytics(type: string, data: any) {
    // Send to your analytics service
    if (process.env.NODE_ENV === 'production') {
      // Example: Send to Google Analytics, DataDog, etc.
      try {
        fetch('/api/analytics/performance', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            type,
            data,
            userAgent: navigator.userAgent,
            timestamp: Date.now(),
          }),
        }).catch(() => {
          // Fail silently for analytics
        });
      } catch (error) {
        // Fail silently
      }
    }
  }

  getMetrics(type?: string) {
    if (type) {
      return this.metrics.get(type) || [];
    }
    return Object.fromEntries(this.metrics);
  }

  getAverageMetric(type: string, field: string) {
    const metrics = this.metrics.get(type) || [];
    if (metrics.length === 0) return 0;
    
    const sum = metrics.reduce((acc, metric) => acc + (metric[field] || 0), 0);
    return sum / metrics.length;
  }

  clearMetrics(type?: string) {
    if (type) {
      this.metrics.delete(type);
    } else {
      this.metrics.clear();
    }
  }

  disconnect() {
    this.observers.forEach(observer => observer.disconnect());
    this.observers.clear();
  }
}

// React hook for performance monitoring
import { useEffect, useState } from 'react';

export function usePerformanceMonitor() {
  const [monitor] = useState(() => PerformanceMonitor.getInstance());
  const [metrics, setMetrics] = useState<any>({});

  useEffect(() => {
    const interval = setInterval(() => {
      setMetrics(monitor.getMetrics());
    }, 5000); // Update every 5 seconds

    return () => {
      clearInterval(interval);
    };
  }, [monitor]);

  return {
    monitor,
    metrics,
    recordMetric: (type: string, data: any) => monitor.recordMetric(type, data),
    getAverageMetric: (type: string, field: string) => monitor.getAverageMetric(type, field),
  };
}

// Component performance tracker
export function withPerformanceTracking<P extends object>(
  WrappedComponent: React.ComponentType<P>,
  componentName: string
) {
  return (props: P) => {
    const monitor = PerformanceMonitor.getInstance();

    useEffect(() => {
      const startTime = performance.now();
      
      return () => {
        const endTime = performance.now();
        monitor.recordMetric('ComponentRender', {
          component: componentName,
          duration: endTime - startTime,
          timestamp: Date.now(),
          url: window.location.pathname,
        });
      };
    }, [monitor]);

    return <WrappedComponent {...props} />;
  };
}

// API performance tracking
export class APIPerformanceTracker {
  private static requests: Map<string, number> = new Map();

  static startRequest(requestId: string) {
    this.requests.set(requestId, performance.now());
  }

  static endRequest(requestId: string, endpoint: string, status: number) {
    const startTime = this.requests.get(requestId);
    if (startTime) {
      const duration = performance.now() - startTime;
      this.requests.delete(requestId);
      
      PerformanceMonitor.getInstance().recordMetric('APIRequest', {
        endpoint,
        duration,
        status,
        timestamp: Date.now(),
        url: window.location.pathname,
      });
    }
  }
}

// Bundle size analyzer
export const bundleAnalyzer = {
  trackBundleLoad: (bundleName: string, size: number) => {
    PerformanceMonitor.getInstance().recordMetric('BundleLoad', {
      bundle: bundleName,
      size,
      timestamp: Date.now(),
      url: window.location.pathname,
    });
  },

  trackDynamicImport: (componentName: string, loadTime: number) => {
    PerformanceMonitor.getInstance().recordMetric('DynamicImport', {
      component: componentName,
      loadTime,
      timestamp: Date.now(),
      url: window.location.pathname,
    });
  },
};

// Memory usage monitoring
export const memoryMonitor = {
  trackMemoryUsage: () => {
    if ('memory' in performance) {
      const memory = (performance as any).memory;
      PerformanceMonitor.getInstance().recordMetric('Memory', {
        used: memory.usedJSHeapSize,
        total: memory.totalJSHeapSize,
        limit: memory.jsHeapSizeLimit,
        timestamp: Date.now(),
        url: window.location.pathname,
      });
    }
  },

  startMemoryMonitoring: (interval: number = 30000) => {
    const intervalId = setInterval(() => {
      memoryMonitor.trackMemoryUsage();
    }, interval);

    return () => clearInterval(intervalId);
  },
};

// Initialize performance monitoring
export const initializePerformanceMonitoring = () => {
  if (typeof window !== 'undefined') {
    const monitor = PerformanceMonitor.getInstance();
    
    // Start memory monitoring
    memoryMonitor.startMemoryMonitoring();
    
    // Track page visibility changes
    document.addEventListener('visibilitychange', () => {
      monitor.recordMetric('PageVisibility', {
        hidden: document.hidden,
        timestamp: Date.now(),
        url: window.location.pathname,
      });
    });
    
    // Track unload events
    window.addEventListener('beforeunload', () => {
      monitor.recordMetric('PageUnload', {
        timestamp: Date.now(),
        url: window.location.pathname,
      });
    });
  }
};