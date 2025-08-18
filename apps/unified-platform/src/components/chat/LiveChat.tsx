'use client';

import { useState, useEffect, useRef } from 'react';
import { Send, Paperclip, Smile, Phone, Video, MoreVertical, X, Minimize2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { websocketService, ChatMessage } from '@/lib/websocket';
import { format, isToday, isYesterday } from 'date-fns';
import { logger } from '@/lib/production-logger';

interface LiveChatProps {
  conversationId: string;
  currentUserId: string;
  otherUser: {
    id: string;
    name: string;
    avatar?: string;
    isOnline?: boolean;
    role: 'customer' | 'provider';
  };
  onClose?: () => void;
  onMinimize?: () => void;
  isMinimized?: boolean;
}

export function LiveChat({
  conversationId,
  currentUserId,
  otherUser,
  onClose,
  onMinimize,
  isMinimized = false
}: LiveChatProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [otherUserTyping, setOtherUserTyping] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'connected' | 'disconnected' | 'connecting'>('connecting');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    // Load chat history
    loadChatHistory();

    // Set up WebSocket connection
    const userRole = 'customer'; // Get from auth context
    websocketService.connect(currentUserId, userRole);
    
    // Join conversation room
    websocketService.joinRoom(conversationId);
    
    // Subscribe to chat messages
    const unsubscribeChatMessage = websocketService.subscribe('chat_message', handleChatMessage);
    const unsubscribeTyping = websocketService.subscribe('user_typing', handleUserTyping);

    // Monitor connection status
    const checkConnection = setInterval(() => {
      setConnectionStatus(websocketService.isConnected() ? 'connected' : 'disconnected');
    }, 1000);

    return () => {
      unsubscribeChatMessage();
      unsubscribeTyping();
      websocketService.leaveRoom(conversationId);
      clearInterval(checkConnection);
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, [conversationId, currentUserId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const loadChatHistory = async () => {
    try {
      const response = await fetch(`/api/chat/${conversationId}/messages`);
      if (response.ok) {
        const data = await response.json();
        setMessages(data.messages || []);
      }
    } catch (error) {
      logger.error('Failed to load chat history:', error);
    }
  };

  const handleChatMessage = (message: ChatMessage) => {
    if (message.conversationId === conversationId) {
      setMessages(prev => [...prev, message]);
      
      // Mark message as read if it's from the other user
      if (message.senderId !== currentUserId) {
        markMessageAsRead(message.id);
      }
    }
  };

  const handleUserTyping = (data: { userId: string; conversationId: string; isTyping: boolean }) => {
    if (data.conversationId === conversationId && data.userId !== currentUserId) {
      setOtherUserTyping(data.isTyping);
    }
  };

  const markMessageAsRead = async (messageId: string) => {
    try {
      await fetch(`/api/chat/messages/${messageId}/read`, {
        method: 'POST'
      });
    } catch (error) {
      logger.error('Failed to mark message as read:', error);
    }
  };

  const sendMessage = () => {
    if (!newMessage.trim() || connectionStatus !== 'connected') return;

    const message: Omit<ChatMessage, 'id' | 'timestamp'> = {
      conversationId,
      senderId: currentUserId,
      receiverId: otherUser.id,
      message: newMessage.trim(),
      type: 'text'
    };

    websocketService.sendChatMessage(message);
    setNewMessage('');
    setIsTyping(false);
  };

  const handleInputChange = (value: string) => {
    setNewMessage(value);
    
    if (!isTyping && value.trim()) {
      setIsTyping(true);
      websocketService.socket?.emit('typing_start', { conversationId, userId: currentUserId });
    }

    // Clear existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // Set new timeout to stop typing indicator
    typingTimeoutRef.current = setTimeout(() => {
      setIsTyping(false);
      websocketService.socket?.emit('typing_stop', { conversationId, userId: currentUserId });
    }, 1000);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const formatMessageTime = (timestamp: Date) => {
    const date = new Date(timestamp);
    if (isToday(date)) {
      return format(date, 'h:mm a');
    } else if (isYesterday(date)) {
      return `Yesterday ${format(date, 'h:mm a')}`;
    } else {
      return format(date, 'MMM d, h:mm a');
    }
  };

  const groupMessagesByDate = (messages: ChatMessage[]) => {
    const groups: { [key: string]: ChatMessage[] } = {};
    
    messages.forEach(message => {
      const date = format(new Date(message.timestamp), 'yyyy-MM-dd');
      if (!groups[date]) {
        groups[date] = [];
      }
      groups[date].push(message);
    });
    
    return groups;
  };

  const messageGroups = groupMessagesByDate(messages);

  if (isMinimized) {
    return (
      <div className="fixed bottom-4 right-4 z-50">
        <Button
          onClick={onMinimize}
          className="rounded-full w-12 h-12 shadow-lg"
          size="icon"
        >
          <Avatar className="w-8 h-8">
            <AvatarImage src={otherUser.avatar} />
            <AvatarFallback>{otherUser.name.charAt(0)}</AvatarFallback>
          </Avatar>
        </Button>
      </div>
    );
  }

  return (
    <Card className="fixed bottom-4 right-4 z-50 w-80 h-96 shadow-xl">
      <CardHeader className="flex flex-row items-center justify-between p-3 border-b">
        <div className="flex items-center space-x-2">
          <Avatar className="w-8 h-8">
            <AvatarImage src={otherUser.avatar} />
            <AvatarFallback>{otherUser.name.charAt(0)}</AvatarFallback>
          </Avatar>
          <div>
            <h4 className="font-medium text-sm">{otherUser.name}</h4>
            <div className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${otherUser.isOnline ? 'bg-green-500' : 'bg-gray-400'}`} />
              <span className="text-xs text-muted-foreground">
                {otherUser.isOnline ? 'Online' : 'Offline'}
              </span>
              <div className={`w-2 h-2 rounded-full ${
                connectionStatus === 'connected' ? 'bg-green-500' : 
                connectionStatus === 'connecting' ? 'bg-yellow-500' : 'bg-red-500'
              }`} />
            </div>
          </div>
        </div>
        
        <div className="flex items-center space-x-1">
          <Button size="icon" variant="ghost" className="w-6 h-6">
            <Phone className="w-3 h-3" />
          </Button>
          <Button size="icon" variant="ghost" className="w-6 h-6">
            <Video className="w-3 h-3" />
          </Button>
          <Button size="icon" variant="ghost" className="w-6 h-6" onClick={onMinimize}>
            <Minimize2 className="w-3 h-3" />
          </Button>
          <Button size="icon" variant="ghost" className="w-6 h-6" onClick={onClose}>
            <X className="w-3 h-3" />
          </Button>
        </div>
      </CardHeader>

      <CardContent className="p-0 flex flex-col h-80">
        <ScrollArea className="flex-1 p-3">
          <div className="space-y-4">
            {Object.entries(messageGroups).map(([date, dayMessages]) => (
              <div key={date}>
                <div className="text-center text-xs text-muted-foreground mb-2">
                  {isToday(new Date(date)) ? 'Today' : 
                   isYesterday(new Date(date)) ? 'Yesterday' : 
                   format(new Date(date), 'MMM d, yyyy')}
                </div>
                
                {dayMessages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex ${message.senderId === currentUserId ? 'justify-end' : 'justify-start'} mb-2`}
                  >
                    <div
                      className={`max-w-[70%] rounded-lg px-3 py-2 ${
                        message.senderId === currentUserId
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-muted'
                      }`}
                    >
                      <p className="text-sm">{message.message}</p>
                      <p className="text-xs opacity-70 mt-1">
                        {formatMessageTime(message.timestamp)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ))}
            
            {otherUserTyping && (
              <div className="flex justify-start">
                <div className="bg-muted rounded-lg px-3 py-2">
                  <div className="flex space-x-1">
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                  </div>
                </div>
              </div>
            )}
          </div>
          <div ref={messagesEndRef} />
        </ScrollArea>

        <div className="border-t p-3">
          <div className="flex items-center space-x-2">
            <Button size="icon" variant="ghost" className="w-8 h-8">
              <Paperclip className="w-4 h-4" />
            </Button>
            <Input
              placeholder="Type a message..."
              value={newMessage}
              onChange={(e) => handleInputChange(e.target.value)}
              onKeyPress={handleKeyPress}
              disabled={connectionStatus !== 'connected'}
              className="flex-1"
            />
            <Button size="icon" variant="ghost" className="w-8 h-8">
              <Smile className="w-4 h-4" />
            </Button>
            <Button
              size="icon"
              onClick={sendMessage}
              disabled={!newMessage.trim() || connectionStatus !== 'connected'}
              className="w-8 h-8"
            >
              <Send className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}