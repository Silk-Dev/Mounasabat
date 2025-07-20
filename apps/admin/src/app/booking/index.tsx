
'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';

interface Booking {
  id: string;
  event: {
    name: string;
  };
  user: {
    name: string;
  };
  startTime: string;
  endTime: string;
  status: string;
}

export default function AdminBookingsPage() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchBookings = async () => {
      try {
        const response = await fetch('/api/booking');
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
  }, []);

  if (loading) {
    return <div>Loading...</div>;
  }

  if (error) {
    return <div>Error: {error}</div>;
  }

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">All Bookings</h1>
      {bookings.length === 0 ? (
        <p>There are no bookings.</p>
      ) : (
        <ul className="space-y-4">
          {bookings.map((booking) => (
            <li key={booking.id} className="p-4 border border-gray-200 rounded-md">
              <h2 className="text-xl font-semibold">{booking.event.name}</h2>
              <p>User: {booking.user.name}</p>
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
