import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@mounasabet/database';

const timeSlotSchema = z.object({
  id: z.string(),
  startTime: z.string(),
  endTime: z.string(),
  isAvailable: z.boolean(),
});

const dayAvailabilitySchema = z.object({
  dayOfWeek: z.number().min(0).max(6),
  dayName: z.string(),
  isEnabled: z.boolean(),
  timeSlots: z.array(timeSlotSchema),
});

const specialDateSchema = z.object({
  id: z.string(),
  date: z.string(),
  isAvailable: z.boolean(),
  reason: z.string().optional(),
  timeSlots: z.array(timeSlotSchema).optional(),
});

const availabilitySchema = z.object({
  weeklySchedule: z.array(dayAvailabilitySchema),
  specialDates: z.array(specialDateSchema),
});

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const providerId = searchParams.get('providerId');

    if (!providerId) {
      return NextResponse.json(
        { success: false, error: 'Provider ID is required' },
        { status: 400 }
      );
    }

    // For now, return mock data since we don't have availability tables in the schema
    // In a real implementation, you would fetch from a provider_availability table
    const mockAvailability = {
      weeklySchedule: [
        {
          dayOfWeek: 0,
          dayName: 'Sunday',
          isEnabled: false,
          timeSlots: []
        },
        {
          dayOfWeek: 1,
          dayName: 'Monday',
          isEnabled: true,
          timeSlots: [
            {
              id: '1-morning',
              startTime: '09:00',
              endTime: '12:00',
              isAvailable: true
            },
            {
              id: '1-afternoon',
              startTime: '14:00',
              endTime: '18:00',
              isAvailable: true
            }
          ]
        },
        {
          dayOfWeek: 2,
          dayName: 'Tuesday',
          isEnabled: true,
          timeSlots: [
            {
              id: '2-morning',
              startTime: '09:00',
              endTime: '12:00',
              isAvailable: true
            },
            {
              id: '2-afternoon',
              startTime: '14:00',
              endTime: '18:00',
              isAvailable: true
            }
          ]
        },
        {
          dayOfWeek: 3,
          dayName: 'Wednesday',
          isEnabled: true,
          timeSlots: [
            {
              id: '3-morning',
              startTime: '09:00',
              endTime: '12:00',
              isAvailable: true
            },
            {
              id: '3-afternoon',
              startTime: '14:00',
              endTime: '18:00',
              isAvailable: true
            }
          ]
        },
        {
          dayOfWeek: 4,
          dayName: 'Thursday',
          isEnabled: true,
          timeSlots: [
            {
              id: '4-morning',
              startTime: '09:00',
              endTime: '12:00',
              isAvailable: true
            },
            {
              id: '4-afternoon',
              startTime: '14:00',
              endTime: '18:00',
              isAvailable: true
            }
          ]
        },
        {
          dayOfWeek: 5,
          dayName: 'Friday',
          isEnabled: true,
          timeSlots: [
            {
              id: '5-morning',
              startTime: '09:00',
              endTime: '12:00',
              isAvailable: true
            },
            {
              id: '5-afternoon',
              startTime: '14:00',
              endTime: '18:00',
              isAvailable: true
            }
          ]
        },
        {
          dayOfWeek: 6,
          dayName: 'Saturday',
          isEnabled: false,
          timeSlots: []
        }
      ],
      specialDates: []
    };

    return NextResponse.json({
      success: true,
      ...mockAvailability
    });

  } catch (error) {
    console.error('Error fetching availability:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to fetch availability' 
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const providerId = searchParams.get('providerId');

    if (!providerId) {
      return NextResponse.json(
        { success: false, error: 'Provider ID is required' },
        { status: 400 }
      );
    }

    const body = await request.json();
    const validatedData = availabilitySchema.parse(body);

    // Verify provider exists
    const provider = await prisma.provider.findUnique({
      where: { id: providerId }
    });

    if (!provider) {
      return NextResponse.json(
        { success: false, error: 'Provider not found' },
        { status: 404 }
      );
    }

    // In a real implementation, you would save to a provider_availability table
    // For now, we'll just return success
    console.log('Saving availability for provider:', providerId, validatedData);

    return NextResponse.json({
      success: true,
      message: 'Availability updated successfully'
    });

  } catch (error) {
    console.error('Error saving availability:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { 
          success: false,
          error: 'Invalid availability data', 
          details: error.errors 
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to save availability' 
      },
      { status: 500 }
    );
  }
}