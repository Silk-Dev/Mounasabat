'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import {
  NoServicesEmptyState,
  NoBookingsEmptyState,
  NoSearchResultsEmptyState,
  NoReviewsEmptyState,
  NoNotificationsEmptyState,
  NoFavoritesEmptyState,
  NoMessagesEmptyState,
  NoPaymentMethodsEmptyState,
  ConnectionErrorEmptyState,
  ErrorEmptyState,
  SuccessEmptyState
} from './empty-states';

// Example usage components demonstrating how to use empty states

export const ServicesPageExample: React.FC = () => {
  const router = useRouter();
  const [services, setServices] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    // Simulate API call
    setTimeout(() => {
      setServices([]); // Empty for demo
      setLoading(false);
    }, 1000);
  }, []);

  if (loading) {
    return <div>Loading...</div>;
  }

  if (error) {
    return (
      <ErrorEmptyState
        error={error}
        onAction={() => window.location.reload()}
      />
    );
  }

  if (services.length === 0) {
    return (
      <NoServicesEmptyState
        onAction={() => router.push('/services/create')}
        onSecondaryAction={() => router.push('/categories')}
      />
    );
  }

  return <div>Services list would go here</div>;
};

export const BookingsPageExample: React.FC = () => {
  const router = useRouter();
  const [bookings] = React.useState<any[]>([]);

  if (bookings.length === 0) {
    return (
      <NoBookingsEmptyState
        onAction={() => router.push('/promote')}
        onSecondaryAction={() => router.push('/services')}
      />
    );
  }

  return <div>Bookings list would go here</div>;
};

export const SearchPageExample: React.FC = () => {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = React.useState('wedding photography');
  const [hasFilters, setHasFilters] = React.useState(true);
  const [results] = React.useState<any[]>([]);

  const clearFilters = () => {
    setHasFilters(false);
    // Clear filters logic
  };

  if (results.length === 0) {
    return (
      <NoSearchResultsEmptyState
        searchQuery={searchQuery}
        hasFilters={hasFilters}
        onAction={hasFilters ? clearFilters : undefined}
        onSecondaryAction={() => router.push('/services')}
      />
    );
  }

  return <div>Search results would go here</div>;
};

export const ReviewsPageExample: React.FC = () => {
  const router = useRouter();
  const [reviews] = React.useState<any[]>([]);

  if (reviews.length === 0) {
    return (
      <NoReviewsEmptyState
        onAction={() => router.push('/bookings?status=completed')}
      />
    );
  }

  return <div>Reviews list would go here</div>;
};

export const NotificationsPageExample: React.FC = () => {
  const router = useRouter();
  const [notifications] = React.useState<any[]>([]);

  if (notifications.length === 0) {
    return (
      <NoNotificationsEmptyState
        onAction={() => router.push('/settings/notifications')}
      />
    );
  }

  return <div>Notifications list would go here</div>;
};

export const FavoritesPageExample: React.FC = () => {
  const router = useRouter();
  const [favorites] = React.useState<any[]>([]);

  if (favorites.length === 0) {
    return (
      <NoFavoritesEmptyState
        onAction={() => router.push('/search')}
      />
    );
  }

  return <div>Favorites list would go here</div>;
};

export const MessagesPageExample: React.FC = () => {
  const router = useRouter();
  const [messages] = React.useState<any[]>([]);

  if (messages.length === 0) {
    return (
      <NoMessagesEmptyState
        onAction={() => router.push('/services')}
      />
    );
  }

  return <div>Messages list would go here</div>;
};

export const PaymentMethodsExample: React.FC = () => {
  const [paymentMethods] = React.useState<any[]>([]);
  const [showAddModal, setShowAddModal] = React.useState(false);

  if (paymentMethods.length === 0) {
    return (
      <NoPaymentMethodsEmptyState
        onAction={() => setShowAddModal(true)}
      />
    );
  }

  return <div>Payment methods would go here</div>;
};

export const ConnectionErrorExample: React.FC = () => {
  const [isRetrying, setIsRetrying] = React.useState(false);

  const handleRetry = async () => {
    setIsRetrying(true);
    // Simulate retry logic
    setTimeout(() => {
      setIsRetrying(false);
      // Handle retry result
    }, 2000);
  };

  return (
    <ConnectionErrorEmptyState
      onAction={handleRetry}
    />
  );
};

export const SuccessExample: React.FC = () => {
  const router = useRouter();

  return (
    <SuccessEmptyState
      successMessage="Your booking has been confirmed successfully!"
      onAction={() => router.push('/bookings')}
    />
  );
};

// Demo component showing all empty states
export const EmptyStatesDemo: React.FC = () => {
  const [currentState, setCurrentState] = React.useState('services');

  const states = {
    services: <ServicesPageExample />,
    bookings: <BookingsPageExample />,
    search: <SearchPageExample />,
    reviews: <ReviewsPageExample />,
    notifications: <NotificationsPageExample />,
    favorites: <FavoritesPageExample />,
    messages: <MessagesPageExample />,
    payments: <PaymentMethodsExample />,
    error: <ConnectionErrorExample />,
    success: <SuccessExample />
  };

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold mb-4">Empty States Demo</h1>
        <div className="flex flex-wrap gap-2">
          {Object.keys(states).map((state) => (
            <button
              key={state}
              onClick={() => setCurrentState(state)}
              className={`px-3 py-1 rounded text-sm ${
                currentState === state
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              {state.charAt(0).toUpperCase() + state.slice(1)}
            </button>
          ))}
        </div>
      </div>
      
      <div className="border rounded-lg p-4 min-h-[400px]">
        {states[currentState as keyof typeof states]}
      </div>
    </div>
  );
};