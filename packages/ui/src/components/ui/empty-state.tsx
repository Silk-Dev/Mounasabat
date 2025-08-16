'use client';

import React from 'react';
import { Button } from './button';
import { Card } from './card';
import { cn } from '../../lib/utils';

export interface EmptyStateAction {
  label: string;
  onClick: () => void;
  variant?: 'default' | 'outline' | 'secondary' | 'ghost' | 'link' | 'destructive';
  icon?: React.ReactNode;
}

export interface EmptyStateProps {
  title: string;
  description: string;
  icon?: React.ReactNode;
  illustration?: React.ReactNode;
  action?: EmptyStateAction;
  secondaryAction?: EmptyStateAction;
  className?: string;
  children?: React.ReactNode;
  size?: 'sm' | 'md' | 'lg';
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  title,
  description,
  icon,
  illustration,
  action,
  secondaryAction,
  className,
  children,
  size = 'md'
}) => {
  const sizeClasses = {
    sm: 'p-6',
    md: 'p-8',
    lg: 'p-12'
  };

  const iconSizes = {
    sm: 'w-12 h-12',
    md: 'w-16 h-16',
    lg: 'w-20 h-20'
  };

  const titleSizes = {
    sm: 'text-base',
    md: 'text-lg',
    lg: 'text-xl'
  };

  return (
    <Card className={cn('text-center', sizeClasses[size], className)}>
      <div className="flex flex-col items-center space-y-4">
        {illustration && (
          <div className="mb-4">
            {illustration}
          </div>
        )}
        
        {icon && !illustration && (
          <div className={cn('text-gray-400 mb-2', iconSizes[size])}>
            {icon}
          </div>
        )}
        
        <div className="space-y-2 max-w-md">
          <h3 className={cn('font-semibold text-gray-900', titleSizes[size])}>
            {title}
          </h3>
          <p className="text-gray-600 text-sm leading-relaxed">
            {description}
          </p>
        </div>

        {(action || secondaryAction) && (
          <div className="flex flex-col sm:flex-row gap-3 mt-6">
            {action && (
              <Button
                variant={action.variant || 'default'}
                onClick={action.onClick}
                className="min-w-[120px]"
              >
                {action.icon && (
                  <span className="mr-2">
                    {action.icon}
                  </span>
                )}
                {action.label}
              </Button>
            )}
            
            {secondaryAction && (
              <Button
                variant={secondaryAction.variant || 'outline'}
                onClick={secondaryAction.onClick}
                className="min-w-[120px]"
              >
                {secondaryAction.icon && (
                  <span className="mr-2">
                    {secondaryAction.icon}
                  </span>
                )}
                {secondaryAction.label}
              </Button>
            )}
          </div>
        )}

        {children}
      </div>
    </Card>
  );
};

export default EmptyState;