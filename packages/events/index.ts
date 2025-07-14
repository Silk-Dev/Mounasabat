import { Event } from "@weddni/types";

export function getUpcomingEvents(events: Event[]): Event[] {
  const now = new Date();
  return events.filter((event) => event.date > now);
}
