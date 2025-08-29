import { websocketService } from '../websocket';
import { realTimeNotificationService } from '../real-time-notifications';

// Mock socket.io-client
jest.mock('socket.io-client', () => ({
  io: jest.fn(() => ({
    connected: false,
    connect: jest.fn(),
    disconnect: jest.fn(),
    on: jest.fn(),
    emit: jest.fn(),
  }))
}));

describe('WebSocket Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Connection Management', () => {
    it('should connect with user credentials', () => {
      const userId = 'test-user-id';
      const userRole = 'customer';
      
      websocketService.connect(userId, userRole);
      
      expect(websocketService.isConnected()).toBe(false); // Mock returns false
    });

    it('should handle disconnection', () => {
      websocketService.disconnect();
      expect(websocketService.isConnected()).toBe(false);
    });
  });

  describe('Message Subscription', () => {
    it('should allow subscribing to availability updates', () => {
      const callback = jest.fn();
      const unsubscribe = websocketService.subscribe('availability_update', callback);
      
      expect(typeof unsubscribe).toBe('function');
      
      // Test unsubscribe
      unsubscribe();
    });

    it('should allow subscribing to booking notifications', () => {
      const callback = jest.fn();
      const unsubscribe = websocketService.subscribe('booking_notification', callback);
      
      expect(typeof unsubscribe).toBe('function');
    });

    it('should allow subscribing to chat messages', () => {
      const callback = jest.fn();
      const unsubscribe = websocketService.subscribe('chat_message', callback);
      
      expect(typeof unsubscribe).toBe('function');
    });
  });

  describe('Message Sending', () => {
    it('should send chat messages', () => {
      const message = {
        conversationId: 'conv-123',
        senderId: 'user-123',
        receiverId: 'user-456',
        message: 'Hello world',
        type: 'text' as const
      };
      
      // Should not throw
      websocketService.sendChatMessage(message);
    });

    it('should send availability updates', () => {
      const update = {
        providerId: 'provider-123',
        serviceId: 'service-123',
        date: '2025-08-10',
        available: true,
        slots: ['09:00', '10:00', '11:00']
      };
      
      // Should not throw
      websocketService.updateAvailability(update);
    });
  });

  describe('Room Management', () => {
    it('should join rooms', () => {
      const roomId = 'room-123';
      
      // Should not throw
      websocketService.joinRoom(roomId);
    });

    it('should leave rooms', () => {
      const roomId = 'room-123';
      
      // Should not throw
      websocketService.leaveRoom(roomId);
    });
  });
});

describe('Real-time Notification Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Clear notifications
    realTimeNotificationService['notifications'] = [];
    realTimeNotificationService['unreadCount'] = 0;
  });

  describe('Notification Management', () => {
    it('should subscribe to notifications', () => {
      const callback = jest.fn();
      const unsubscribe = realTimeNotificationService.subscribe(callback);
      
      expect(typeof unsubscribe).toBe('function');
      expect(callback).toHaveBeenCalledWith([]);
      
      unsubscribe();
    });

    it('should subscribe to unread count', () => {
      const callback = jest.fn();
      const unsubscribe = realTimeNotificationService.subscribeToUnreadCount(callback);
      
      expect(typeof unsubscribe).toBe('function');
      expect(callback).toHaveBeenCalledWith(0);
      
      unsubscribe();
    });

    it('should handle notification updates', () => {
      const notification = {
        id: 'notif-123',
        type: 'booking' as const,
        title: 'New Booking',
        message: 'You have a new booking request',
        userId: 'user-123',
        priority: 'medium' as const,
        timestamp: new Date(),
        read: false
      };
      
      // Simulate receiving a notification
      realTimeNotificationService['handleNotification'](notification);
      
      expect(realTimeNotificationService.getNotifications()).toHaveLength(1);
      expect(realTimeNotificationService.getUnreadCount()).toBe(1);
    });
  });

  describe('Notification Actions', () => {
    it('should mark notifications as read', async () => {
      // Mock fetch
      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({})
      });

      const notification = {
        id: 'notif-123',
        type: 'booking' as const,
        title: 'New Booking',
        message: 'You have a new booking request',
        userId: 'user-123',
        priority: 'medium' as const,
        timestamp: new Date(),
        read: false
      };
      
      // Add notification
      realTimeNotificationService['handleNotification'](notification);
      
      // Mark as read
      await realTimeNotificationService.markAsRead('notif-123');
      
      expect(realTimeNotificationService.getUnreadCount()).toBe(0);
    });

    it('should mark all notifications as read', async () => {
      // Mock fetch
      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({})
      });

      // Add multiple notifications
      const notifications = [
        {
          id: 'notif-1',
          type: 'booking' as const,
          title: 'Booking 1',
          message: 'Message 1',
          userId: 'user-123',
          priority: 'medium' as const,
          timestamp: new Date(),
          read: false
        },
        {
          id: 'notif-2',
          type: 'message' as const,
          title: 'Message 2',
          message: 'Message 2',
          userId: 'user-123',
          priority: 'low' as const,
          timestamp: new Date(),
          read: false
        }
      ];
      
      notifications.forEach(notif => {
        realTimeNotificationService['handleNotification'](notif);
      });
      
      expect(realTimeNotificationService.getUnreadCount()).toBe(2);
      
      // Mark all as read
      await realTimeNotificationService.markAllAsRead();
      
      expect(realTimeNotificationService.getUnreadCount()).toBe(0);
    });
  });

  describe('Browser Notifications', () => {
    it('should handle notification permission requests', async () => {
      // Test that the method exists and returns a valid permission value
      const permission = await realTimeNotificationService.requestNotificationPermission();
      expect(['granted', 'denied', 'default']).toContain(permission);
    });
  });
});
