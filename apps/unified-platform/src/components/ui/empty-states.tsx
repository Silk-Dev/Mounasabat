'use client';

import React from 'react';
import { 
  Search, 
  Calendar,
  Users,
  Star,
  CreditCard,
  Settings,
  Bell,
  Heart,
  MessageSquare,
  FileText,
  Package,
  MapPin,
  Clock,
  TrendingUp,
  Plus,
  RefreshCw,
  AlertCircle,
  CheckCircle,
  XCircle
} from 'lucide-react';
import { EmptyState, type EmptyStateProps } from './empty-state';

// Base empty state with common props
interface BaseEmptyStateProps extends Omit<EmptyStateProps, 'title' | 'description' | 'icon'> {
  onAction?: () => void;
  onSecondaryAction?: () => void;
}

// No Services Empty State
export const NoServicesEmptyState: React.FC<BaseEmptyStateProps> = ({ 
  onAction, 
  onSecondaryAction,
  ...props 
}) => (
  <EmptyState
    title="No services found"
    description="There are currently no services available. Start by adding your first service to get bookings."
    icon={<Package className="w-16 h-16" />}
    action={onAction ? {
      label: "Add Service",
      onClick: onAction,
      icon: <Plus className="w-4 h-4" />
    } : undefined}
    secondaryAction={onSecondaryAction ? {
      label: "Browse Categories",
      onClick: onSecondaryAction,
      variant: "outline"
    } : undefined}
    {...props}
  />
);

// No Bookings Empty State
export const NoBookingsEmptyState: React.FC<BaseEmptyStateProps> = ({ 
  onAction, 
  onSecondaryAction,
  ...props 
}) => (
  <EmptyState
    title="No bookings yet"
    description="You don't have any bookings at the moment. Once customers start booking your services, they'll appear here."
    icon={<Calendar className="w-16 h-16" />}
    action={onAction ? {
      label: "Promote Services",
      onClick: onAction,
      icon: <TrendingUp className="w-4 h-4" />
    } : undefined}
    secondaryAction={onSecondaryAction ? {
      label: "View Services",
      onClick: onSecondaryAction,
      variant: "outline"
    } : undefined}
    {...props}
  />
);

// No Search Results Empty State
export const NoSearchResultsEmptyState: React.FC<BaseEmptyStateProps & {
  searchQuery?: string;
  hasFilters?: boolean;
}> = ({ 
  searchQuery,
  hasFilters,
  onAction, 
  onSecondaryAction,
  ...props 
}) => (
  <EmptyState
    title={hasFilters ? "No results found" : "No services match your search"}
    description={
      hasFilters 
        ? "Try adjusting your filters or search terms to find what you're looking for."
        : searchQuery 
          ? `We couldn't find any services matching "${searchQuery}". Try a different search term.`
          : "Start searching to find the perfect services for your event."
    }
    icon={<Search className="w-16 h-16" />}
    action={hasFilters && onAction ? {
      label: "Clear Filters",
      onClick: onAction,
      variant: "outline"
    } : undefined}
    secondaryAction={onSecondaryAction ? {
      label: "Browse All Services",
      onClick: onSecondaryAction,
      variant: "outline"
    } : undefined}
    {...props}
  >
    {!hasFilters && !searchQuery && (
      <div className="mt-6 space-y-3">
        <p className="text-sm text-gray-500">Popular searches:</p>
        <div className="flex flex-wrap gap-2 justify-center">
          {['Wedding Photography', 'Event Catering', 'DJ Services', 'Venue Decoration'].map((term) => (
            <button
              key={term}
              className="px-3 py-1 text-xs bg-gray-100 hover:bg-gray-200 rounded-full transition-colors"
              onClick={() => onSecondaryAction?.()}
            >
              {term}
            </button>
          ))}
        </div>
      </div>
    )}
  </EmptyState>
);

// No Reviews Empty State
export const NoReviewsEmptyState: React.FC<BaseEmptyStateProps> = ({ 
  onAction, 
  ...props 
}) => (
  <EmptyState
    title="No reviews yet"
    description="You haven't received any reviews yet. Provide excellent service to start getting positive feedback from your customers."
    icon={<Star className="w-16 h-16" />}
    action={onAction ? {
      label: "View Completed Bookings",
      onClick: onAction,
      variant: "outline"
    } : undefined}
    {...props}
  />
);

// No Notifications Empty State
export const NoNotificationsEmptyState: React.FC<BaseEmptyStateProps> = ({ 
  onAction,
  ...props 
}) => (
  <EmptyState
    title="All caught up!"
    description="You don't have any new notifications. We'll notify you when there's something important to see."
    icon={<Bell className="w-16 h-16" />}
    action={onAction ? {
      label: "Notification Settings",
      onClick: onAction,
      variant: "outline",
      icon: <Settings className="w-4 h-4" />
    } : undefined}
    {...props}
  />
);

