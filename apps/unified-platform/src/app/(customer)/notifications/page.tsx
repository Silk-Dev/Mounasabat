'use client';

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { NotificationPreferences, NotificationHistory } from '@/components/notifications';

export default function NotificationsPage() {
    return (
        <div className="container mx-auto px-4 py-8">
            <div className="max-w-4xl mx-auto">
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-900">Notifications</h1>
                    <p className="text-gray-600 mt-2">
                        Manage your notification preferences and view your notification history.
                    </p>
                </div>

                <Tabs defaultValue="preferences" className="space-y-6">
                    <TabsList className="grid w-full grid-cols-2">
                        <TabsTrigger value="preferences">Preferences</TabsTrigger>
                        <TabsTrigger value="history">History</TabsTrigger>
                    </TabsList>

                    <TabsContent value="preferences">
                        <NotificationPreferences />
                    </TabsContent>

                    <TabsContent value="history">
                        <NotificationHistory />
                    </TabsContent>
                </Tabs>
            </div>
        </div>
    );
}