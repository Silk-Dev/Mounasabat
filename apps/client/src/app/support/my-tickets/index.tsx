
'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';

interface Issue {
  id: string;
  title: string;
  description?: string;
  status: string;
  priority: string;
  createdAt: string;
}

export default function MyTicketsPage() {
  const [tickets, setTickets] = useState<Issue[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Placeholder for the actual user ID
  const userId = 'clerk_user_id'; 

  useEffect(() => {
    const fetchTickets = async () => {
      try {
        const response = await fetch(`/api/issue?reportedByUserId=${userId}`);
        if (!response.ok) {
          throw new Error('Failed to fetch tickets');
        }
        const data = await response.json();
        setTickets(data);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    if (userId) {
      fetchTickets();
    }
  }, [userId]);

  if (loading) {
    return <div>Loading tickets...</div>;
  }

  if (error) {
    return <div>Error: {error}</div>;
  }

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">My Support Tickets</h1>
      <Link href="/support/create" className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 mb-4">
        Create New Ticket
      </Link>
      {tickets.length === 0 ? (
        <p>You have not submitted any tickets.</p>
      ) : (
        <ul className="space-y-4">
          {tickets.map((ticket) => (
            <li key={ticket.id} className="p-4 border border-gray-200 rounded-md">
              <h2 className="text-xl font-semibold">{ticket.title}</h2>
              <p>Status: {ticket.status} | Priority: {ticket.priority}</p>
              <p>Submitted: {new Date(ticket.createdAt).toLocaleString()}</p>
              <Link href={`/support/my-tickets/${ticket.id}`} className="text-indigo-600 hover:underline">
                View Details
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