// No Favorites Empty State
export const NoFavoritesEmptyState: React.FC<BaseEmptyStateProps> = ({ 
  onAction,
  ...props 
}) => (
  <EmptyState
    title="No favorites yet"
    description="You haven't saved any services to your favorites. Browse services and click the heart icon to save them here."
    icon={<Heart className="w-16 h-16" />}
    action={onAction ? {
      label: "Browse Services",
      onClick: onAction,
      icon: <Search className="w-4 h-4" />
    } : undefined}
    {...props}
  />
);

// No Messages Empty State
export const NoMessagesEmptyState: React.FC<BaseEmptyStateProps> = ({ 
  onAction,
  ...props 
}) => (
  <EmptyState
    title="No messages"
    description="You don't have any messages yet. Start a conversation with service providers or customers to see messages here."
    icon={<MessageSquare className="w-16 h-16" />}
    action={onAction ? {
      label: "Find Services",
      onClick: onAction,
      variant: "outline"
    } : undefined}
    {...props}
  />
);

// No Payment Methods Empty State
export const NoPaymentMethodsEmptyState: React.FC<BaseEmptyStateProps> = ({ 
  onAction,
  ...props 
}) => (
  <EmptyState
    title="No payment methods"
    description="Add a payment method to start booking services. Your payment information is secure and encrypted."
    icon={<CreditCard className="w-16 h-16" />}
    action={onAction ? {
      label: "Add Payment Method",
      onClick: onAction,
      icon: <Plus className="w-4 h-4" />
    } : undefined}
    {...props}
  />
);

// No Providers Empty State (Admin)
export const NoProvidersEmptyState: React.FC<BaseEmptyStateProps> = ({ 
  onAction,
  ...props 
}) => (
  <EmptyState
    title="No service providers"
    description="There are currently no service providers registered on the platform. Providers will appear here once they sign up."
    icon={<Users className="w-16 h-16" />}
    action={onAction ? {
      label: "Invite Providers",
      onClick: onAction,
      icon: <Plus className="w-4 h-4" />
    } : undefined}
    {...props}
  />
);

// No Analytics Data Empty State
export const NoAnalyticsEmptyState: React.FC<BaseEmptyStateProps> = ({ 
  onAction,
  ...props 
}) => (
  <EmptyState
    title="No data available"
    description="There's not enough data to show analytics yet. Analytics will appear once you have bookings and activity."
    icon={<TrendingUp className="w-16 h-16" />}
    action={onAction ? {
      label: "View Services",
      onClick: onAction,
      variant: "outline"
    } : undefined}
    {...props}
  />
);

// Connection Error Empty State
export const ConnectionErrorEmptyState: React.FC<BaseEmptyStateProps> = ({ 
  onAction,
  ...props 
}) => (
  <EmptyState
    title="Connection problem"
    description="We're having trouble connecting to our servers. Please check your internet connection and try again."
    icon={<AlertCircle className="w-16 h-16 text-red-400" />}
    action={onAction ? {
      label: "Try Again",
      onClick: onAction,
      icon: <RefreshCw className="w-4 h-4" />
    } : undefined}
    {...props}
  />
);

// Generic Error Empty State
export const ErrorEmptyState: React.FC<BaseEmptyStateProps & { 
  error?: string;
}> = ({ 
  error,
  onAction,
  ...props 
}) => (
  <EmptyState
    title="Something went wrong"
    description={error || "We encountered an unexpected error. Please try again or contact support if the problem persists."}
    icon={<XCircle className="w-16 h-16 text-red-400" />}
    action={onAction ? {
      label: "Try Again",
      onClick: onAction,
      icon: <RefreshCw className="w-4 h-4" />
    } : undefined}
    {...props}
  />
);

// Success Empty State
export const SuccessEmptyState: React.FC<BaseEmptyStateProps & {
  successMessage?: string;
}> = ({ 
  successMessage,
  onAction,
  ...props 
}) => (
  <EmptyState
    title="Success!"
    description={successMessage || "Your action was completed successfully."}
    icon={<CheckCircle className="w-16 h-16 text-green-400" />}
    action={onAction ? {
      label: "Continue",
      onClick: onAction
    } : undefined}
    {...props}
  />
);

// Coming Soon Empty State
export const ComingSoonEmptyState: React.FC<BaseEmptyStateProps> = ({ 
  onAction,
  ...props 
}) => (
  <EmptyState
    title="Coming Soon"
    description="This feature is currently under development. We're working hard to bring it to you soon!"
    icon={<Clock className="w-16 h-16" />}
    action={onAction ? {
      label: "Get Notified",
      onClick: onAction,
      variant: "outline"
    } : undefined}
    {...props}
  />
);

// Maintenance Empty State
export const MaintenanceEmptyState: React.FC<BaseEmptyStateProps> = ({ 
  onAction,
  ...props 
}) => (
  <EmptyState
    title="Under Maintenance"
    description="This feature is temporarily unavailable while we perform maintenance. Please try again later."
    icon={<Settings className="w-16 h-16" />}
    action={onAction ? {
      label: "Check Status",
      onClick: onAction,
      variant: "outline"
    } : undefined}
    {...props}
  />
);

// Export all empty states
export {
  EmptyState
};