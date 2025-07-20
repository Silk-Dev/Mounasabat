
'use client';
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Elements } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';
import CheckoutForm from '../../components/CheckoutForm';

interface Event {
  id: string;
  name: string;
}

interface Provider {
  id: string;
  name: string;
}

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY as string);

export default function CreateBooking() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [eventId, setEventId] = useState("");
  const [userId, setUserId] = useState("clerk_user_id"); // Placeholder for actual user ID
  const [providerId, setProviderId] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [bookingId, setBookingId] = useState<string | null>(null);
  const [clientSecret, setClientSecret] = useState<string | null>(null);

  const [events, setEvents] = useState<Event[]>([]);
  const [providers, setProviders] = useState<Provider[]>([]);
  const [availableSlots, setAvailableSlots] = useState<any[]>([]);

  useEffect(() => {
    // Fetch events
    const fetchEvents = async () => {
      try {
        const response = await fetch("/api/events");
        if (!response.ok) {
          throw new Error("Failed to fetch events");
        }
        const data = await response.json();
        setEvents(data);
      } catch (err: any) {
        console.error("Error fetching events:", err);
        setError(err.message);
      }
    };

    // Fetch providers
    const fetchProviders = async () => {
      try {
        const response = await fetch("/api/provider");
        if (!response.ok) {
          throw new Error("Failed to fetch providers");
        }
        const data = await response.json();
        setProviders(data);
      } catch (err: any) {
        console.error("Error fetching providers:", err);
        setError(err.message);
      }
    };

    fetchEvents();
    fetchProviders();
  }, []);

  const handleNext = () => {
    setError(null);
    if (step === 1 && !eventId) {
      setError("Please select an event.");
      return;
    }
    if (step === 2 && (!providerId || !startTime || !endTime)) {
      setError("Please select a provider and time slot.");
      return;
    }
    setStep(step + 1);
  };

  const handleBack = () => {
    setError(null);
    setStep(step - 1);
  };

  const handleCheckAvailability = async () => {
    setError(null);
    if (!providerId || !startTime || !endTime) {
      setError("Please select a provider, start time, and end time to check availability.");
      return;
    }
    try {
      const response = await fetch(`/api/calendar?providerId=${providerId}&start=${new Date(startTime).toISOString()}&end=${new Date(endTime).toISOString()}`);
      if (!response.ok) {
        throw new Error("Failed to fetch availability");
      }
      const data = await response.json();
      setAvailableSlots(data.availability);
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleBookingConfirmation = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    const bookingData = {
      eventId,
      userId,
      providerId,
      startTime: new Date(startTime).toISOString(),
      endTime: new Date(endTime).toISOString(),
    };

    try {
      const response = await fetch("/api/booking", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(bookingData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to create booking");
      }

      const newBooking = await response.json();
      setBookingId(newBooking.id);

      // For now, a fixed amount for testing. In a real app, this would be dynamic.
      const amount = 100; 

      const stripeResponse = await fetch('/api/stripe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount }),
      });
      const { clientSecret: newClientSecret } = await stripeResponse.json();
      setClientSecret(newClientSecret);

      setStep(4); // Move to payment step

    } catch (err: any) {
      setError(err.message || "An unexpected error occurred.");
    }
  };

  const handlePaymentSuccess = () => {
    setSuccess("Booking and payment successful!");
    setEventId("");
    setProviderId("");
    setStartTime("");
    setEndTime("");
    setBookingId(null);
    setClientSecret(null);
    router.push("/booking");
  };

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Create New Booking - Step {step} of 4</h1>
      {error && <p className="text-red-500 text-sm mb-4">{error}</p>}
      {success && <p className="text-green-500 text-sm mb-4">{success}</p>}

      {step === 1 && (
        <div className="space-y-4">
          <div>
            <label htmlFor="eventId" className="block text-sm font-medium text-gray-700">Select Event</label>
            <select
              id="eventId"
              value={eventId}
              onChange={(e) => setEventId(e.target.value)}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-xs py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            >
              <option value="">-- Select an Event --</option>
              {events.map((event) => (
                <option key={event.id} value={event.id}>{event.name}</option>
              ))}
            </select>
          </div>
          <button onClick={handleNext} className="inline-flex justify-center py-2 px-4 border border-transparent shadow-xs text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
            Next
          </button>
        </div>
      )}

      {step === 2 && (
        <div className="space-y-4">
          <div>
            <label htmlFor="providerId" className="block text-sm font-medium text-gray-700">Select Provider</label>
            <select
              id="providerId"
              value={providerId}
              onChange={(e) => setProviderId(e.target.value)}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-xs py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            >
              <option value="">-- Select a Provider --</option>
              {providers.map((provider) => (
                <option key={provider.id} value={provider.id}>{provider.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="startTime" className="block text-sm font-medium text-gray-700">Start Time</label>
            <input type="datetime-local" id="startTime" value={startTime} onChange={(e) => setStartTime(e.target.value)} className="mt-1 block w-full border border-gray-300 rounded-md shadow-xs py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" />
          </div>
          <div>
            <label htmlFor="endTime" className="block text-sm font-medium text-gray-700">End Time</label>
            <input type="datetime-local" id="endTime" value={endTime} onChange={(e) => setEndTime(e.target.value)} className="mt-1 block w-full border border-gray-300 rounded-md shadow-xs py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" />
          </div>
          <button onClick={handleCheckAvailability} className="inline-flex justify-center py-2 px-4 border border-transparent shadow-xs text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
            Check Availability
          </button>
          {availableSlots.length > 0 && (
            <div className="mt-4">
              <h3 className="text-lg font-semibold">Available Slots:</h3>
              <ul className="list-disc list-inside">
                {availableSlots.map((slot, index) => (
                  <li key={index}>{new Date(slot.start).toLocaleString()} - {new Date(slot.end).toLocaleString()}</li>
                ))}
              </ul>
            </div>
          )}
          <div className="flex space-x-4">
            <button onClick={handleBack} className="inline-flex justify-center py-2 px-4 border border-gray-300 shadow-xs text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
              Back
            </button>
            <button onClick={handleNext} className="inline-flex justify-center py-2 px-4 border border-transparent shadow-xs text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
              Next
            </button>
          </div>
        </div>
      )}

      {step === 3 && (
        <form onSubmit={handleBookingConfirmation} className="space-y-4">
          <p>Review your booking details:</p>
          <p><strong>Event:</strong> {events.find(e => e.id === eventId)?.name}</p>
          <p><strong>Provider:</strong> {providers.find(p => p.id === providerId)?.name}</p>
          <p><strong>Start Time:</strong> {new Date(startTime).toLocaleString()}</p>
          <p><strong>End Time:</strong> {new Date(endTime).toLocaleString()}</p>

          <div className="flex space-x-4">
            <button onClick={handleBack} className="inline-flex justify-center py-2 px-4 border border-gray-300 shadow-xs text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
              Back
            </button>
            <button type="submit" className="inline-flex justify-center py-2 px-4 border border-transparent shadow-xs text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
              Confirm Booking & Proceed to Payment
            </button>
          </div>
        </form>
      )}

      {step === 4 && clientSecret && bookingId && (
        <Elements stripe={stripePromise} options={{ clientSecret }}>
          <CheckoutForm bookingId={bookingId} onPaymentSuccess={handlePaymentSuccess} />
        </Elements>
      )}
    </div>
  );
}
