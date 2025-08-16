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
      data-testid="loading-spinner"
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
      data-testid="skeleton-element"
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

// Form loading overlay
interface FormLoadingOverlayProps {
  isLoading: boolean;
  message?: string;
  children: React.ReactNode;
}

export const FormLoadingOverlay: React.FC<FormLoadingOverlayProps> = ({
  isLoading,
  message = 'Processing...',
  children
}) => (
  <div className="relative">
    {children}
    {isLoading && (
      <div className="absolute inset-0 bg-white/80 backdrop-blur-sm flex items-center justify-center z-50 rounded-md">
        <div className="flex flex-col items-center space-y-2">
          <LoadingSpinner size="md" />
          <p className="text-sm text-gray-600">{message}</p>
        </div>
      </div>
    )}
  </div>
);

// Data table loading
export const TableLoadingSkeleton: React.FC<{ rows?: number; columns?: number }> = ({ 
  rows = 5, 
  columns = 4 
}) => (
  <div className="space-y-3">
    {/* Header */}
    <div className="grid gap-4" style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}>
      {[...Array(columns)].map((_, i) => (
        <Skeleton key={i} className="h-4 w-full" variant="text" />
      ))}
    </div>
    {/* Rows */}
    {[...Array(rows)].map((_, rowIndex) => (
      <div key={rowIndex} className="grid gap-4" style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}>
        {[...Array(columns)].map((_, colIndex) => (
          <Skeleton key={colIndex} className="h-8 w-full" variant="rectangular" />
        ))}
      </div>
    ))}
  </div>
);

// Card loading skeleton
export const CardLoadingSkeleton: React.FC<{ count?: number }> = ({ count = 3 }) => (
  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
    {[...Array(count)].map((_, i) => (
      <div key={i} className="border rounded-lg p-4 space-y-3">
        <Skeleton className="h-6 w-3/4" variant="text" />
        <Skeleton className="h-4 w-full" variant="text" />
        <Skeleton className="h-4 w-2/3" variant="text" />
        <div className="flex justify-between items-center">
          <Skeleton className="h-8 w-20" variant="rectangular" />
          <Skeleton className="h-8 w-16" variant="rectangular" />
        </div>
      </div>
    ))}
  </div>
);

// Progress indicator for multi-step operations
interface ProgressIndicatorProps {
  currentStep: number;
  totalSteps: number;
  stepLabels?: string[];
  showProgress?: boolean;
}

export const ProgressIndicator: React.FC<ProgressIndicatorProps> = ({
  currentStep,
  totalSteps,
  stepLabels,
  showProgress = true
}) => {
  const progress = (currentStep / totalSteps) * 100;

  return (
    <div className="space-y-4">
      {showProgress && (
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            data-testid="progress-bar"
            className="bg-blue-600 h-2 rounded-full transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
      )}
      
      {stepLabels && (
        <div className="flex justify-between text-sm">
          {stepLabels.map((label, index) => (
            <span
              key={index}
              className={cn(
                'text-center',
                index < currentStep ? 'text-green-600 font-medium' : 
                index === currentStep ? 'text-blue-600 font-medium' : 
                'text-gray-400'
              )}
            >
              {label}
            </span>
          ))}
        </div>
      )}
      
      <div className="text-center text-sm text-gray-600">
        Step {currentStep} of {totalSteps}
      </div>
    </div>
  );
};

interface ButtonLoadingProps {
  loading: boolean;
  children: React.ReactNode;
  loadingText?: string;
  className?: string;
  disabled?: boolean;
}

export const ButtonLoading: React.FC<ButtonLoadingProps> = ({ 
  loading, 
  children, 
  loadingText,
  className,
  disabled
}) => (
  <div className={cn(
    'flex items-center justify-center space-x-2',
    { 'opacity-50 cursor-not-allowed': loading || disabled },
    className
  )}>
    {loading && <LoadingSpinner size="sm" />}
    <span>{loading && loadingText ? loadingText : children}</span>
  </div>
);

// Enhanced button with built-in loading states
interface LoadingButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  loading?: boolean;
  loadingText?: string;
  variant?: 'default' | 'outline' | 'ghost' | 'destructive';
  size?: 'sm' | 'md' | 'lg';
  children: React.ReactNode;
}

export const LoadingButton: React.FC<LoadingButtonProps> = ({
  loading = false,
  loadingText,
  variant = 'default',
  size = 'md',
  children,
  disabled,
  className,
  ...props
}) => {
  const baseClasses = 'inline-flex items-center justify-center rounded-md font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none';
  
  const variantClasses = {
    default: 'bg-primary text-primary-foreground hover:bg-primary/90',
    outline: 'border border-input hover:bg-accent hover:text-accent-foreground',
    ghost: 'hover:bg-accent hover:text-accent-foreground',
    destructive: 'bg-destructive text-destructive-foreground hover:bg-destructive/90',
  };
  
  const sizeClasses = {
    sm: 'h-9 px-3 text-sm',
    md: 'h-10 px-4 py-2',
    lg: 'h-11 px-8',
  };

  return (
    <button
      className={cn(
        baseClasses,
        variantClasses[variant],
        sizeClasses[size],
        className
      )}
      disabled={loading || disabled}
      {...props}
    >
      {loading && <LoadingSpinner size="sm" className="mr-2" />}
      <span>{loading && loadingText ? loadingText : children}</span>
    </button>
  );
};