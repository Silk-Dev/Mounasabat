// Performance testing utilities
import { PERFORMANCE_BUDGET } from './performance-config';

export class PerformanceTester {
  private static instance: PerformanceTester;
  private testResults: Map<string, any[]> = new Map();

  static getInstance(): PerformanceTester {
    if (!PerformanceTester.instance) {
      PerformanceTester.instance = new PerformanceTester();
    }
    return PerformanceTester.instance;
  }

  // Test component render performance
  async testComponentRender(
    componentName: string,
    renderFn: () => Promise<void>,
    iterations: number = 10
  ) {
    const results = [];
    
    for (let i = 0; i < iterations; i++) {
      const startTime = performance.now();
      await renderFn();
      const endTime = performance.now();
      
      results.push({
        iteration: i + 1,
        duration: endTime - startTime,
        timestamp: Date.now(),
      });
    }
    
    const analysis = this.analyzeResults(results);
    this.storeResults(`component-${componentName}`, {
      ...analysis,
      budget: PERFORMANCE_BUDGET.metrics.firstContentfulPaint,
      passed: analysis.average < PERFORMANCE_BUDGET.metrics.firstContentfulPaint,
    });
    
    return analysis;
  }

  // Test API response times
  async testAPIPerformance(
    endpoint: string,
    options: RequestInit = {},
    iterations: number = 5
  ) {
    const results = [];
    
    for (let i = 0; i < iterations; i++) {
      const startTime = performance.now();
      
      try {
        const response = await fetch(endpoint, options);
        const endTime = performance.now();
        
        results.push({
          iteration: i + 1,
          duration: endTime - startTime,
          status: response.status,
          success: response.ok,
          timestamp: Date.now(),
        });
      } catch (error) {
        const endTime = performance.now();
        
        results.push({
          iteration: i + 1,
          duration: endTime - startTime,
          status: 0,
          success: false,
          error: error.message,
          timestamp: Date.now(),
        });
      }
    }
    
    const analysis = this.analyzeResults(results);
    this.storeResults(`api-${endpoint}`, {
      ...analysis,
      budget: 2000, // 2 seconds for API calls
      passed: analysis.average < 2000,
      successRate: results.filter(r => r.success).length / results.length,
    });
    
    return analysis;
  }

  // Test bundle loading performance
  async testBundleLoad(bundleName: string, bundleUrl: string) {
    const startTime = performance.now();
    
    try {
      const response = await fetch(bundleUrl);
      const endTime = performance.now();
      const blob = await response.blob();
      
      const result = {
        duration: endTime - startTime,
        size: blob.size,
        sizeKB: Math.round(blob.size / 1024),
        timestamp: Date.now(),
      };
      
      const budget = PERFORMANCE_BUDGET.bundles.chunk * 1024; // Convert to bytes
      const passed = blob.size <= budget;
      
      this.storeResults(`bundle-${bundleName}`, {
        ...result,
        budget: budget,
        passed,
      });
      
      return result;
    } catch (error) {
      const endTime = performance.now();
      
      const result = {
        duration: endTime - startTime,
        error: error.message,
        timestamp: Date.now(),
      };
      
      this.storeResults(`bundle-${bundleName}`, {
        ...result,
        passed: false,
      });
      
      return result;
    }
  }

  // Test memory usage
  testMemoryUsage(testName: string) {
    if ('memory' in performance) {
      const memory = (performance as any).memory;
      
      const result = {
        used: memory.usedJSHeapSize,
        total: memory.totalJSHeapSize,
        limit: memory.jsHeapSizeLimit,
        usedMB: Math.round(memory.usedJSHeapSize / 1024 / 1024),
        totalMB: Math.round(memory.totalJSHeapSize / 1024 / 1024),
        timestamp: Date.now(),
      };
      
      this.storeResults(`memory-${testName}`, result);
      return result;
    }
    
    return null;
  }

  // Test Core Web Vitals
  async testWebVitals(): Promise<any> {
    return new Promise((resolve) => {
      const vitals: any = {};
      
      // LCP
      if ('PerformanceObserver' in window) {
        const lcpObserver = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          const lastEntry = entries[entries.length - 1];
          vitals.lcp = {
            value: lastEntry.startTime,
            passed: lastEntry.startTime <= PERFORMANCE_BUDGET.metrics.largestContentfulPaint,
            budget: PERFORMANCE_BUDGET.metrics.largestContentfulPaint,
          };
          lcpObserver.disconnect();
        });
        
        lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });
        
