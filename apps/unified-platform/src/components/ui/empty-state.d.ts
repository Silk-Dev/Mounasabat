import React from 'react';
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
export declare const EmptyState: React.FC<EmptyStateProps>;
export default EmptyState;
