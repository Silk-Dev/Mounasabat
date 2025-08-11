'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { pushNotificationService } from '@/lib/push-notifications';

export default function NotificationsDemoPage() {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    type: 'IN_APP',
    title: 'Test Notification',
    message: 'This is a test notification message',
    sendEmail: false,
  });

  const handleCreateNotification = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/notifications', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        toast.success('Notification created successfully');
        // Reset form
        setFormData({
          type: 'IN_APP',
          title: 'Test Notification',
          message: 'This is a test notification message',
          sendEmail: false,
        });
      } else {
        throw new Error('Failed to create notification');
      }
    } catch (error) {
      console.error('Error creating notification:', error);
      toast.error('Failed to create notification');
    } finally {
      setLoading(false);
    }
  };

  const handleTestBookingConfirmation = async () => {
    setLoading(true);
    try {
      // This would normally be called when a booking is created
      // For demo purposes, we'll create a mock notification
      const response = await fetch('/api/notifications', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: 'EMAIL',
          title: 'Booking Confirmed',
          message: 'Your booking for Wedding Photography has been confirmed for December 25, 2024.',
          data: { type: 'booking_confirmation', bookingId: 'demo-123' },
          sendEmail: true,
        }),
      });

      if (response.ok) {
        toast.success('Booking confirmation notification sent');
      } else {
        throw new Error('Failed to send booking confirmation');
      }
    } catch (error) {
      console.error('Error sending booking confirmation:', error);
      toast.error('Failed to send booking confirmation');
    } finally {
      setLoading(false);
    }
  };

  const handleTestPushNotification = async () => {
    try {
      if (!pushNotificationService.isSupported()) {
        toast.error('Push notifications are not supported in this browser');
        return;
      }

      const permission = await pushNotificationService.requestPermission();
      if (permission !== 'granted') {
        toast.error('Push notification permission denied');
        return;
      }

      await pushNotificationService.showNotification({
        title: 'Test Push Notification',
        body: 'This is a test push notification from Mounasabet',
        icon: '/icon-192x192.png',
        tag: 'test',
        data: { url: '/notifications' },
      });

      toast.success('Push notification sent');
    } catch (error) {
      console.error('Error sending push notification:', error);
      toast.error('Failed to send push notification');
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-2xl mx-auto space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Notifications Demo</h1>
          <p className="text-gray-600 mt-2">
            Test the notification system functionality.
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Create Custom Notification</CardTitle>
            <CardDescription>
              Create a custom notification to test the system.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="type">Notification Type</Label>
              <Select
                value={formData.type}
                onValueChange={(value) => setFormData({ ...formData, type: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="IN_APP">In-App</SelectItem>
                  <SelectItem value="EMAIL">Email</SelectItem>
                  <SelectItem value="PUSH">Push</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="Notification title"
              />
            </div>

            <div>
              <Label htmlFor="message">Message</Label>
              <Textarea
                id="message"
                value={formData.message}
                onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                placeholder="Notification message"
                rows={3}
              />
            </div>

            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="sendEmail"
                checked={formData.sendEmail}
                onChange={(e) => setFormData({ ...formData, sendEmail: e.target.checked })}
              />
              <Label htmlFor="sendEmail">Also send email</Label>
            </div>

            <Button onClick={handleCreateNotification} disabled={loading}>
              {loading ? 'Creating...' : 'Create Notification'}
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Test Predefined Notifications</CardTitle>
            <CardDescription>
              Test common notification scenarios.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Button
                variant="outline"
                onClick={handleTestBookingConfirmation}
                disabled={loading}
              >
                Test Booking Confirmation
              </Button>
              
              <Button
                variant="outline"
                onClick={handleTestPushNotification}
                disabled={loading}
              >
                Test Push Notification
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Push Notification Status</CardTitle>
            <CardDescription>
              Check push notification support and permissions.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-sm">
              <p>
                <strong>Supported:</strong>{' '}
                {pushNotificationService.isSupported() ? 'Yes' : 'No'}
              </p>
              <p>
                <strong>Permission:</strong>{' '}
                {pushNotificationService.getPermissionStatus()}
              </p>
              <p>
                <strong>Service Worker:</strong>{' '}
                {'serviceWorker' in navigator ? 'Supported' : 'Not supported'}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}