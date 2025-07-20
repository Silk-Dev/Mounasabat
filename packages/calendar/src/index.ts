
export interface CalendarProvider {
  getAvailability(providerId: string, start: Date, end: Date): Promise<any[]>;
  createEvent(providerId: string, event: any): Promise<any>;
  updateEvent(providerId: string, eventId: string, event: any): Promise<any>;
  deleteEvent(providerId: string, eventId: string): Promise<void>;
}

export * from './google';

export class CalendarService {
  private provider: CalendarProvider;

  constructor(provider: CalendarProvider) {
    this.provider = provider;
  }

  async getAvailability(providerId: string, start: Date, end: Date) {
    return this.provider.getAvailability(providerId, start, end);
  }

  async createEvent(providerId: string, event: any) {
    return this.provider.createEvent(providerId, event);
  }

  async updateEvent(providerId: string, eventId: string, event: any) {
    return this.provider.updateEvent(providerId, eventId, event);
  }

  async deleteEvent(providerId: string, eventId: string) {
    return this.provider.deleteEvent(providerId, eventId);
  }
}