        // FID
        const fidObserver = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          entries.forEach((entry: any) => {
            const fid = entry.processingStart - entry.startTime;
            vitals.fid = {
              value: fid,
              passed: fid <= PERFORMANCE_BUDGET.metrics.firstInputDelay,
              budget: PERFORMANCE_BUDGET.metrics.firstInputDelay,
            };
          });
          fidObserver.disconnect();
        });
        
        fidObserver.observe({ entryTypes: ['first-input'] });
        
        // CLS
        let clsValue = 0;
        const clsObserver = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          entries.forEach((entry: any) => {
            if (!entry.hadRecentInput) {
              clsValue += entry.value;
            }
          });
          
          vitals.cls = {
            value: clsValue,
            passed: clsValue <= PERFORMANCE_BUDGET.metrics.cumulativeLayoutShift,
            budget: PERFORMANCE_BUDGET.metrics.cumulativeLayoutShift,
          };
        });
        
        clsObserver.observe({ entryTypes: ['layout-shift'] });
        
        // Resolve after a timeout to collect metrics
        setTimeout(() => {
          clsObserver.disconnect();
          this.storeResults('web-vitals', vitals);
          resolve(vitals);
        }, 5000);
      } else {
        resolve({});
      }
    });
  }

  // Analyze test results
  private analyzeResults(results: any[]) {
    const durations = results.map(r => r.duration).filter(d => typeof d === 'number');
    
    if (durations.length === 0) {
      return { average: 0, min: 0, max: 0, median: 0 };
    }
    
    durations.sort((a, b) => a - b);
    
    return {
      average: durations.reduce((a, b) => a + b, 0) / durations.length,
      min: durations[0],
      max: durations[durations.length - 1],
      median: durations[Math.floor(durations.length / 2)],
      p95: durations[Math.floor(durations.length * 0.95)],
      count: durations.length,
    };
  }

  // Store test results
  private storeResults(testName: string, results: any) {
    if (!this.testResults.has(testName)) {
      this.testResults.set(testName, []);
    }
    
    const testResults = this.testResults.get(testName)!;
    testResults.push({
      ...results,
      timestamp: Date.now(),
    });
    
    // Keep only last 100 results
    if (testResults.length > 100) {
      testResults.shift();
    }
  }

  // Get test results
  getResults(testName?: string) {
    if (testName) {
      return this.testResults.get(testName) || [];
    }
    
    return Object.fromEntries(this.testResults);
  }

  // Generate performance report
  generateReport() {
    const allResults = this.getResults();
    const report: any = {
      timestamp: Date.now(),
      summary: {
        totalTests: Object.keys(allResults).length,
        passedTests: 0,
        failedTests: 0,
      },
      details: {},
    };
    
    Object.entries(allResults).forEach(([testName, results]) => {
      const latestResult = results[results.length - 1];
      const passed = latestResult?.passed !== false;
      
      if (passed) {
        report.summary.passedTests++;
      } else {
        report.summary.failedTests++;
      }
      
      report.details[testName] = {
        passed,
        latestResult,
        history: results.slice(-10), // Last 10 results
      };
    });
    
    return report;
  }

  // Clear all results
  clearResults() {
    this.testResults.clear();
  }
}

// Utility functions for performance testing
export const performanceUtils = {
  // Measure function execution time
  measureExecution: async <T>(fn: () => Promise<T> | T): Promise<{ result: T; duration: number }> => {
    const startTime = performance.now();
    const result = await fn();
    const endTime = performance.now();
    
    return {
      result,
      duration: endTime - startTime,
    };
  },

  // Simulate network conditions
  simulateSlowNetwork: (delay: number = 1000) => {
    return new Promise(resolve => setTimeout(resolve, delay));
  },

  // Check if performance budget is met
  checkBudget: (metric: string, value: number): boolean => {
    const budget = (PERFORMANCE_BUDGET.metrics as any)[metric];
    return budget ? value <= budget : true;
  },

  // Format performance metrics for display
  formatMetric: (value: number, unit: string = 'ms'): string => {
    if (unit === 'ms') {
      return value < 1000 ? `${Math.round(value)}ms` : `${(value / 1000).toFixed(2)}s`;
    }
    
    if (unit === 'bytes') {
      if (value < 1024) return `${value}B`;
      if (value < 1024 * 1024) return `${(value / 1024).toFixed(1)}KB`;
      return `${(value / 1024 / 1024).toFixed(1)}MB`;
    }
    
    return `${value}${unit}`;
  },
};

// React hook for performance testing
import { useState, useEffect } from 'react';

export function usePerformanceTesting() {
  const [tester] = useState(() => PerformanceTester.getInstance());
  const [results, setResults] = useState<any>({});

  useEffect(() => {
    const interval = setInterval(() => {
      setResults(tester.getResults());
    }, 5000);

    return () => clearInterval(interval);
  }, [tester]);

  return {
    tester,
    results,
    testComponent: tester.testComponentRender.bind(tester),
    testAPI: tester.testAPIPerformance.bind(tester),
    testBundle: tester.testBundleLoad.bind(tester),
    testMemory: tester.testMemoryUsage.bind(tester),
    testWebVitals: tester.testWebVitals.bind(tester),
    generateReport: tester.generateReport.bind(tester),
    clearResults: tester.clearResults.bind(tester),
  };
}
