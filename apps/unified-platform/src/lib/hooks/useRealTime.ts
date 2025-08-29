'use client';

import { useState, useEffect, useCallback } from 'react';
import { websocketService, WebSocketMessage, AvailabilityUpdate, BookingNotification, ChatMessage, DashboardUpdate } from '../websocket';
import { realTimeNotificationService, RealTimeNotification } from '../real-time-notifications';

interface UseRealTimeOptions {
  userId: string;
  userRole: 'customer' | 'provider' | 'admin';
  autoConnect?: boolean;
}

interface UseRealTimeReturn {
  // Connection status
  isConnected: boolean;
  connectionStatus: 'connected' | 'disconnected' | 'connecting';
  
  // Connection methods
  connect: () => void;
  disconnect: () => void;
  
  // Subscription methods
  subscribeToAvailability: (callback: (update: AvailabilityUpdate) => void) => () => void;
  subscribeToBookingNotifications: (callback: (notification: BookingNotification) => void) => () => void;
  subscribeToChatMessages: (callback: (message: ChatMessage) => void) => () => void;
  subscribeToDashboardUpdates: (callback: (update: DashboardUpdate) => void) => () => void;
  subscribeToNotifications: (callback: (notifications: RealTimeNotification[]) => void) => () => void;
  subscribeToUnreadCount: (callback: (count: number) => void) => () => void;
  
  // Action methods
  sendChatMessage: (message: Omit<ChatMessage, 'id' | 'timestamp'>) => void;
  updateAvailability: (update: AvailabilityUpdate) => void;
  joinRoom: (roomId: string) => void;
  leaveRoom: (roomId: string) => void;
  markNotificationAsRead: (notificationId: string) => Promise<void>;
  markAllNotificationsAsRead: () => Promise<void>;
  
  // Data
  notifications: RealTimeNotification[];
  unreadCount: number;
}

export function useRealTime({ userId, userRole, autoConnect = true }: UseRealTimeOptions): UseRealTimeReturn {
  const [isConnected, setIsConnected] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'connected' | 'disconnected' | 'connecting'>('disconnected');
  const [notifications, setNotifications] = useState<RealTimeNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  // Connection methods
  const connect = useCallback(() => {
    if (!websocketService.isConnected()) {
      setConnectionStatus('connecting');
      websocketService.connect(userId, userRole);
    }
  }, [userId, userRole]);

  const disconnect = useCallback(() => {
    websocketService.disconnect();
    setIsConnected(false);
    setConnectionStatus('disconnected');
  }, []);

  // Monitor connection status
  useEffect(() => {
    const checkConnection = setInterval(() => {
      const connected = websocketService.isConnected();
      setIsConnected(connected);
      setConnectionStatus(connected ? 'connected' : 'disconnected');
    }, 1000);

    return () => clearInterval(checkConnection);
  }, []);

  // Auto-connect if enabled
  useEffect(() => {
    if (autoConnect && userId && userRole) {
      connect();
    }

    return () => {
      if (autoConnect) {
        disconnect();
      }
    };
  }, [autoConnect, userId, userRole, connect, disconnect]);

  // Set up notification service
  useEffect(() => {
    // Load initial notifications
    realTimeNotificationService.loadNotifications();

    // Subscribe to notifications
    const unsubscribeNotifications = realTimeNotificationService.subscribe(setNotifications);
    const unsubscribeUnreadCount = realTimeNotificationService.subscribeToUnreadCount(setUnreadCount);

    return () => {
      unsubscribeNotifications();
      unsubscribeUnreadCount();
    };
  }, []);

  // Subscription methods
  const subscribeToAvailability = useCallback((callback: (update: AvailabilityUpdate) => void) => {
    return websocketService.subscribe('availability_update', callback);
  }, []);

  const subscribeToBookingNotifications = useCallback((callback: (notification: BookingNotification) => void) => {
    return websocketService.subscribe('booking_notification', callback);
  }, []);

  const subscribeToChatMessages = useCallback((callback: (message: ChatMessage) => void) => {
    return websocketService.subscribe('chat_message', callback);
  }, []);

  const subscribeToDashboardUpdates = useCallback((callback: (update: DashboardUpdate) => void) => {
    return websocketService.subscribe('dashboard_update', callback);
  }, []);

  const subscribeToNotifications = useCallback((callback: (notifications: RealTimeNotification[]) => void) => {
    return realTimeNotificationService.subscribe(callback);
  }, []);

  const subscribeToUnreadCount = useCallback((callback: (count: number) => void) => {
    return realTimeNotificationService.subscribeToUnreadCount(callback);
  }, []);

  // Action methods
  const sendChatMessage = useCallback((message: Omit<ChatMessage, 'id' | 'timestamp'>) => {
    websocketService.sendChatMessage(message);
  }, []);

  const updateAvailability = useCallback((update: AvailabilityUpdate) => {
    websocketService.updateAvailability(update);
  }, []);

  const joinRoom = useCallback((roomId: string) => {
    websocketService.joinRoom(roomId);
  }, []);

  const leaveRoom = useCallback((roomId: string) => {
    websocketService.leaveRoom(roomId);
  }, []);

  const markNotificationAsRead = useCallback(async (notificationId: string) => {
    await realTimeNotificationService.markAsRead(notificationId);
  }, []);

  const markAllNotificationsAsRead = useCallback(async () => {
    await realTimeNotificationService.markAllAsRead();
  }, []);

  return {
    // Connection status
    isConnected,
    connectionStatus,
    
    // Connection methods
    connect,
    disconnect,
    
    // Subscription methods
    subscribeToAvailability,
    subscribeToBookingNotifications,
    subscribeToChatMessages,
    subscribeToDashboardUpdates,
    subscribeToNotifications,
    subscribeToUnreadCount,
    
    // Action methods
    sendChatMessage,
    updateAvailability,
    joinRoom,
    leaveRoom,
    markNotificationAsRead,
    markAllNotificationsAsRead,
    
    // Data
    notifications,
    unreadCount
  };
}
