
import { NextRequest, NextResponse } from 'next/server';
import { CalendarService, GoogleCalendarProvider } from '@mounasabet/calendar';

const calendarService = new CalendarService(new GoogleCalendarProvider());

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const providerId = searchParams.get('providerId');
  const start = searchParams.get('start');
  const end = searchParams.get('end');

  if (!providerId || !start || !end) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
  }

  try {
    const availability = await calendarService.getAvailability(providerId, new Date(start), new Date(end));
    return NextResponse.json({ availability });
  } catch (error) {
    console.error('Error in calendar API GET:', error);
    return NextResponse.json({ error: 'Failed to fetch availability' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const { providerId, event } = await req.json();

  if (!providerId || !event) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
  }

  try {
    const newEvent = await calendarService.createEvent(providerId, event);
    return NextResponse.json({ event: newEvent });
  } catch (error) {
    console.error('Error in calendar API POST:', error);
    return NextResponse.json({ error: 'Failed to create event' }, { status: 500 });
  }
}
