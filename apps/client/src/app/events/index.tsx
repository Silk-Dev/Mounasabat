import { useEffect, useState } from "react";

import Link from "next/link";

interface Event {
  id: string;
  name: string;
  description?: string;
  type: string;
  status: string;
  startDate?: string;
  endDate?: string;
}

export default function EventsList() {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchEvents() {
      try {
        const response = await fetch("/api/events");
        if (!response.ok) {
          throw new Error(`Error: ${response.status} ${response.statusText}`);
        }
        const data = await response.json();
        setEvents(data);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    fetchEvents();
  }, []);

  if (loading) return <p>Loading events...</p>;
  if (error) return <p>Error: {error}</p>;

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">All Events</h1>
      {events.length === 0 ? (
        <p>No events found.</p>
      ) : (
        <ul>
          {events.map((event) => (
            <li key={event.id} className="mb-2 p-4 border rounded shadow-xs">
              <Link href={`/events/${event.id}`}>
                <h2 className="text-xl font-semibold text-blue-600 hover:underline">
                  {event.name}
                </h2>
              </Link>
              <p>{event.description}</p>
              <p>Type: {event.type}</p>
              <p>Status: {event.status}</p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
