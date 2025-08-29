// Performance optimization configuration
export const PERFORMANCE_CONFIG = {
  // Image optimization settings
  images: {
    formats: ['image/webp', 'image/avif'],
    quality: {
      default: 85,
      thumbnail: 80,
      hero: 90,
      avatar: 90,
    },
    sizes: {
      thumbnail: '150px',
      card: '300px',
      hero: '100vw',
      gallery: '(min-width: 1024px) 400px, (min-width: 768px) 300px, 200px',
    },
    lazy: {
      rootMargin: '50px',
      threshold: 0.1,
    },
  },

  // Caching strategies
  cache: {
    static: {
      duration: 60 * 60 * 24 * 7, // 1 week
      tags: ['static'],
    },
    semiStatic: {
      duration: 60 * 60, // 1 hour
      tags: ['semi-static'],
    },
    dynamic: {
      duration: 60 * 5, // 5 minutes
      tags: ['dynamic'],
    },
    userSpecific: {
      duration: 60 * 30, // 30 minutes
      tags: ['user-specific'],
    },
    realTime: {
      duration: 0, // No cache
      tags: ['real-time'],
    },
  },

  // Bundle splitting configuration
  bundleSplitting: {
    // Vendor chunks
    vendor: {
      react: ['react', 'react-dom'],
      ui: ['@radix-ui', 'lucide-react'],
      forms: ['react-hook-form', 'zod'],
      charts: ['recharts', 'd3'],
      maps: ['mapbox-gl', 'react-map-gl'],
    },
    
    // Route-based chunks
    routes: {
      customer: ['/search', '/providers', '/booking'],
      provider: ['/provider'],
      admin: ['/admin'],
    },
    
    // Feature-based chunks
    features: {
      payment: ['stripe'],
      chat: ['socket.io-client'],
      analytics: ['recharts', 'date-fns'],
    },
  },

  // Database optimization
  database: {
    connectionPool: {
      min: 2,
      max: 10,
      acquireTimeoutMillis: 10000,
      createTimeoutMillis: 10000,
      destroyTimeoutMillis: 5000,
      idleTimeoutMillis: 30000,
      reapIntervalMillis: 1000,
      createRetryIntervalMillis: 200,
    },
    
    queryOptimization: {
      slowQueryThreshold: 1000, // 1 second
      enableQueryLogging: process.env.NODE_ENV === 'development',
      batchSize: 100,
      maxConcurrentQueries: 20,
    },
    
    indexes: {
      search: [
        'services(category, base_price)',
        'services(provider_id, is_active)',
        'providers(location, is_verified)',
        'providers(rating DESC, review_count DESC)',
      ],
      
      performance: [
        'bookings(user_id, status)',
        'bookings(provider_id, start_time)',
        'reviews(provider_id, created_at DESC)',
        'favorites(user_id, created_at DESC)',
      ],
    },
  },

  // API optimization
  api: {
    rateLimit: {
      windowMs: 60 * 1000, // 1 minute
      max: 100, // requests per window
      skipSuccessfulRequests: false,
    },
    
    compression: {
      threshold: 1024, // bytes
      level: 6, // compression level
    },
    
    pagination: {
      defaultLimit: 20,
      maxLimit: 100,
    },
    
    caching: {
      categories: 60 * 60 * 24, // 24 hours
      locations: 60 * 60 * 24, // 24 hours
      providers: 60 * 10, // 10 minutes
      search: 60 * 5, // 5 minutes
    },
  },

  // Client-side optimization
  client: {
    // Preloading strategies
    preload: {
      critical: ['search', 'categories', 'locations'],
      onHover: ['provider-details', 'booking-form'],
      onIdle: ['user-dashboard', 'favorites'],
    },
    
    // Lazy loading
    lazyLoad: {
      images: true,
      components: true,
      routes: true,
    },
    
    // Memory management
    memory: {
      maxCacheSize: 100, // MB
      cleanupInterval: 5 * 60 * 1000, // 5 minutes
      maxIdleTime: 10 * 60 * 1000, // 10 minutes
    },
  },

  // Performance monitoring
  monitoring: {
    // Core Web Vitals thresholds
    webVitals: {
      lcp: { good: 2500, poor: 4000 },
      fid: { good: 100, poor: 300 },
      cls: { good: 0.1, poor: 0.25 },
    },
    
    // Custom metrics
    customMetrics: {
      apiResponse: { good: 500, poor: 2000 },
      componentRender: { good: 16, poor: 100 },
      bundleLoad: { good: 1000, poor: 3000 },
    },
    
    // Sampling rates
    sampling: {
      production: 0.1, // 10% of users
      development: 1.0, // 100% of users
    },
    
    // Reporting
    reporting: {
      batchSize: 10,
      flushInterval: 30000, // 30 seconds
      maxRetries: 3,
    },
  },

  // Resource hints
  resourceHints: {
    preconnect: [
      'https://fonts.googleapis.com',
      'https://fonts.gstatic.com',
      'https://api.stripe.com',
    ],
    
    dnsPrefetch: [
      '//js.stripe.com',
      '//api.mapbox.com',
    ],
    
    prefetch: [
      '/api/categories',
      '/api/locations',
    ],
  },

  // Code splitting thresholds
  codeSplitting: {
    minChunkSize: 20000, // 20KB
    maxChunkSize: 244000, // 244KB
    maxAsyncRequests: 30,
    maxInitialRequests: 30,
  },
} as const;

// Performance budget configuration
export const PERFORMANCE_BUDGET = {
  // Bundle sizes (in KB)
  bundles: {
    main: 200,
    vendor: 300,
    chunk: 100,
  },
  
  // Asset sizes (in KB)
  assets: {
    image: 500,
    font: 100,
    css: 50,
  },
  
  // Performance metrics (in ms)
  metrics: {
    firstContentfulPaint: 1500,
    largestContentfulPaint: 2500,
    firstInputDelay: 100,
    cumulativeLayoutShift: 0.1,
    timeToInteractive: 3000,
  },
  
  // Network conditions
  network: {
    // Slow 3G simulation
    slow3G: {
      downloadThroughput: 500 * 1024, // 500 KB/s
      uploadThroughput: 500 * 1024,
      latency: 400, // ms
    },
    
    // Fast 3G simulation
    fast3G: {
      downloadThroughput: 1.6 * 1024 * 1024, // 1.6 MB/s
      uploadThroughput: 750 * 1024,
      latency: 150, // ms
    },
  },
} as const;

// Environment-specific configurations
export const getPerformanceConfig = () => {
  const isDevelopment = process.env.NODE_ENV === 'development';
  const isProduction = process.env.NODE_ENV === 'production';
  
  return {
    ...PERFORMANCE_CONFIG,
    
    // Override settings based on environment
    monitoring: {
      ...PERFORMANCE_CONFIG.monitoring,
      sampling: {
        ...PERFORMANCE_CONFIG.monitoring.sampling,
        current: isDevelopment ? 1.0 : 0.1,
      },
    },
    
    database: {
      ...PERFORMANCE_CONFIG.database,
      queryOptimization: {
        ...PERFORMANCE_CONFIG.database.queryOptimization,
        enableQueryLogging: isDevelopment,
      },
    },
    
    client: {
      ...PERFORMANCE_CONFIG.client,
      preload: {
        ...PERFORMANCE_CONFIG.client.preload,
        // Disable preloading in development to avoid cache issues
        critical: isDevelopment ? [] : PERFORMANCE_CONFIG.client.preload.critical,
      },
    },
  };
};
