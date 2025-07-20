
'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';

interface Booking {
  id: string;
  event: {
    name: string;
  };
  startTime: string;
  endTime: string;
  status: string;
}

export default function BookingsPage() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const userId = 'clerk_user_id'; // Replace with actual user ID from authentication

  useEffect(() => {
    const fetchBookings = async () => {
      try {
        const response = await fetch(`/api/booking?userId=${userId}`);
        if (!response.ok) {
          throw new Error('Failed to fetch bookings');
        }
        const data = await response.json();
        setBookings(data);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchBookings();
  }, [userId]);

  if (loading) {
    return <div>Loading...</div>;
  }

  if (error) {
    return <div>Error: {error}</div>;
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">My Bookings</h1>
        <Link href="/booking/create" className="inline-flex justify-center py-2 px-4 border border-transparent shadow-xs text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
          Create Booking
        </Link>
      </div>
      {bookings.length === 0 ? (
        <p>You have no bookings.</p>
      ) : (
        <ul className="space-y-4">
          {bookings.map((booking) => (
            <li key={booking.id} className="p-4 border border-gray-200 rounded-md">
              <h2 className="text-xl font-semibold">{booking.event.name}</h2>
              <p>Status: {booking.status}</p>
              <p>From: {new Date(booking.startTime).toLocaleString()}</p>
              <p>To: {new Date(booking.endTime).toLocaleString()}</p>
              <Link href={`/booking/${booking.id}`} className="text-indigo-600 hover:underline">
                View Details
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
