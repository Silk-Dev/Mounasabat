import { Event } from "@mounasabet/database/src/generated/client";

export function getUpcomingEvents(events: Event[]): Event[] {
  const now = new Date();
  return events.filter((event) => (event?.startDate || now) > now);
}
