"use client";

import { Button } from "@weddni/ui";
import { Event, Pricing, User } from "@weddni/database/types";
import { formatCurrency, formatDate } from "@weddni/utils";
import { calculateTotalPrice } from "@weddni/pricing";
import { getUpcomingEvents } from "@weddni/events";
import { useAuth } from "better-auth/react";
import { redirect } from "next/navigation";
import { useEffect } from "react";

export default function Home() {
  const { user, isLoading } = useAuth();

  useEffect(() => {
    if (!isLoading && !user) {
      redirect("/signin");
    }
  }, [user, isLoading]);

  if (isLoading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        Loading...
      </div>
    );
  }

  // Dummy data for demonstration
  const dummyUser: User = {
    id: user.id,
    email: user.email,
    name: user.name || "John Doe",
  };

  const dummyEvents: Event[] = [
    {
      id: "e1",
      name: "Wedding Expo",
      date: new Date("2025-08-15"),
      location: "Convention Center",
    },
    {
      id: "e2",
      name: "Bridal Show",
      date: new Date("2025-07-01"),
      location: "Hotel Ballroom",
    },
  ];

  const dummyPricing: Pricing[] = [
    { id: "p1", name: "Photography Package", price: 1500, currency: "USD" },
    { id: "p2", name: "Catering per person", price: 75, currency: "USD" },
  ];

  const formattedPrice = formatCurrency(
    calculateTotalPrice(dummyPricing),
    "USD",
  );
  const upcomingEvents = getUpcomingEvents(dummyEvents);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center py-2">
      <main className="flex flex-col items-center justify-center flex-1 px-20 text-center">
        <h1 className="text-6xl font-bold mb-8">
          Welcome to the <span className="text-blue-600">Weddni</span> Client
          Application!
        </h1>
        <Button className="mt-4">Click Me</Button>

        <div className="mt-8 text-left">
          <h2 className="text-2xl font-semibold">
            Core Package Integration Test:
          </h2>
          <p>User Email: {dummyUser.email}</p>
          <p>Total Pricing: {formattedPrice}</p>
          <p>Upcoming Events:</p>
          <ul>
            {upcomingEvents.map((event) => (
              <li key={event.id}>
                {event.name} on {formatDate(event.date)} at {event.location}
              </li>
            ))}
          </ul>
        </div>
      </main>
    </div>
  );
}
