'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { Separator } from '@/components/ui/separator';
import { logger } from '@/lib/production-logger';

interface NotificationPreferences {
  emailBookingConfirmations: boolean;
  emailBookingUpdates: boolean;
  emailPromotions: boolean;
  emailReminders: boolean;
  inAppNotifications: boolean;
  pushNotifications: boolean;
}

export function NotificationPreferences() {
  const [preferences, setPreferences] = useState<NotificationPreferences>({
    emailBookingConfirmations: true,
    emailBookingUpdates: true,
    emailPromotions: false,
    emailReminders: true,
    inAppNotifications: true,
    pushNotifications: false,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadPreferences();
  }, []);

  const loadPreferences = async () => {
    try {
      const response = await fetch('/api/notifications/preferences');
      if (response.ok) {
        const data = await response.json();
        setPreferences(data);
      }
    } catch (error) {
      logger.error('Error loading preferences:', error);
      toast.error('Failed to load notification preferences');
    } finally {
      setLoading(false);
    }
  };

  const savePreferences = async () => {
    setSaving(true);
    try {
      const response = await fetch('/api/notifications/preferences', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(preferences),
      });

      if (response.ok) {
        toast.success('Notification preferences updated');
      } else {
        throw new Error('Failed to save preferences');
      }
    } catch (error) {
      logger.error('Error saving preferences:', error);
      toast.error('Failed to save notification preferences');
    } finally {
      setSaving(false);
    }
  };

  const updatePreference = (key: keyof NotificationPreferences, value: boolean) => {
    setPreferences(prev => ({ ...prev, [key]: value }));
  };

  const requestNotificationPermission = async () => {
    if ('Notification' in window) {
      const permission = await Notification.requestPermission();
      if (permission === 'granted') {
        updatePreference('pushNotifications', true);
        toast.success('Push notifications enabled');
      } else {
        toast.error('Push notification permission denied');
      }
    } else {
      toast.error('Push notifications not supported in this browser');
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Notification Preferences</CardTitle>
          <CardDescription>Loading preferences...</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Notification Preferences</CardTitle>
        <CardDescription>
          Choose how you want to receive notifications about your bookings and account activity.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Email Notifications */}
        <div>
          <h3 className="text-lg font-medium mb-4">Email Notifications</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="emailBookingConfirmations">Booking Confirmations</Label>
                <p className="text-sm text-muted-foreground">
                  Receive email confirmations when your bookings are confirmed
                </p>
              </div>
              <Switch
                id="emailBookingConfirmations"
                checked={preferences.emailBookingConfirmations}
                onCheckedChange={(checked) => updatePreference('emailBookingConfirmations', checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="emailBookingUpdates">Booking Updates</Label>
                <p className="text-sm text-muted-foreground">
                  Get notified when there are changes to your bookings
                </p>
              </div>
              <Switch
                id="emailBookingUpdates"
                checked={preferences.emailBookingUpdates}
                onCheckedChange={(checked) => updatePreference('emailBookingUpdates', checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="emailReminders">Event Reminders</Label>
                <p className="text-sm text-muted-foreground">
                  Receive reminders before your scheduled events
                </p>
              </div>
              <Switch
                id="emailReminders"
                checked={preferences.emailReminders}
                onCheckedChange={(checked) => updatePreference('emailReminders', checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="emailPromotions">Promotions & Updates</Label>
                <p className="text-sm text-muted-foreground">
                  Receive promotional offers and platform updates
                </p>
              </div>
              <Switch
                id="emailPromotions"
                checked={preferences.emailPromotions}
                onCheckedChange={(checked) => updatePreference('emailPromotions', checked)}
              />
            </div>
          </div>
        </div>

        <Separator />

        {/* In-App Notifications */}
        <div>
          <h3 className="text-lg font-medium mb-4">In-App Notifications</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="inAppNotifications">Enable In-App Notifications</Label>
                <p className="text-sm text-muted-foreground">
                  Show notifications within the application
                </p>
              </div>
              <Switch
                id="inAppNotifications"
                checked={preferences.inAppNotifications}
                onCheckedChange={(checked) => updatePreference('inAppNotifications', checked)}
              />
            </div>
          </div>
        </div>

        <Separator />

        {/* Push Notifications */}
        <div>
          <h3 className="text-lg font-medium mb-4">Push Notifications</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="pushNotifications">Browser Push Notifications</Label>
                <p className="text-sm text-muted-foreground">
                  Receive push notifications even when the app is closed
                </p>
              </div>
              <div className="flex items-center gap-2">
                {!preferences.pushNotifications && 'Notification' in window && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={requestNotificationPermission}
                  >
                    Enable
                  </Button>
                )}
                <Switch
                  id="pushNotifications"
                  checked={preferences.pushNotifications}
                  onCheckedChange={(checked) => updatePreference('pushNotifications', checked)}
                  disabled={!('Notification' in window)}
                />
              </div>
            </div>
            {!('Notification' in window) && (
              <p className="text-sm text-muted-foreground">
                Push notifications are not supported in this browser
              </p>
            )}
          </div>
        </div>

        <div className="flex justify-end">
          <Button onClick={savePreferences} disabled={saving}>
            {saving ? 'Saving...' : 'Save Preferences'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}