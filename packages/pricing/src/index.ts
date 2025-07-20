import {prisma} from '@mounasabet/database/src/prisma';

export async function createBooking(data: any) {
  // Placeholder for booking creation logic
  console.log("Creating booking with data:", data);
  return { id: "mock-booking-id", ...data };
}

export async function getBooking(id: string) {
  // Placeholder for getting a single booking by ID
  console.log("Getting booking with ID:", id);
  return { id, eventId: "mock-event-id", userId: "mock-user-id" };
}

export async function getPricingPlans() {
  // Placeholder for getting pricing plans
  console.log("Getting pricing plans");
  return [{ id: "basic", name: "Basic Plan", price: 100 }];
}

export function calculateTotalPrice(items: Pricing[]): number {
  return items.reduce((total, item) => total + item.price, 0);
}
