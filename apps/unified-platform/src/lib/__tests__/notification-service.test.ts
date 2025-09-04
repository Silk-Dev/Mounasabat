import { NotificationService } from '../notification-service';
import { NotificationType } from '@prisma/client';

// Mock Prisma
const mockPrisma = {
  notification: {
    create: jest.fn(),
    findMany: jest.fn(),
    count: jest.fn(),
    updateMany: jest.fn(),
    deleteMany: jest.fn(),
  },
  user: {
    findUnique: jest.fn(),
    update: jest.fn(),
  },
  booking: {
    findUnique: jest.fn(),
  },
};

jest.mock('../prisma', () => ({
  prisma: mockPrisma,
}));

// Mock EmailService
const mockEmailService = {
  sendBookingConfirmation: jest.fn(),
  sendBookingUpdate: jest.fn(),
  sendNotificationEmail: jest.fn(),
};

jest.mock('@packages/notifications', () => ({
  EmailService: jest.fn().mockImplementation(() => mockEmailService),
}));

describe('NotificationService', () => {
  let notificationService: NotificationService;

  beforeEach(() => {
    notificationService = new NotificationService();
    jest.clearAllMocks();
  });

  describe('createNotification', () => {
    it('creates a notification successfully', async () => {
      const mockNotification = {
        id: '1',
        userId: 'user1',
        type: NotificationType.IN_APP,
        title: 'Test',
        message: 'Test message',
        isRead: false,
        data: null,
        createdAt: new Date(),
      };

      mockPrisma.notification.create.mockResolvedValue(mockNotification);

      const result = await notificationService.createNotification({
        userId: 'user1',
        type: NotificationType.IN_APP,
        title: 'Test',
        message: 'Test message',
      });

      expect(mockPrisma.notification.create).toHaveBeenCalledWith({
        data: {
          userId: 'user1',
          type: NotificationType.IN_APP,
          title: 'Test',
          message: 'Test message',
          data: undefined,
        },
      });

      expect(result).toEqual(mockNotification);
    });

    it('handles errors when creating notification', async () => {
      mockPrisma.notification.create.mockRejectedValue(new Error('Database error'));

      await expect(
        notificationService.createNotification({
          userId: 'user1',
          type: NotificationType.IN_APP,
          title: 'Test',
          message: 'Test message',
        })
      ).rejects.toThrow('Failed to create notification');
    });
  });

  describe('getUserNotifications', () => {
    it('returns user notifications with pagination', async () => {
      const mockNotifications = [
        {
          id: '1',
          userId: 'user1',
          type: NotificationType.IN_APP,
          title: 'Test 1',
          message: 'Test message 1',
          isRead: false,
          createdAt: new Date(),
        },
        {
          id: '2',
          userId: 'user1',
          type: NotificationType.EMAIL,
          title: 'Test 2',
          message: 'Test message 2',
          isRead: true,
          createdAt: new Date(),
        },
      ];

      mockPrisma.notification.findMany.mockResolvedValue(mockNotifications);
      mockPrisma.notification.count.mockResolvedValueOnce(2); // total count
      mockPrisma.notification.count.mockResolvedValueOnce(1); // unread count

      const result = await notificationService.getUserNotifications('user1', 1, 20);

      expect(mockPrisma.notification.findMany).toHaveBeenCalledWith({
        where: { userId: 'user1' },
        orderBy: { createdAt: 'desc' },
        skip: 0,
        take: 20,
      });

      expect(result).toEqual({
        notifications: mockNotifications,
        total: 2,
        unreadCount: 1,
        hasMore: false,
      });
    });
  });

  describe('markAsRead', () => {
    it('marks notification as read', async () => {
      mockPrisma.notification.updateMany.mockResolvedValue({ count: 1 });

      await notificationService.markAsRead('notification1', 'user1');

      expect(mockPrisma.notification.updateMany).toHaveBeenCalledWith({
        where: { id: 'notification1', userId: 'user1' },
        data: { isRead: true },
      });
    });
  });

  describe('markAllAsRead', () => {
    it('marks all notifications as read for user', async () => {
      mockPrisma.notification.updateMany.mockResolvedValue({ count: 5 });

      await notificationService.markAllAsRead('user1');

      expect(mockPrisma.notification.updateMany).toHaveBeenCalledWith({
        where: { userId: 'user1', isRead: false },
        data: { isRead: true },
      });
    });
  });

  describe('deleteNotification', () => {
    it('deletes notification for user', async () => {
      mockPrisma.notification.deleteMany.mockResolvedValue({ count: 1 });

      await notificationService.deleteNotification('notification1', 'user1');

      expect(mockPrisma.notification.deleteMany).toHaveBeenCalledWith({
        where: { id: 'notification1', userId: 'user1' },
      });
    });
  });

  describe('getUserPreferences', () => {
    it('returns default preferences when user has none', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({
        preferences: null,
      });

      const result = await notificationService.getUserPreferences('user1');

      expect(result).toEqual({
        emailBookingConfirmations: true,
        emailBookingUpdates: true,
        emailPromotions: false,
        emailReminders: true,
        inAppNotifications: true,
        pushNotifications: false,
      });
    });

    it('returns user preferences when they exist', async () => {
      const userPreferences = {
        emailBookingConfirmations: false,
        emailBookingUpdates: true,
        emailPromotions: true,
        emailReminders: false,
        inAppNotifications: true,
        pushNotifications: true,
      };

      mockPrisma.user.findUnique.mockResolvedValue({
        preferences: userPreferences,
      });

      const result = await notificationService.getUserPreferences('user1');

      expect(result).toEqual(userPreferences);
    });
  });

  describe('updateUserPreferences', () => {
    it('updates user preferences', async () => {
      const currentPreferences = {
        emailBookingConfirmations: true,
        emailBookingUpdates: true,
      };

      const newPreferences = {
        emailPromotions: true,
      };

      mockPrisma.user.findUnique.mockResolvedValue({
        preferences: currentPreferences,
      });

      mockPrisma.user.update.mockResolvedValue({
        preferences: { ...currentPreferences, ...newPreferences },
      });

      const result = await notificationService.updateUserPreferences('user1', newPreferences);

      expect(mockPrisma.user.update).toHaveBeenCalledWith({
        where: { id: 'user1' },
        data: { preferences: { ...currentPreferences, ...newPreferences } },
      });

      expect(result).toEqual({ ...currentPreferences, ...newPreferences });
    });
  });
});
