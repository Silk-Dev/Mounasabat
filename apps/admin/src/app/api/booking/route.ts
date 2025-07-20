
import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const providerId = searchParams.get('providerId');

  const where: any = {};
  if (providerId) {
    where.providerId = providerId;
  }

  try {
    const bookings = await prisma.booking.findMany({
      where,
      include: { event: true, user: true },
    });
    return NextResponse.json(bookings);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch bookings' }, { status: 500 });
  }
}
