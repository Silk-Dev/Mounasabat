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

// Customer-facing components (lazy loaded)
export const SearchResults = dynamic(
  () => import('@/components/search/SearchResults'),
  {
    loading: () => (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[...Array(6)].map((_, i) => (
          <LoadingCard key={i} />
        ))}
      </div>
    ),
    ssr: false,
  }
);

export const SearchMap = dynamic(
  () => import('@/components/search/SearchMap'),
  {
    loading: LoadingSpinner,
    ssr: false,
  }
);

export const BookingWizard = dynamic(
  () => import('@/components/booking/BookingWizard'),
  {
    loading: LoadingSpinner,
    ssr: false,
  }
);

export const PaymentForm = dynamic(
  () => import('@/components/booking/PaymentForm'),
  {
    loading: LoadingSpinner,
    ssr: false,
  }
);

export const ReviewForm = dynamic(
  () => import('@/components/reviews/ReviewForm'),
  {
    loading: LoadingSpinner,
    ssr: false,
  }
);

export const FavoritesList = dynamic(
  () => import('@/components/favorites/Favorites'),
  {
    loading: LoadingSpinner,
    ssr: false,
  }
);

export const ComparisonView = dynamic(
  () => import('@/components/favorites/ComparisonView'),
  {
    loading: LoadingSpinner,
    ssr: false,
  }
);

// Provider dashboard components (role-based splitting)
export const ProviderDashboard = dynamic(
  () => import('@/components/provider/ProviderDashboard'),
  {
    loading: LoadingDashboard,
    ssr: false,
  }
);

export const ServiceManager = dynamic(
  () => import('@/components/provider/ServiceManager'),
  {
    loading: LoadingSpinner,
    ssr: false,
  }
);

export const BookingManager = dynamic(
  () => import('@/components/provider/BookingManager'),
  {
    loading: LoadingSpinner,
    ssr: false,
  }
);

export const ProviderAnalytics = dynamic(
  () => import('@/components/provider/ProviderAnalytics'),
  {
    loading: LoadingDashboard,
    ssr: false,
  }
);

export const AvailabilityManager = dynamic(
  () => import('@/components/provider/AvailabilityManager'),
  {
    loading: LoadingSpinner,
    ssr: false,
  }
);

// Admin panel components (role-based splitting)
export const AdminDashboard = dynamic(
  () => import('@/components/admin/AdminDashboard'),
  {
    loading: LoadingDashboard,
    ssr: false,
  }
);

export const UserManagement = dynamic(
  () => import('@/components/admin/UserManagement'),
  {
    loading: LoadingSpinner,
    ssr: false,
  }
);

export const ProviderManagement = dynamic(
  () => import('@/components/admin/ProviderManagement'),
  {
    loading: LoadingSpinner,
    ssr: false,
  }
);

export const PlatformSettings = dynamic(
  () => import('@/components/admin/PlatformSettings'),
  {
    loading: LoadingSpinner,
    ssr: false,
  }
);

export const DisputeResolution = dynamic(
  () => import('@/components/admin/DisputeResolution'),
  {
    loading: LoadingSpinner,
    ssr: false,
  }
);

// Feature-based splitting for heavy components
export const ChatWidget = dynamic(
  () => import('@/components/chat/LiveChat'),
  {
    loading: LoadingSpinner,
    ssr: false,
  }
);

export const NotificationCenter = dynamic(
  () => import('@/components/notifications/NotificationCenter'),
  {
    loading: LoadingSpinner,
    ssr: false,
  }
);

export const RealTimeDashboard = dynamic(
  () => import('@/components/dashboard/RealTimeDashboard'),
  {
    loading: LoadingDashboard,
    ssr: false,
  }
);

// Chart components (heavy libraries)
export const AnalyticsCharts = dynamic(
  () => import('@/components/analytics/AnalyticsCharts'),
  {
    loading: LoadingSpinner,
    ssr: false,
  }
);

export const RevenueChart = dynamic(
  () => import('@/components/analytics/RevenueChart'),
  {
    loading: LoadingSpinner,
    ssr: false,
  }
);

export const BookingTrendsChart = dynamic(
  () => import('@/components/analytics/BookingTrendsChart'),
  {
    loading: LoadingSpinner,
    ssr: false,
  }
);

// Utility function for role-based component loading
export function createRoleBasedComponent<T extends ComponentType<any>>(
  components: {
    customer?: () => Promise<{ default: T }>;
    provider?: () => Promise<{ default: T }>;
    admin?: () => Promise<{ default: T }>;
  },
  fallback?: T
) {
  return function RoleBasedComponent(props: any) {
    const { userRole } = props;

    if (!userRole && fallback) {
      return <fallback {...props} />;
    }

    const componentLoader = components[userRole as keyof typeof components];

    if (!componentLoader) {
      return <div>Unauthorized access</div>;
    }

    const DynamicComponent = dynamic(componentLoader, {
      loading: LoadingSpinner,
      ssr: false,
    });

    return <DynamicComponent {...props} />;
  };
}

// Preload functions for critical components
export const preloadCriticalComponents = {
  search: () => {
    SearchResults.preload();
    SearchMap.preload();
  },
  booking: () => {
    BookingWizard.preload();
    PaymentForm.preload();
  },
  provider: () => {
    ProviderDashboard.preload();
    ServiceManager.preload();
  },
  admin: () => {
    AdminDashboard.preload();
    UserManagement.preload();
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