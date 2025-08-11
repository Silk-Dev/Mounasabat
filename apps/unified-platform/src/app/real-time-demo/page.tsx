'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { RealTimeProvider } from '@/components/provider/RealTimeProvider';
import { RealTimeAvailability } from '@/components/provider/RealTimeAvailability';
import { RealTimeBookingNotifications } from '@/components/notifications/RealTimeBookingNotifications';
import { LiveChat } from '@/components/chat/LiveChat';
import { RealTimeDashboard } from '@/components/dashboard/RealTimeDashboard';
import { useRealTimeContext } from '@/components/provider/RealTimeProvider';

function RealTimeDemoContent() {
  const [showChat, setShowChat] = useState(false);
  const [chatMinimized, setChatMinimized] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date>();
  const [selectedTime, setSelectedTime] = useState<string>();
  
  const realTime = useRealTimeContext();

  const handleSlotSelect = (date: Date, time: string) => {
    setSelectedDate(date);
    setSelectedTime(time);
  };

  const handleNotificationClick = (bookingId: string) => {
    console.log('Notification clicked for booking:', bookingId);
    // Navigate to booking details or open relevant view
  };

  const mockOtherUser = {
    id: 'user-456',
    name: 'John Doe',
    avatar: '/avatars/john-doe.jpg',
    isOnline: true,
    role: 'customer' as const
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Real-time Features Demo</h1>
          <p className="text-muted-foreground">
            Demonstration of all real-time features in the unified booking platform
          </p>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <div className={`w-3 h-3 rounded-full ${
              realTime.connectionStatus === 'connected' ? 'bg-green-500' : 
              realTime.connectionStatus === 'connecting' ? 'bg-yellow-500' : 'bg-red-500'
            }`} />
            <span className="text-sm font-medium capitalize">
              {realTime.connectionStatus}
            </span>
          </div>
          
          <Badge variant="outline">
            {realTime.unreadCount} unread notifications
          </Badge>
        </div>
      </div>

      <Tabs defaultValue="availability" className="space-y-4">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="availability">Availability</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
          <TabsTrigger value="chat">Live Chat</TabsTrigger>
          <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
          <TabsTrigger value="integration">Integration</TabsTrigger>
        </TabsList>

        <TabsContent value="availability" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Real-time Availability Updates</CardTitle>
              <p className="text-sm text-muted-foreground">
                Availability updates in real-time as bookings are made or cancelled
              </p>
            </CardHeader>
            <CardContent>
              <RealTimeAvailability
                providerId="provider-123"
                serviceId="service-456"
                onSlotSelect={handleSlotSelect}
                selectedDate={selectedDate}
                selectedTime={selectedTime}
              />
              
              {selectedDate && selectedTime && (
                <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
                  <h4 className="font-medium text-green-800">Selected Slot</h4>
                  <p className="text-sm text-green-600">
                    {selectedDate.toDateString()} at {selectedTime}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notifications" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Real-time Booking Notifications</CardTitle>
              <p className="text-sm text-muted-foreground">
                Receive instant notifications for new bookings, updates, and cancellations
              </p>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  <Button
                    onClick={() => {
                      // Simulate a booking notification
                      const mockNotification = {
                        bookingId: 'booking-' + Date.now(),
                        providerId: 'provider-123',
                        customerId: 'customer-456',
                        type: 'new_booking' as const,
                        booking: {
                          id: 'booking-' + Date.now(),
                          customerName: 'Jane Smith',
                          serviceName: 'Wedding Photography',
                          date: new Date().toISOString(),
                          status: 'pending',
                          totalAmount: 1500
                        }
                      };
                      
                      // This would normally come through WebSocket
                      console.log('Mock notification:', mockNotification);
                    }}
                  >
                    Simulate New Booking
                  </Button>
                  
                  <Button
                    variant="outline"
                    onClick={() => realTime.markAllNotificationsAsRead()}
                  >
                    Mark All Read
                  </Button>
                </div>
                
                <div className="text-sm text-muted-foreground">
                  Notifications will appear in the top-right corner when received.
                  Current unread count: {realTime.unreadCount}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="chat" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Live Chat System</CardTitle>
              <p className="text-sm text-muted-foreground">
                Real-time messaging between customers and providers
              </p>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  <Button
                    onClick={() => {
                      setShowChat(true);
                      setChatMinimized(false);
                    }}
                  >
                    Open Chat
                  </Button>
                  
                  <Button
                    variant="outline"
                    onClick={() => setChatMinimized(!chatMinimized)}
                    disabled={!showChat}
                  >
                    {chatMinimized ? 'Restore' : 'Minimize'} Chat
                  </Button>
                  
                  <Button
                    variant="outline"
                    onClick={() => setShowChat(false)}
                    disabled={!showChat}
                  >
                    Close Chat
                  </Button>
                </div>
                
                <div className="text-sm text-muted-foreground">
                  Chat features include:
                  <ul className="list-disc list-inside mt-2 space-y-1">
                    <li>Real-time message delivery</li>
                    <li>Typing indicators</li>
                    <li>Read receipts</li>
                    <li>File attachments (planned)</li>
                    <li>Message history</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="dashboard" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Real-time Dashboard Updates</CardTitle>
              <p className="text-sm text-muted-foreground">
                Live metrics and booking updates for providers and admins
              </p>
            </CardHeader>
            <CardContent>
              <RealTimeDashboard
                providerId="provider-123"
                userRole="provider"
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="integration" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Integration Overview</CardTitle>
              <p className="text-sm text-muted-foreground">
                How real-time features integrate across the platform
              </p>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div>
                  <h4 className="font-medium mb-2">WebSocket Connection</h4>
                  <div className="text-sm text-muted-foreground space-y-1">
                    <p>Status: <span className="font-medium capitalize">{realTime.connectionStatus}</span></p>
                    <p>Connected: <span className="font-medium">{realTime.isConnected ? 'Yes' : 'No'}</span></p>
                    <p>Unread Notifications: <span className="font-medium">{realTime.unreadCount}</span></p>
                  </div>
                </div>
                
                <div>
                  <h4 className="font-medium mb-2">Real-time Features</h4>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                        <span>Availability Updates</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                        <span>Booking Notifications</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                        <span>Live Chat</span>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                        <span>Dashboard Updates</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                        <span>Push Notifications</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                        <span>Browser Notifications</span>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div>
                  <h4 className="font-medium mb-2">Technical Implementation</h4>
                  <div className="text-sm text-muted-foreground space-y-1">
                    <p>• WebSocket connection with automatic reconnection</p>
                    <p>• Real-time notification service with toast integration</p>
                    <p>• React hooks for easy component integration</p>
                    <p>• Context provider for global state management</p>
                    <p>• Database integration for persistence</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Real-time Booking Notifications */}
      <RealTimeBookingNotifications
        providerId="provider-123"
        onNotificationClick={handleNotificationClick}
      />

      {/* Live Chat */}
      {showChat && (
        <LiveChat
          conversationId="conv-123"
          currentUserId="user-123"
          otherUser={mockOtherUser}
          onClose={() => setShowChat(false)}
          onMinimize={() => setChatMinimized(!chatMinimized)}
          isMinimized={chatMinimized}
        />
      )}
    </div>
  );
}

export default function RealTimeDemoPage() {
  return (
    <RealTimeProvider userId="user-123" userRole="provider">
      <RealTimeDemoContent />
    </RealTimeProvider>
  );
}