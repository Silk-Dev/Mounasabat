'use client';

import { formatDistanceToNow } from 'date-fns';
import { X, Mail, Bell, Smartphone } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface Notification {
  id: string;
  type: 'EMAIL' | 'SMS' | 'IN_APP' | 'PUSH';
  title: string;
  message: string;
  isRead: boolean;
  data?: any;
  createdAt: string;
}

interface NotificationItemProps {
  notification: Notification;
  onClick: () => void;
  onDelete: () => void;
}

const typeIcons = {
  EMAIL: Mail,
  SMS: Smartphone,
  IN_APP: Bell,
  PUSH: Bell,
};

const typeColors = {
  EMAIL: 'bg-blue-100 text-blue-600',
  SMS: 'bg-green-100 text-green-600',
  IN_APP: 'bg-purple-100 text-purple-600',
  PUSH: 'bg-orange-100 text-orange-600',
};

export function NotificationItem({ notification, onClick, onDelete }: NotificationItemProps) {
  const Icon = typeIcons[notification.type];
  const colorClass = typeColors[notification.type];

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    onClick();
    
    // Handle notification-specific actions
    if (notification.data?.actionUrl) {
      window.open(notification.data.actionUrl, '_blank');
    }
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    onDelete();
  };

  return (
    <div
      className={cn(
        'p-4 hover:bg-muted/50 cursor-pointer transition-colors relative group',
        !notification.isRead && 'bg-blue-50/50'
      )}
      onClick={handleClick}
    >
      <div className="flex items-start gap-3">
        <div className={cn('p-2 rounded-full', colorClass)}>
          <Icon className="h-4 w-4" />
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <h4 className={cn(
              'text-sm font-medium truncate',
              !notification.isRead && 'font-semibold'
            )}>
              {notification.title}
            </h4>
            {!notification.isRead && (
              <div className="w-2 h-2 bg-blue-600 rounded-full flex-shrink-0 mt-1" />
            )}
          </div>
          
          <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
            {notification.message}
          </p>
          
          <div className="flex items-center justify-between mt-2">
            <span className="text-xs text-muted-foreground">
              {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
            </span>
            
            {notification.data?.type && (
              <Badge variant="secondary" className="text-xs">
                {notification.data.type.replace('_', ' ')}
              </Badge>
            )}
          </div>
        </div>
        
        <Button
          variant="ghost"
          size="sm"
          className="opacity-0 group-hover:opacity-100 transition-opacity"
          onClick={handleDelete}
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}