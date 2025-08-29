import { websocketService } from './websocket';
import { toast } from 'sonner';
import { logger } from './logger';

export interface RealTimeNotification {
  id: string;
  type: 'booking' | 'message' | 'system' | 'payment' | 'review';
  title: string;
  message: string;
  data?: Record<string, any>;
  userId: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  timestamp: Date;
  read: boolean;
  actions?: NotificationAction[];
}

export interface NotificationAction {
  label: string;
  action: string;
  data?: Record<string, any>;
}

class RealTimeNotificationService {
  private notifications: RealTimeNotification[] = [];
  private listeners: Set<(notifications: RealTimeNotification[]) => void> = new Set();
  private unreadCount = 0;
  private unreadCountListeners: Set<(count: number) => void> = new Set();

  constructor() {
    this.setupWebSocketListeners();
  }

  private setupWebSocketListeners() {
    // Subscribe to real-time notifications
    websocketService.subscribe('notification', this.handleNotification.bind(this));
  }

  private handleNotification(notification: RealTimeNotification) {
    // Add to notifications list
    this.notifications.unshift(notification);
    
    // Keep only last 100 notifications
    if (this.notifications.length > 100) {
      this.notifications = this.notifications.slice(0, 100);
    }

    // Update unread count
    if (!notification.read) {
      this.unreadCount++;
      this.notifyUnreadCountListeners();
    }

    // Notify listeners
    this.notifyListeners();

    // Show toast notification based on priority
    this.showToastNotification(notification);

    // Show browser notification if permission granted
    this.showBrowserNotification(notification);
  }

  private showToastNotification(notification: RealTimeNotification) {
    const duration = this.getToastDuration(notification.priority);
    
    const toastOptions = {
      description: notification.message,
      duration,
      action: notification.actions?.[0] ? {
        label: notification.actions[0].label,
        onClick: () => this.executeAction(notification.actions![0], notification)
      } : undefined
    };

    switch (notification.priority) {
      case 'urgent':
        toast.error(notification.title, toastOptions);
        break;
      case 'high':
        toast.warning(notification.title, toastOptions);
        break;
      case 'medium':
        toast.info(notification.title, toastOptions);
        break;
      case 'low':
        toast(notification.title, toastOptions);
        break;
    }
  }

  private showBrowserNotification(notification: RealTimeNotification) {
    if (typeof window !== 'undefined' && 'Notification' in window && window.Notification && window.Notification.permission === 'granted') {
      const browserNotification = new window.Notification(notification.title, {
        body: notification.message,
        icon: '/icon-192x192.png',
        badge: '/badge-72x72.png',
        tag: notification.id,
        requireInteraction: notification.priority === 'urgent',
        data: notification.data
      });

      browserNotification.onclick = () => {
        window.focus();
        if (notification.actions?.[0]) {
          this.executeAction(notification.actions[0], notification);
        }
        browserNotification.close();
      };

      // Auto-close after duration based on priority
      const duration = this.getToastDuration(notification.priority);
      if (duration > 0) {
        setTimeout(() => {
          browserNotification.close();
        }, duration);
      }
    }
  }

  private getToastDuration(priority: string): number {
    switch (priority) {
      case 'urgent':
        return 0; // Don't auto-dismiss
      case 'high':
        return 10000; // 10 seconds
      case 'medium':
        return 5000; // 5 seconds
      case 'low':
        return 3000; // 3 seconds
      default:
        return 5000;
    }
  }

  private executeAction(action: NotificationAction, notification: RealTimeNotification) {
    switch (action.action) {
      case 'navigate':
        if (action.data?.url) {
          window.location.href = action.data.url;
        }
        break;
      case 'open_chat':
        if (action.data?.conversationId) {
          // Emit event to open chat
          window.dispatchEvent(new CustomEvent('open-chat', {
            detail: { conversationId: action.data.conversationId }
          }));
        }
        break;
      case 'view_booking':
        if (action.data?.bookingId) {
          window.location.href = `/booking/${action.data.bookingId}`;
        }
        break;
      case 'mark_read':
        this.markAsRead(notification.id);
        break;
      default:
        logger.info('Unknown action:', action.action);
    }
  }

  // Public methods
  subscribe(callback: (notifications: RealTimeNotification[]) => void) {
    this.listeners.add(callback);
    
    // Immediately call with current notifications
    callback(this.notifications);
    
    return () => {
      this.listeners.delete(callback);
    };
  }

  subscribeToUnreadCount(callback: (count: number) => void) {
    this.unreadCountListeners.add(callback);
    
    // Immediately call with current count
    callback(this.unreadCount);
    
    return () => {
      this.unreadCountListeners.delete(callback);
    };
  }

  private notifyListeners() {
    this.listeners.forEach(callback => callback(this.notifications));
  }

  private notifyUnreadCountListeners() {
    this.unreadCountListeners.forEach(callback => callback(this.unreadCount));
  }

  async markAsRead(notificationId: string) {
    const notification = this.notifications.find(n => n.id === notificationId);
    if (notification && !notification.read) {
      notification.read = true;
      this.unreadCount = Math.max(0, this.unreadCount - 1);
      
      // Update on server
      try {
        await fetch(`/api/notifications/${notificationId}/read`, {
          method: 'POST'
        });
      } catch (error) {
        logger.error('Failed to mark notification as read:', error);
      }
      
      this.notifyListeners();
      this.notifyUnreadCountListeners();
    }
  }

  async markAllAsRead() {
    const unreadNotifications = this.notifications.filter(n => !n.read);
    
    unreadNotifications.forEach(notification => {
      notification.read = true;
    });
    
    this.unreadCount = 0;
    
    // Update on server
    try {
      await fetch('/api/notifications/mark-all-read', {
        method: 'POST'
      });
    } catch (error) {
      logger.error('Failed to mark all notifications as read:', error);
    }
    
    this.notifyListeners();
    this.notifyUnreadCountListeners();
  }

  async loadNotifications() {
    try {
      const response = await fetch('/api/notifications');
      if (response.ok) {
        const data = await response.json();
        this.notifications = data.notifications || [];
        this.unreadCount = this.notifications.filter(n => !n.read).length;
        
        this.notifyListeners();
        this.notifyUnreadCountListeners();
      }
    } catch (error) {
      logger.error('Failed to load notifications:', error);
    }
  }

  getNotifications(): RealTimeNotification[] {
    return this.notifications;
  }

  getUnreadCount(): number {
    return this.unreadCount;
  }

  // Send notification (for admin/system use)
  async sendNotification(notification: Omit<RealTimeNotification, 'id' | 'timestamp' | 'read'>) {
    try {
      const response = await fetch('/api/notifications', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(notification)
      });
      
      if (!response.ok) {
        throw new Error('Failed to send notification');
      }
      
      return await response.json();
    } catch (error) {
      logger.error('Failed to send notification:', error);
      throw error;
    }
  }

  // Request browser notification permission
  async requestNotificationPermission(): Promise<NotificationPermission> {
    if (typeof window !== 'undefined' && 'Notification' in window && window.Notification) {
      const permission = await window.Notification.requestPermission();
      return permission;
    }
    return 'denied';
  }
}

export const realTimeNotificationService = new RealTimeNotificationService();
