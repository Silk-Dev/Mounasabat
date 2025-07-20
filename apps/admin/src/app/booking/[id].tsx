
'use client';
import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { Booking, BookingStatus, Prisma } from '@mounasabet/database/src/generated/client'; 

export default function AdminBookingDetailsPage() {
  const params = useParams();
  const id = params.id as string;
  const [booking, setBooking] = useState<Booking | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState('');

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
          setStatus(data.status);
        } catch (err: any) {
          setError(err.message);
        } finally {
          setLoading(false);
        }
      };

      fetchBooking();
    }
  }, [id]);

  const handleStatusUpdate = async (newStatus: BookingStatus) => {
    try {
      const response = await fetch(`/api/booking/${id}`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ status: newStatus }),
        }
      );

      if (!response.ok) {
        throw new Error('Failed to update booking status');
      }

      const updatedBooking = await response.json();
      setBooking(updatedBooking);
    } catch (err: any) {
      setError(err.message);
    }
  };

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
      <h1 className="text-3xl font-bold mb-4">{booking?.event?.name}</h1>
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
          <h2 className="text-xl font-semibold">User Information</h2>
          <p><strong>Name:</strong> {booking.user.name}</p>
          <p><strong>Email:</strong> {booking.user.email}</p>
        </div>
        <div>
          <h2 className="text-xl font-semibold">Update Status</h2>
          <div className="flex space-x-4 mt-2">
            {booking.status === 'pending' && (
              <>
                <button
                  onClick={() => handleStatusUpdate('confirmed')}
                  className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                >
                  Accept Booking
                </button>
                <button
                  onClick={() => handleStatusUpdate('cancelled')}
                  className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                >
                  Decline Booking
                </button>
              </>
            )}
            {booking.status === 'confirmed' && (
              <button
                onClick={() => handleStatusUpdate('delivered')}
                className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
              >
                Mark as Delivered
              </button>
            )}
            {booking.status !== 'pending' && (
              <form onSubmit={(e) => {
                e.preventDefault();
                handleStatusUpdate(status);
              }} className="flex items-center space-x-4">
                <select value={status} onChange={(e) => setStatus(e.target.value)} className="mt-1 block w-full border border-gray-300 rounded-md shadow-xs py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm">
                  <option value="pending">Pending</option>
                  <option value="confirmed">Confirmed</option>
                  <option value="cancelled">Cancelled</option>
                  <option value="paid">Paid</option>
                  <option value="delivered">Delivered</option>
                </select>
                <button type="submit" className="inline-flex justify-center py-2 px-4 border border-transparent shadow-xs text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
                  Update
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
