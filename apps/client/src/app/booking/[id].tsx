
'use client';
import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';

interface Booking {
  id: string;
  event: {
    name: string;
    description: string;
  };
  user: {
    name: string;
    email: string;
  };
  startTime: string;
  endTime: string;
  status: string;
}

export default function BookingDetailsPage() {
  const params = useParams();
  const id = params.id as string;
  const [booking, setBooking] = useState<Booking | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (id) {
      const fetchBooking = async () => {
        try {
          const response = await fetch(`/api/booking/${id}`);
          if (!response.ok) {
            throw new Error('Failed to fetch booking');
          }
          const data = await response.json();
          setBooking(data);
        } catch (err: any) {
          setError(err.message);
        } finally {
          setLoading(false);
        }
      };

      fetchBooking();
    }
  }, [id]);

  if (loading) {
    return <div>Loading...</div>;
  }

  if (error) {
    return <div>Error: {error}</div>;
  }

  if (!booking) {
    return <div>Booking not found.</div>;
  }

  return (
    <div>
      <Link href="/booking" className="text-indigo-600 hover:underline mb-4 block">
        &larr; Back to Bookings
      </Link>
      <h1 className="text-3xl font-bold mb-4">{booking.event.name}</h1>
      <div className="space-y-4">
        <div>
          <h2 className="text-xl font-semibold">Event Details</h2>
          <p>{booking.event.description}</p>
        </div>
        <div>
          <h2 className="text-xl font-semibold">Booking Information</h2>
          <p><strong>Status:</strong> {booking.status}</p>
          <p><strong>From:</strong> {new Date(booking.startTime).toLocaleString()}</p>
          <p><strong>To:</strong> {new Date(booking.endTime).toLocaleString()}</p>
        </div>
        <div>
          <h2 className="text-xl font-semibold">Your Information</h2>
          <p><strong>Name:</strong> {booking.user.name}</p>
          <p><strong>Email:</strong> {booking.user.email}</p>
        </div>
      </div>
    </div>
  );
}
