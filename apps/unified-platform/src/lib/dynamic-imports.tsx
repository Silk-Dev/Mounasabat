import dynamic from 'next/dynamic';
import React from 'react';
import { ComponentType } from 'react';

// Loading component for dynamic imports
const LoadingSpinner = () => (
  <div className="flex items-center justify-center p-8">
    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
  </div>
);

const LoadingCard = () => (
  <div className="animate-pulse">
    <div className="bg-gray-200 rounded-lg h-48 mb-4"></div>
    <div className="space-y-2">
      <div className="bg-gray-200 rounded h-4 w-3/4"></div>
      <div className="bg-gray-200 rounded h-4 w-1/2"></div>
    </div>
  </div>
);

const LoadingDashboard = () => (
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


// Provider dashboard components (role-based splitting)
export const ProviderDashboard = dynamic(
  () => Promise.resolve({ default: () => <LoadingDashboard /> }),
  {
    loading: LoadingDashboard,
    ssr: false,
  }
);

export const ServiceManager = dynamic(
  () => Promise.resolve({ default: () => <LoadingSpinner /> }),
  {
    loading: LoadingSpinner,
    ssr: false,
  }
);

export const BookingManager = dynamic(
  () => Promise.resolve({ default: () => <LoadingSpinner /> }),
  {
    loading: LoadingSpinner,
    ssr: false,
  }
);

export const ProviderAnalytics = dynamic(
  () => Promise.resolve({ default: () => <LoadingDashboard /> }),
  {
    loading: LoadingDashboard,
    ssr: false,
  }
);

export const AvailabilityManager = dynamic(
  () => Promise.resolve({ default: () => <LoadingSpinner /> }),
  {
    loading: LoadingSpinner,
    ssr: false,
  }
);

// Admin panel components (role-based splitting)
export const AdminDashboard = dynamic(
  () => Promise.resolve({ default: () => <LoadingDashboard /> }),
  {
    loading: LoadingDashboard,
    ssr: false,
  }
);

export const UserManagement = dynamic(
  () => Promise.resolve({ default: () => <LoadingSpinner /> }),
  {
    loading: LoadingSpinner,
    ssr: false,
  }
);

export const ProviderManagement = dynamic(
  () => Promise.resolve({ default: () => <LoadingSpinner /> }),
  {
    loading: LoadingSpinner,
    ssr: false,
  }
);

export const PlatformSettings = dynamic(
  () => Promise.resolve({ default: () => <LoadingSpinner /> }),
  {
    loading: LoadingSpinner,
    ssr: false,
  }
);

export const DisputeResolution = dynamic(
  () => Promise.resolve({ default: () => <LoadingSpinner /> }),
  {
    loading: LoadingSpinner,
    ssr: false,
  }
);



export const NotificationCenter = dynamic(
  () => Promise.resolve({ default: () => <LoadingSpinner /> }),
  {
    loading: LoadingSpinner,
    ssr: false,
  }
);


// Chart components (heavy libraries)
export const AnalyticsCharts = dynamic(
  () => Promise.resolve({ default: () => <LoadingSpinner /> }),
  {
    loading: LoadingSpinner,
    ssr: false,
  }
);

export const RevenueChart = dynamic(
  () => Promise.resolve({ default: () => <LoadingSpinner /> }),
  {
    loading: LoadingSpinner,
    ssr: false,
  }
);

export const BookingTrendsChart = dynamic(
  () => Promise.resolve({ default: () => <LoadingSpinner /> }),
  {
    loading: LoadingSpinner,
    ssr: false,
  }
);

// Preload functions for critical components
export const preloadCriticalComponents = {
  search: () => {
    // Note: preload methods only available on components with dynamic imports
    // SearchResults.preload();
    // SearchMap.preload();
  },
  booking: () => {
    // BookingWizard.preload();
    // PaymentForm.preload();
  },
  provider: () => {
    // ProviderDashboard.preload();
    // ServiceManager.preload();
  },
  admin: () => {
    // AdminDashboard.preload();
    // UserManagement.preload();
  },
};

// Bundle size optimization utilities
export const bundleOptimization = {
  // Preload components based on user interaction
  preloadOnHover: (componentName: keyof typeof preloadCriticalComponents) => {
    return {
      onMouseEnter: () => preloadCriticalComponents[componentName](),
      onFocus: () => preloadCriticalComponents[componentName](),
    };
  },

  // Preload components based on route
  preloadForRoute: (route: string) => {
    switch (route) {
      case '/search':
        preloadCriticalComponents.search();
        break;
      case '/booking':
        preloadCriticalComponents.booking();
        break;
      case '/provider':
        preloadCriticalComponents.provider();
        break;
      case '/admin':
        preloadCriticalComponents.admin();
        break;
    }
  },
};
