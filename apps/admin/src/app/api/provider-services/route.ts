
import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const providerId = searchParams.get('providerId');

  if (!providerId) {
    return NextResponse.json({ error: 'Provider ID is required' }, { status: 400 });
  }

  try {
    const provider = await prisma.provider.findUnique({
      where: { id: providerId },
      select: { services: true },
    });

    if (!provider) {
      return NextResponse.json({ error: 'Provider not found' }, { status: 404 });
    }

    return NextResponse.json(provider.services);
  } catch (error) {
    console.error('Error fetching provider services:', error);
    return NextResponse.json({ error: 'Failed to fetch services' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const { providerId, service } = await req.json();

  if (!providerId || !service) {
    return NextResponse.json({ error: 'Provider ID and service are required' }, { status: 400 });
  }

  try {
    const updatedProvider = await prisma.provider.update({
      where: { id: providerId },
      data: {
        services: { push: service },
      },
    });
    return NextResponse.json(updatedProvider.services);
  } catch (error) {
    console.error('Error adding service:', error);
    return NextResponse.json({ error: 'Failed to add service' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  const { providerId, oldService, newService } = await req.json();

  if (!providerId || !oldService || !newService) {
    return NextResponse.json({ error: 'Provider ID, old service, and new service are required' }, { status: 400 });
  }

  try {
    const provider = await prisma.provider.findUnique({
      where: { id: providerId },
      select: { services: true },
    });

    if (!provider) {
      return NextResponse.json({ error: 'Provider not found' }, { status: 404 });
    }

    const updatedServices = provider.services.map(s => s === oldService ? newService : s);

    const updatedProvider = await prisma.provider.update({
      where: { id: providerId },
      data: { services: updatedServices },
    });
    return NextResponse.json(updatedProvider.services);
  } catch (error) {
    console.error('Error updating service:', error);
    return NextResponse.json({ error: 'Failed to update service' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  const { providerId, service } = await req.json();

  if (!providerId || !service) {
    return NextResponse.json({ error: 'Provider ID and service are required' }, { status: 400 });
  }

  try {
    const provider = await prisma.provider.findUnique({
      where: { id: providerId },
      select: { services: true },
    });

    if (!provider) {
      return NextResponse.json({ error: 'Provider not found' }, { status: 404 });
    }

    const updatedServices = provider.services.filter(s => s !== service);

    const updatedProvider = await prisma.provider.update({
      where: { id: providerId },
      data: { services: updatedServices },
    });
    return NextResponse.json(updatedProvider.services);
  } catch (error) {
    console.error('Error deleting service:', error);
    return NextResponse.json({ error: 'Failed to delete service' }, { status: 500 });
  }
}
