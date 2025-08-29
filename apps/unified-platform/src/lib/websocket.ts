import { io, Socket } from 'socket.io-client';
import { logger } from './logger';

export interface WebSocketMessage {
  type: 'availability_update' | 'booking_notification' | 'chat_message' | 'dashboard_update' | 'notification';
  data: any;
  timestamp: Date;
  userId?: string;
  providerId?: string;
}

export interface AvailabilityUpdate {
  providerId: string;
  serviceId: string;
  date: string;
  available: boolean;
  slots?: string[];
}

export interface BookingNotification {
  bookingId: string;
  providerId: string;
  customerId: string;
  type: 'new_booking' | 'booking_updated' | 'booking_cancelled';
  booking: {
    id: string;
    customerName: string;
    serviceName: string;
    date: string;
    status: string;
    totalAmount: number;
  };
}

export interface ChatMessage {
  id: string;
  conversationId: string;
  senderId: string;
  receiverId: string;
  message: string;
  timestamp: Date;
  type: 'text' | 'image' | 'file';
  metadata?: Record<string, any>;
}

export interface DashboardUpdate {
  type: 'metrics' | 'bookings' | 'revenue';
  data: any;
  providerId?: string;
}

class WebSocketService {
  private socket: Socket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;
  private listeners: Map<string, Set<(data: any) => void>> = new Map();

  connect(userId: string, userRole: 'customer' | 'provider' | 'admin') {
    if (this.socket?.connected) {
      return;
    }

    this.socket = io(process.env.NEXT_PUBLIC_WEBSOCKET_URL || 'ws://localhost:3001', {
      auth: {
        userId,
        userRole,
      },
      transports: ['websocket', 'polling'],
      timeout: 20000,
      forceNew: true,
    });

    this.setupEventHandlers();
  }

  private setupEventHandlers() {
    if (!this.socket) return;

    this.socket.on('connect', () => {
      logger.info('WebSocket connected');
      this.reconnectAttempts = 0;
    });

    this.socket.on('disconnect', (reason) => {
      logger.info('WebSocket disconnected:', reason);
      if (reason === 'io server disconnect') {
        // Server initiated disconnect, reconnect manually
        this.reconnect();
      }
    });

    this.socket.on('connect_error', (error) => {
      logger.error('WebSocket connection error:', error);
      this.reconnect();
    });

    // Handle different message types
    this.socket.on('availability_update', (data: AvailabilityUpdate) => {
      this.emit('availability_update', data);
    });

    this.socket.on('booking_notification', (data: BookingNotification) => {
      this.emit('booking_notification', data);
    });

    this.socket.on('chat_message', (data: ChatMessage) => {
      this.emit('chat_message', data);
    });

    this.socket.on('dashboard_update', (data: DashboardUpdate) => {
      this.emit('dashboard_update', data);
    });

    this.socket.on('notification', (data: any) => {
      this.emit('notification', data);
    });
  }

  private reconnect() {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      logger.error('Max reconnection attempts reached');
      return;
    }

    this.reconnectAttempts++;
    const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1);

    setTimeout(() => {
      logger.info(`Attempting to reconnect (${this.reconnectAttempts}/${this.maxReconnectAttempts});`);
      this.socket?.connect();
    }, delay);
  }

  subscribe(event: string, callback: (data: any) => void) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(callback);

    // Return unsubscribe function
    return () => {
      const eventListeners = this.listeners.get(event);
      if (eventListeners) {
        eventListeners.delete(callback);
        if (eventListeners.size === 0) {
          this.listeners.delete(event);
        }
      }
    };
  }

  private emit(event: string, data: any) {
    const eventListeners = this.listeners.get(event);
    if (eventListeners) {
      eventListeners.forEach(callback => callback(data));
    }
  }

  // Send messages
  sendChatMessage(message: Omit<ChatMessage, 'id' | 'timestamp'>) {
    if (this.socket?.connected) {
      this.socket.emit('send_chat_message', message);
    }
  }

  updateAvailability(update: AvailabilityUpdate) {
    if (this.socket?.connected) {
      this.socket.emit('update_availability', update);
    }
  }

  joinRoom(roomId: string) {
    if (this.socket?.connected) {
      this.socket.emit('join_room', roomId);
    }
  }

  leaveRoom(roomId: string) {
    if (this.socket?.connected) {
      this.socket.emit('leave_room', roomId);
    }
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
    this.listeners.clear();
    this.reconnectAttempts = 0;
  }

  isConnected(): boolean {
    return this.socket?.connected || false;
  }
}

export const websocketService = new WebSocketService();
