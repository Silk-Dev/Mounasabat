'use client';

import React from 'react';
import { Button } from './button';
import { Card } from './card';
import { cn } from '@/lib/utils';

export interface EmptyStateProps {
  title: string;
  description: string;
  icon?: React.ReactNode;
  action?: {
    label: string;
    onClick: () => void;
    variant?: 'default' | 'outline' | 'secondary' | 'ghost' | 'link' | 'destructive';
  };
  className?: string;
  children?: React.ReactNode;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  title,
  description,
  icon,
  action,
  className,
  children
}) => {
  return (
    <Card className={cn('p-8 text-center', className)}>
      <div className="flex flex-col items-center space-y-4">
        {icon && (
          <div className="text-gray-400 mb-2">
            {icon}
          </div>
        )}
        
        <div className="space-y-2">
          <h3 className="text-lg font-medium text-gray-900">
            {title}
          </h3>
          <p className="text-gray-600 max-w-md">
            {description}
          </p>
        </div>

        {action && (
          <Button
            variant={action.variant || 'outline'}
            onClick={action.onClick}
            className="mt-4"
          >
            {action.label}
          </Button>
        )}

        {children}
      </div>
    </Card>
  );
};

export default EmptyState;