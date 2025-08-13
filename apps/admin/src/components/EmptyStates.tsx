import React from 'react';
import { 
  Users, 
  Package, 
  Calendar, 
  Star, 
  TrendingUp, 
  AlertCircle,
  Plus,
  RefreshCw,
  Settings,
  FileText,
  CreditCard,
  Bell,
  Search
} from 'lucide-react';

interface EmptyStateProps {
  title: string;
  description: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  secondaryAction?: {
    label: string;
    onClick: () => void;
  };
  icon?: React.ReactNode;
  className?: string;
}

export function EmptyState({ 
  title, 
  description, 
  action, 
  secondaryAction, 
  icon, 
  className = '' 
}: EmptyStateProps) {
  return (
    <div className={`text-center py-12 ${className}`}>
      {icon && (
        <div className="mx-auto h-16 w-16 text-gray-400 mb-4 flex items-center justify-center">
          {icon}
        </div>
      )}
      <h3 className="mt-2 text-lg font-semibold text-gray-900">{title}</h3>
      <p className="mt-2 text-sm text-gray-500 max-w-md mx-auto leading-relaxed">{description}</p>
      
      {(action || secondaryAction) && (
        <div className="mt-6 flex flex-col sm:flex-row gap-3 justify-center">
          {action && (
            <button
              type="button"
              onClick={action.onClick}
              className="inline-flex items-center rounded-md bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
            >
              {action.label}
            </button>
          )}
          
          {secondaryAction && (
            <button
              type="button"
              onClick={secondaryAction.onClick}
              className="inline-flex items-center rounded-md bg-white px-4 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50"
            >
              {secondaryAction.label}
            </button>
          )}
        </div>
      )}
    </div>
  );
}

// Admin-specific empty states
export const NoProvidersEmptyState: React.FC<{
  onAddProvider?: () => void;
  onInviteProviders?: () => void;
}> = ({ onAddProvider, onInviteProviders }) => (
  <EmptyState
    title="No service providers"
    description="There are currently no service providers registered on the platform. Providers will appear here once they sign up and are approved."
    icon={<Users className="w-16 h-16" />}
    action={onAddProvider ? {
      label: "Add Provider",
      onClick: onAddProvider
    } : undefined}
    secondaryAction={onInviteProviders ? {
      label: "Send Invitations",
      onClick: onInviteProviders
    } : undefined}
  />
);

export const NoServicesEmptyState: React.FC<{
  onManageServices?: () => void;
  onViewCategories?: () => void;
}> = ({ onManageServices, onViewCategories }) => (
  <EmptyState
    title="No services available"
    description="There are currently no services listed on the platform. Services will appear here once providers add them."
    icon={<Package className="w-16 h-16" />}
    action={onManageServices ? {
      label: "Manage Services",
      onClick: onManageServices
    } : undefined}
    secondaryAction={onViewCategories ? {
      label: "View Categories",
      onClick: onViewCategories
    } : undefined}
  />
);

export const NoBookingsEmptyState: React.FC<{
  onViewProviders?: () => void;
}> = ({ onViewProviders }) => (
  <EmptyState
    title="No bookings yet"
    description="There are no bookings on the platform yet. Bookings will appear here once customers start booking services."
    icon={<Calendar className="w-16 h-16" />}
    action={onViewProviders ? {
      label: "View Providers",
      onClick: onViewProviders
    } : undefined}
  />
);

export const NoReviewsEmptyState: React.FC<{
  onViewBookings?: () => void;
}> = ({ onViewBookings }) => (
  <EmptyState
    title="No reviews yet"
    description="There are no customer reviews yet. Reviews will appear here once customers complete bookings and leave feedback."
    icon={<Star className="w-16 h-16" />}
    action={onViewBookings ? {
      label: "View Bookings",
      onClick: onViewBookings
    } : undefined}
  />
);

export const NoAnalyticsDataEmptyState: React.FC<{
  onRefresh?: () => void;
}> = ({ onRefresh }) => (
  <EmptyState
    title="No analytics data"
    description="There's not enough data to generate analytics yet. Analytics will appear once there's sufficient platform activity."
    icon={<TrendingUp className="w-16 h-16" />}
    action={onRefresh ? {
      label: "Refresh Data",
      onClick: onRefresh
    } : undefined}
  />
);

export const NoUsersEmptyState: React.FC<{
  onInviteUsers?: () => void;
}> = ({ onInviteUsers }) => (
  <EmptyState
    title="No users registered"
    description="There are currently no users registered on the platform. Users will appear here once they sign up."
    icon={<Users className="w-16 h-16" />}
    action={onInviteUsers ? {
      label: "Send Invitations",
      onClick: onInviteUsers
    } : undefined}
  />
);

export const NoReportsEmptyState: React.FC<{
  onGenerateReport?: () => void;
}> = ({ onGenerateReport }) => (
  <EmptyState
    title="No reports available"
    description="There are no reports generated yet. Reports will be available once there's sufficient data on the platform."
    icon={<FileText className="w-16 h-16" />}
    action={onGenerateReport ? {
      label: "Generate Report",
      onClick: onGenerateReport
    } : undefined}
  />
);

export const NoPaymentsEmptyState: React.FC<{
  onViewBookings?: () => void;
}> = ({ onViewBookings }) => (
  <EmptyState
    title="No payments processed"
    description="There are no payments processed yet. Payment data will appear here once customers start making bookings."
    icon={<CreditCard className="w-16 h-16" />}
    action={onViewBookings ? {
      label: "View Bookings",
      onClick: onViewBookings
    } : undefined}
  />
);

export const NoNotificationsEmptyState: React.FC<{
  onSettings?: () => void;
}> = ({ onSettings }) => (
  <EmptyState
    title="No notifications"
    description="You don't have any notifications at the moment. System notifications and alerts will appear here."
    icon={<Bell className="w-16 h-16" />}
    action={onSettings ? {
      label: "Notification Settings",
      onClick: onSettings
    } : undefined}
  />
);

export const SearchEmptyState: React.FC<{
  searchQuery?: string;
  onClearSearch?: () => void;
}> = ({ searchQuery, onClearSearch }) => (
  <EmptyState
    title="No results found"
    description={
      searchQuery 
        ? `No results found for "${searchQuery}". Try adjusting your search terms.`
        : "No results found. Try a different search term."
    }
    icon={<Search className="w-16 h-16" />}
    action={onClearSearch ? {
      label: "Clear Search",
      onClick: onClearSearch
    } : undefined}
  />
);

export const ErrorEmptyState: React.FC<{
  error?: string;
  onRetry?: () => void;
}> = ({ error, onRetry }) => (
  <EmptyState
    title="Something went wrong"
    description={error || "We encountered an error while loading the data. Please try again."}
    icon={<AlertCircle className="w-16 h-16 text-red-400" />}
    action={onRetry ? {
      label: "Try Again",
      onClick: onRetry
    } : undefined}
  />
);

export const MaintenanceEmptyState: React.FC<{
  onCheckStatus?: () => void;
}> = ({ onCheckStatus }) => (
  <EmptyState
    title="Under Maintenance"
    description="This feature is temporarily unavailable while we perform maintenance. Please check back later."
    icon={<Settings className="w-16 h-16" />}
    action={onCheckStatus ? {
      label: "Check Status",
      onClick: onCheckStatus
    } : undefined}
  />
);