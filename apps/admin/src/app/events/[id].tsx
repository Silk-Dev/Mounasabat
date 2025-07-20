import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Head from "next/head";
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

export default function AdminEventDetail() {
  const router = useRouter();
  const { id } = router.query;
  const [event, setEvent] = useState<Event | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (id) {
      async function fetchEvent() {
        try {
          const response = await fetch(`/api/events?id=${id}`);
          if (!response.ok) {
            throw new Error(`Error: ${response.status} ${response.statusText}`);
          }
          const data = await response.json();
          setEvent(data);
        } catch (err: any) {
          setError(err.message);
        } finally {
          setLoading(false);
        }
      }
      fetchEvent();
    }
  }, [id]);

  if (loading) return <p>Loading event details...</p>;
  if (error) return <p>Error: {error}</p>;
  if (!event) return <p>Event not found.</p>;

  return (
    <div>
      <Head>
        <title>{event.name} - Mounasabet Admin</title>
      </Head>
      <h1 className="text-2xl font-bold mb-4">{event.name}</h1>
      <p>
        <strong>Description:</strong> {event.description}
      </p>
      <p>
        <strong>Type:</strong> {event.type}
      </p>
      <p>
        <strong>Status:</strong> {event.status}
      </p>
      {event.startDate && (
        <p>
          <strong>Start Date:</strong>{" "}
          {new Date(event.startDate).toLocaleDateString()}
        </p>
      )}
      {event.endDate && (
        <p>
          <strong>End Date:</strong>{" "}
          {new Date(event.endDate).toLocaleDateString()}
        </p>
      )}
      <div className="mt-4">
        <Link href="/events" className="text-blue-600 hover:underline">
          Back to Events List
        </Link>
      </div>
    </div>
  );
}
