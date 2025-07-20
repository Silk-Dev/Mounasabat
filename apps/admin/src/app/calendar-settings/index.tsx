
'use client';
import { useState } from 'react';

export default function CalendarSettingsPage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleGoogleConnect = async () => {
    setLoading(true);
    setError(null);
    setSuccess(null);
    try {
      // In a real application, this would redirect to Google's OAuth consent screen
      // and then handle the callback to save tokens.
      console.log('Initiating Google Calendar connection...');
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1500));
      setSuccess('Successfully connected to Google Calendar (simulated).');
    } catch (err: any) {
      setError(err.message || 'Failed to connect to Google Calendar.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Calendar Synchronization Settings</h1>
      <p className="mb-4">Connect your external calendars to automatically manage your availability on Mounasabet.</p>

      <div className="border p-4 rounded-md shadow-sm">
        <h2 className="text-xl font-semibold mb-2">Google Calendar</h2>
        <p className="mb-4">Sync your Google Calendar to automatically block out times when you are unavailable.</p>
        <button
          onClick={handleGoogleConnect}
          disabled={loading}
          className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          {loading ? 'Connecting...' : 'Connect Google Calendar'}
        </button>
        {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
        {success && <p className="text-green-500 text-sm mt-2">{success}</p>}
      </div>

      {/* Add sections for other calendar providers like Outlook if needed */}
    </div>
  );
}
