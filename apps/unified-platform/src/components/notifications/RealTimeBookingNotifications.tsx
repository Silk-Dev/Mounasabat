'use client';

import { useState, useEffect } from 'react';
import { Bell, Calendar, Clock, DollarSign, User, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { websocketService, BookingNotification } from '@/lib/websocket';
import { format, parseISO } from 'date-fns';
import { toast } from 'sonner';

interface RealTimeBookingNotificationsProps {
  providerId?: string;
  onNotificationClick?: (bookingId: string) => void;
}

export function RealTimeBookingNotifications({
  providerId,
  onNotificationClick
}: RealTimeBookingNotificationsProps) {
  const [notifications, setNotifications] = useState<BookingNotification[]>([]);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Set up WebSocket connection
    const userId = 'current-user-id'; // Get from auth context
    const userRole = providerId ? 'provider' : 'customer'; // Get from auth context
    
    websocketService.connect(userId, userRole);
    
    // Subscribe to booking notifications
    const unsubscribe = websocketService.subscribe('booking_notification', handleBookingNotification);

    return () => {
      unsubscribe();
    };
  }, [providerId]);

  const handleBookingNotification = (notification: BookingNotification) => {
    // Filter notifications for this provider if specified
    if (providerId && notification.providerId !== providerId) {
      return;
    }

    // Add to notifications list
    setNotifications(prev => [notification, ...prev.slice(0, 4)]); // Keep only 5 most recent
    setIsVisible(true);

    // Show toast notification
    const message = getNotificationMessage(notification);
    toast(message, {
      description: `${notification.booking.customerName} - ${notification.booking.serviceName}`,
      action: {
        label: 'View',
        onClick: () => onNotificationClick?.(notification.bookingId)
      }
    });

    // Auto-hide after 10 seconds
    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.bookingId !== notification.bookingId));
    }, 10000);
  };

  const getNotificationMessage = (notification: BookingNotification): string => {
    switch (notification.type) {
      case 'new_booking':
        return 'New booking received!';
      case 'booking_updated':
        return 'Booking updated';
      case 'booking_cancelled':
        return 'Booking cancelled';
      default:
        return 'Booking notification';
    }
  };

  const getNotificationColor = (type: string): string => {
    switch (type) {
      case 'new_booking':
        return 'bg-green-500';
      case 'booking_updated':
        return 'bg-blue-500';
      case 'booking_cancelled':
        return 'bg-red-500';
      default:
        return 'bg-gray-500';
    }
  };

  const handleDismiss = (bookingId: string) => {
    setNotifications(prev => prev.filter(n => n.bookingId !== bookingId));
  };

  const handleNotificationClick = (bookingId: string) => {
    onNotificationClick?.(bookingId);
    handleDismiss(bookingId);
  };

  if (notifications.length === 0) {
    return null;
  }

  return (
    <div className="fixed top-4 right-4 z-50 space-y-2 max-w-sm">
      {notifications.map((notification) => (
        <Card
          key={notification.bookingId}
          className="shadow-lg border-l-4 animate-in slide-in-from-right duration-300"
          style={{ borderLeftColor: getNotificationColor(notification.type).replace('bg-', '#') }}
        >
          <CardContent className="p-4">
            <div className="flex items-start justify-between">
              <div className="flex items-start space-x-3 flex-1">
                <div className={`w-2 h-2 rounded-full mt-2 ${getNotificationColor(notification.type)}`} />
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium text-sm">
                      {getNotificationMessage(notification)}
                    </h4>
                    <Badge variant="outline" className="text-xs">
                      {notification.type.replace('_', ' ')}
                    </Badge>
                  </div>

                  <div className="space-y-1 text-xs text-muted-foreground">
                    <div className="flex items-center gap-2">
                      <User className="w-3 h-3" />
                      <span>{notification.booking.customerName}</span>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Calendar className="w-3 h-3" />
                      <span>{notification.booking.serviceName}</span>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Clock className="w-3 h-3" />
                      <span>{format(parseISO(notification.booking.date), 'MMM d, yyyy h:mm a')}</span>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <DollarSign className="w-3 h-3" />
                      <span>${notification.booking.totalAmount.toFixed(2)}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 mt-3">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleNotificationClick(notification.bookingId)}
                      className="text-xs h-7"
                    >
                      View Details
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleDismiss(notification.bookingId)}
                      className="text-xs h-7 px-2"
                    >
                      <X className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}