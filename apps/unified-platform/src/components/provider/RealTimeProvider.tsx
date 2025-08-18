'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { useRealTime } from '@/lib/hooks/useRealTime';
import { RealTimeNotification } from '@/lib/real-time-notifications';
import { AvailabilityUpdate, BookingNotification, ChatMessage, DashboardUpdate } from '@/lib/websocket';

interface RealTimeContextType {
  // Connection status
  isConnected: boolean;
  connectionStatus: 'connected' | 'disconnected' | 'connecting';
  
  // Subscription methods
  subscribeToAvailability: (callback: (update: AvailabilityUpdate) => void) => () => void;
  subscribeToBookingNotifications: (callback: (notification: BookingNotification) => void) => () => void;
  subscribeToChatMessages: (callback: (message: ChatMessage) => void) => () => void;
  subscribeToDashboardUpdates: (callback: (update: DashboardUpdate) => void) => () => void;
  
  // Action methods
  sendChatMessage: (message: Omit<ChatMessage, 'id' | 'timestamp'>) => void;
  updateAvailability: (update: AvailabilityUpdate) => void;
  joinRoom: (roomId: string) => void;
  leaveRoom: (roomId: string) => void;
  markNotificationAsRead: (notificationId: string) => Promise<void>;
  markAllNotificationsAsRead: () => Promise<void>;
  
  // Notifications
  notifications: RealTimeNotification[];
  unreadCount: number;
}

const RealTimeContext = createContext<RealTimeContextType | null>(null);

interface RealTimeProviderProps {
  children: React.ReactNode;
  userId: string;
  userRole: 'customer' | 'provider' | 'admin';
}

export function RealTimeProvider({ children, userId, userRole }: RealTimeProviderProps) {
  const realTime = useRealTime({ userId, userRole, autoConnect: true });

  const contextValue: RealTimeContextType = {
    isConnected: realTime.isConnected,
    connectionStatus: realTime.connectionStatus,
    subscribeToAvailability: realTime.subscribeToAvailability,
    subscribeToBookingNotifications: realTime.subscribeToBookingNotifications,
    subscribeToChatMessages: realTime.subscribeToChatMessages,
    subscribeToDashboardUpdates: realTime.subscribeToDashboardUpdates,
    sendChatMessage: realTime.sendChatMessage,
    updateAvailability: realTime.updateAvailability,
    joinRoom: realTime.joinRoom,
    leaveRoom: realTime.leaveRoom,
    markNotificationAsRead: realTime.markNotificationAsRead,
    markAllNotificationsAsRead: realTime.markAllNotificationsAsRead,
    notifications: realTime.notifications,
    unreadCount: realTime.unreadCount
  };

  return (
    <RealTimeContext.Provider value={contextValue}>
      {children}
    </RealTimeContext.Provider>
  );
}

export function useRealTimeContext() {
  const context = useContext(RealTimeContext);
  if (!context) {
    throw new Error('useRealTimeContext must be used within a RealTimeProvider');
  }
  return context;
}