
import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(req: NextRequest) {
  try {
    const providers = await prisma.provider.findMany({
      include: { user: true },
    });
    return NextResponse.json(providers);
  } catch (error) {
    console.error('Error fetching providers:', error);
    return NextResponse.json({ error: 'Failed to fetch providers' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { userId, name, description, contactEmail, phoneNumber, address, website, services } = await req.json();

    if (!userId || !name) {
      return NextResponse.json({ error: 'User ID and name are required' }, { status: 400 });
    }

    const newProvider = await prisma.provider.create({
      data: {
        userId,
        name,
        description,
        contactEmail,
        phoneNumber,
        address,
        website,
        services,
      },
    });

    return NextResponse.json(newProvider, { status: 201 });
  } catch (error) {
    console.error('Error creating provider:', error);
    return NextResponse.json({ error: 'Failed to create provider' }, { status: 500 });
  }
}
