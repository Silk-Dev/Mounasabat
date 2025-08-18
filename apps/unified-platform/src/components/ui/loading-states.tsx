import React from 'react';
import { Loader2, AlertCircle, CheckCircle, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  text?: string;
}

export function LoadingSpinner({ size = 'md', className, text }: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-6 w-6',
    lg: 'h-8 w-8',
  };

  return (
    <div className={cn('flex items-center justify-center', className)}>
      <div className="flex flex-col items-center space-y-2">
        <Loader2 className={cn('animate-spin text-primary', sizeClasses[size])} />
        {text && <p className="text-sm text-gray-600">{text}</p>}
      </div>
    </div>
  );
}

interface LoadingOverlayProps {
  isLoading: boolean;
  text?: string;
  children: React.ReactNode;
  className?: string;
}

export function LoadingOverlay({ isLoading, text, children, className }: LoadingOverlayProps) {
  return (
    <div className={cn('relative', className)}>
      {children}
      {isLoading && (
        <div className="absolute inset-0 bg-white/80 backdrop-blur-sm flex items-center justify-center z-10">
          <LoadingSpinner text={text} />
        </div>
      )}
    </div>
  );
}

interface ProgressLoadingProps {
  progress: number;
  text?: string;
  className?: string;
}

export function ProgressLoading({ progress, text, className }: ProgressLoadingProps) {
  return (
    <div className={cn('flex flex-col items-center space-y-4', className)}>
      <div className="w-full max-w-md">
        <div className="flex justify-between text-sm text-gray-600 mb-2">
          <span>{text || 'Loading...'}</span>
          <span>{Math.round(progress)}%</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className="bg-primary h-2 rounded-full transition-all duration-300 ease-out"
            style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
          />
        </div>
      </div>
    </div>
  );
}

interface StepLoadingProps {
  currentStep: number;
  totalSteps: number;
  stepLabels?: string[];
  className?: string;
}

export function StepLoading({ currentStep, totalSteps, stepLabels, className }: StepLoadingProps) {
  return (
    <div className={cn('flex flex-col space-y-4', className)}>
      <div className="flex items-center justify-between">
        {Array.from({ length: totalSteps }).map((_, index) => {
          const stepNumber = index + 1;
          const isCompleted = stepNumber < currentStep;
          const isCurrent = stepNumber === currentStep;
          const isPending = stepNumber > currentStep;

          return (
            <div key={index} className="flex items-center">
              <div
                className={cn(
                  'flex items-center justify-center w-8 h-8 rounded-full border-2 text-sm font-medium',
                  {
                    'bg-green-100 border-green-500 text-green-700': isCompleted,
                    'bg-primary border-primary text-white': isCurrent,
                    'bg-gray-100 border-gray-300 text-gray-500': isPending,
                  }
                )}
              >
                {isCompleted ? (
                  <CheckCircle className="w-4 h-4" />
                ) : isCurrent ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Clock className="w-4 h-4" />
                )}
              </div>
              {stepLabels && stepLabels[index] && (
                <span
                  className={cn('ml-2 text-sm', {
                    'text-green-700': isCompleted,
                    'text-primary font-medium': isCurrent,
                    'text-gray-500': isPending,
                  })}
                >
                  {stepLabels[index]}
                </span>
              )}
              {index < totalSteps - 1 && (
                <div
                  className={cn('flex-1 h-0.5 mx-4', {
                    'bg-green-500': isCompleted,
                    'bg-gray-300': !isCompleted,
                  })}
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

interface InlineLoadingProps {
  isLoading: boolean;
  text?: string;
  size?: 'sm' | 'md';
  className?: string;
}

export function InlineLoading({ isLoading, text, size = 'sm', className }: InlineLoadingProps) {
  if (!isLoading) return null;

  const sizeClasses = {
    sm: 'h-3 w-3',
    md: 'h-4 w-4',
  };

  return (
    <div className={cn('flex items-center space-x-2', className)}>
      <Loader2 className={cn('animate-spin text-gray-500', sizeClasses[size])} />
      {text && <span className="text-sm text-gray-600">{text}</span>}
    </div>
  );
}

interface ButtonLoadingProps {
  isLoading: boolean;
  children: React.ReactNode;
  loadingText?: string;
  className?: string;
  disabled?: boolean;
}

export function ButtonLoading({ 
  isLoading, 
  children, 
  loadingText, 
  className, 
  disabled 
}: ButtonLoadingProps) {
  return (
    <button
      className={cn(
        'flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed',
        className
      )}
      disabled={isLoading || disabled}
    >
      {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
      <span>{isLoading && loadingText ? loadingText : children}</span>
    </button>
  );
}

interface LoadingStateProps {
  loading: boolean;
  error: string | null;
  success: boolean;
  loadingComponent?: React.ReactNode;
  errorComponent?: React.ReactNode;
  successComponent?: React.ReactNode;
  children?: React.ReactNode;
  className?: string;
}

export function LoadingState({
  loading,
  error,
  success,
  loadingComponent,
  errorComponent,
  successComponent,
  children,
  className,
}: LoadingStateProps) {
  if (loading) {
    return (
      <div className={className}>
        {loadingComponent || <LoadingSpinner />}
      </div>
    );
  }

  if (error) {
    return (
      <div className={className}>
        {errorComponent || (
          <div className="flex items-center space-x-2 text-red-600">
            <AlertCircle className="h-4 w-4" />
            <span className="text-sm">{error}</span>
          </div>
        )}
      </div>
    );
  }

  if (success && successComponent) {
    return <div className={className}>{successComponent}</div>;
  }

  return <div className={className}>{children}</div>;
}