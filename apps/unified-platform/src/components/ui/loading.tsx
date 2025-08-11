import React from 'react';
import { Loader2, Search, Calendar, BarChart3, User, Settings } from 'lucide-react';
import { cn } from '@/lib/utils';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ 
  size = 'md', 
  className 
}) => {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8',
  };

  return (
    <Loader2 
      className={cn(
        'animate-spin text-blue-600',
        sizeClasses[size],
        className
      )} 
    />
  );
};

interface LoadingStateProps {
  type?: 'search' | 'booking' | 'dashboard' | 'profile' | 'general';
  message?: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export const LoadingState: React.FC<LoadingStateProps> = ({
  type = 'general',
  message,
  size = 'md',
  className,
}) => {
  const getIcon = () => {
    switch (type) {
      case 'search':
        return <Search className="w-8 h-8 text-blue-600 mb-2" />;
      case 'booking':
        return <Calendar className="w-8 h-8 text-orange-600 mb-2" />;
      case 'dashboard':
        return <BarChart3 className="w-8 h-8 text-purple-600 mb-2" />;
      case 'profile':
        return <User className="w-8 h-8 text-green-600 mb-2" />;
      default:
        return <Settings className="w-8 h-8 text-gray-600 mb-2" />;
    }
  };

  const getDefaultMessage = () => {
    switch (type) {
      case 'search':
        return 'Searching for services...';
      case 'booking':
        return 'Processing your booking...';
      case 'dashboard':
        return 'Loading dashboard...';
      case 'profile':
        return 'Loading profile...';
      default:
        return 'Loading...';
    }
  };

  return (
    <div className={cn(
      'flex flex-col items-center justify-center p-8 text-center',
      className
    )}>
      {getIcon()}
      <LoadingSpinner size={size} className="mb-3" />
      <p className="text-gray-600 text-sm">
        {message || getDefaultMessage()}
      </p>
    </div>
  );
};

interface SkeletonProps {
  className?: string;
  variant?: 'text' | 'rectangular' | 'circular';
}

export const Skeleton: React.FC<SkeletonProps> = ({ 
  className, 
  variant = 'rectangular' 
}) => {
  const baseClasses = 'animate-pulse bg-gray-200';
  
  const variantClasses = {
    text: 'h-4 rounded',
    rectangular: 'rounded-md',
    circular: 'rounded-full',
  };

  return (
    <div 
      className={cn(
        baseClasses,
        variantClasses[variant],
        className
      )} 
    />
  );
};

// Specific loading components for different sections
export const SearchResultsSkeleton: React.FC = () => (
  <div className="space-y-4">
    {[...Array(6)].map((_, i) => (
      <div key={i} className="border rounded-lg p-4 space-y-3">
        <div className="flex space-x-4">
          <Skeleton className="w-24 h-24" variant="rectangular" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-6 w-3/4" variant="text" />
            <Skeleton className="h-4 w-1/2" variant="text" />
            <Skeleton className="h-4 w-1/4" variant="text" />
          </div>
        </div>
      </div>
    ))}
  </div>
);

export const BookingFormSkeleton: React.FC = () => (
  <div className="space-y-6">
    <div className="space-y-4">
      <Skeleton className="h-8 w-1/3" variant="text" />
      <div className="grid grid-cols-2 gap-4">
        <Skeleton className="h-10" variant="rectangular" />
        <Skeleton className="h-10" variant="rectangular" />
      </div>
    </div>
    <div className="space-y-4">
      <Skeleton className="h-8 w-1/4" variant="text" />
      <Skeleton className="h-32" variant="rectangular" />
    </div>
    <div className="flex justify-between">
      <Skeleton className="h-10 w-24" variant="rectangular" />
      <Skeleton className="h-10 w-32" variant="rectangular" />
    </div>
  </div>
);

export const DashboardSkeleton: React.FC = () => (
  <div className="space-y-6">
    {/* Stats cards */}
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
      {[...Array(4)].map((_, i) => (
        <div key={i} className="border rounded-lg p-4 space-y-2">
          <Skeleton className="h-4 w-1/2" variant="text" />
          <Skeleton className="h-8 w-3/4" variant="text" />
        </div>
      ))}
    </div>
    
    {/* Chart area */}
    <div className="border rounded-lg p-4">
      <Skeleton className="h-6 w-1/4 mb-4" variant="text" />
      <Skeleton className="h-64" variant="rectangular" />
    </div>
    
    {/* Table */}
    <div className="border rounded-lg">
      <div className="p-4 border-b">
        <Skeleton className="h-6 w-1/3" variant="text" />
      </div>
      <div className="divide-y">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="p-4 flex justify-between items-center">
            <div className="space-y-1">
              <Skeleton className="h-4 w-32" variant="text" />
              <Skeleton className="h-3 w-24" variant="text" />
            </div>
            <Skeleton className="h-8 w-20" variant="rectangular" />
          </div>
        ))}
      </div>
    </div>
  </div>
);

export const ProfileSkeleton: React.FC = () => (
  <div className="space-y-6">
    {/* Header */}
    <div className="flex items-center space-x-4">
      <Skeleton className="w-20 h-20" variant="circular" />
      <div className="space-y-2">
        <Skeleton className="h-6 w-48" variant="text" />
        <Skeleton className="h-4 w-32" variant="text" />
      </div>
    </div>
    
    {/* Form fields */}
    <div className="space-y-4">
      {[...Array(6)].map((_, i) => (
        <div key={i} className="space-y-2">
          <Skeleton className="h-4 w-24" variant="text" />
          <Skeleton className="h-10" variant="rectangular" />
        </div>
      ))}
    </div>
    
    {/* Actions */}
    <div className="flex space-x-4">
      <Skeleton className="h-10 w-24" variant="rectangular" />
      <Skeleton className="h-10 w-20" variant="rectangular" />
    </div>
  </div>
);

interface InlineLoadingProps {
  text?: string;
  size?: 'sm' | 'md';
}

export const InlineLoading: React.FC<InlineLoadingProps> = ({ 
  text = 'Loading...', 
  size = 'sm' 
}) => (
  <div className="flex items-center space-x-2">
    <LoadingSpinner size={size} />
    <span className="text-sm text-gray-600">{text}</span>
  </div>
);

interface ButtonLoadingProps {
  loading: boolean;
  children: React.ReactNode;
  className?: string;
}

export const ButtonLoading: React.FC<ButtonLoadingProps> = ({ 
  loading, 
  children, 
  className 
}) => (
  <div className={cn('flex items-center space-x-2', className)}>
    {loading && <LoadingSpinner size="sm" />}
    <span>{children}</span>
  </div>
);