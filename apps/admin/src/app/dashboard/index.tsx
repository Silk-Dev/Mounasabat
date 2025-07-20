
'use client';
import { useState, useEffect } from 'react';

interface Booking {
  id: string;
  event: {
    name: string;
  };
  user: {
    name: string;
  };
  status: string;
  paymentStatus: string;
  startTime: string;
}

export default function AdminDashboardPage() {
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

  const totalBookings = bookings.length;
  const confirmedBookings = bookings.filter(b => b.status === 'confirmed').length;
  const pendingBookings = bookings.filter(b => b.status === 'pending').length;
  const paidBookings = bookings.filter(b => b.paymentStatus === 'paid').length;
  const deliveredBookings = bookings.filter(b => b.status === 'delivered').length;

  if (loading) {
    return <div>Loading dashboard...</div>;
  }

  if (error) {
    return <div>Error: {error}</div>;
  }

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Admin Dashboard</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
        <div className="p-4 border border-gray-200 rounded-md shadow-sm">
          <h2 className="text-xl font-semibold">Total Bookings</h2>
          <p className="text-3xl font-bold">{totalBookings}</p>
        </div>
        <div className="p-4 border border-gray-200 rounded-md shadow-sm">
          <h2 className="text-xl font-semibold">Confirmed Bookings</h2>
          <p className="text-3xl font-bold">{confirmedBookings}</p>
        </div>
        <div className="p-4 border border-gray-200 rounded-md shadow-sm">
          <h2 className="text-xl font-semibold">Pending Bookings</h2>
          <p className="text-3xl font-bold">{pendingBookings}</p>
        </div>
        <div className="p-4 border border-gray-200 rounded-md shadow-sm">
          <h2 className="text-xl font-semibold">Paid Bookings</h2>
          <p className="text-3xl font-bold">{paidBookings}</p>
        </div>
        <div className="p-4 border border-gray-200 rounded-md shadow-sm">
          <h2 className="text-xl font-semibold">Delivered Services</h2>
          <p className="text-3xl font-bold">{deliveredBookings}</p>
        </div>
      </div>

      <h2 className="text-xl font-bold mb-4">Recent Bookings</h2>
      {bookings.length === 0 ? (
        <p>No recent bookings.</p>
      ) : (
        <ul className="space-y-4">
          {bookings.slice(0, 5).map((booking) => (
            <li key={booking.id} className="p-4 border border-gray-200 rounded-md">
              <h3 className="text-lg font-semibold">{booking.event.name}</h3>
              <p>User: {booking.user.name}</p>
              <p>Status: {booking.status} / Payment: {booking.paymentStatus}</p>
              <p>Time: {new Date(booking.startTime).toLocaleString()}</p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
