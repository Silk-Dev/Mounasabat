import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function createEvent(data: any) {
  if (!data.name || typeof data.name !== "string") {
    throw new Error("Event name is required and must be a string.");
  }
  if (!data.type || typeof data.type !== "string") {
    throw new Error("Event type is required and must be a string.");
  }
  // Implement event creation logic
  return prisma.event.create({ data });
}

export async function getEvent(id: string) {
  // Implement logic to get a single event by ID
  return prisma.event.findUnique({ where: { id } });
}

export async function getEvents() {
  // Implement logic to get all events
  return prisma.event.findMany();
}

export async function updateEvent(id: string, data: any) {
  // Implement event update logic
  return prisma.event.update({ where: { id }, data });
}

export async function deleteEvent(id: string) {
  // Implement event deletion logic
  return prisma.event.delete({ where: { id } });
}
