import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

const prisma = new PrismaClient();

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get the provider
    const provider = await prisma.provider.findFirst({
      where: { user: { email: session.user.email } },
    });

    if (!provider) {
      return NextResponse.json({ error: 'Provider not found' }, { status: 404 });
    }

    const where: any = { providerId: provider.id };
    if (status) where.status = status;

    const services = await prisma.service.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(services);
  } catch (error) {
    console.error('Error fetching provider services:', error);
    return NextResponse.json(
      { error: 'Failed to fetch services' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get the provider
    const provider = await prisma.provider.findFirst({
      where: { user: { email: session.user.email } },
    });

    if (!provider) {
      return NextResponse.json({ error: 'Provider not found' }, { status: 404 });
    }

    if (provider.status !== 'ACTIVE') {
      return NextResponse.json(
        { error: 'Your account is not active' },
        { status: 403 }
      );
    }

    const data = await request.json();
    
    // Create new service
    const newService = await prisma.service.create({
      data: {
        ...data,
        providerId: provider.id,
        status: 'PENDING', // All new services require admin approval
      },
    });

    // TODO: Send notification to admin about new service

    return NextResponse.json(newService, { status: 201 });
  } catch (error) {
    console.error('Error creating service:', error);
    return NextResponse.json(
      { error: 'Failed to create service' },
      { status: 500 }
    );
  }
}

export async function PATCH(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get the provider
    const provider = await prisma.provider.findFirst({
      where: { user: { email: session.user.email } },
    });

    if (!provider) {
      return NextResponse.json({ error: 'Provider not found' }, { status: 404 });
    }

    const { serviceId, ...updateData } = await request.json();
    
    // Update service
    const updatedService = await prisma.service.update({
      where: { 
        id: serviceId,
        providerId: provider.id, // Ensure the service belongs to this provider
      },
      data: {
        ...updateData,
        status: 'PENDING', // Set back to pending for admin review
      },
    });

    return NextResponse.json(updatedService);
  } catch (error) {
    console.error('Error updating service:', error);
    return NextResponse.json(
      { error: 'Failed to update service' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get the provider
    const provider = await prisma.provider.findFirst({
      where: { user: { email: session.user.email } },
    });

    if (!provider) {
      return NextResponse.json({ error: 'Provider not found' }, { status: 404 });
    }

    const { searchParams } = new URL(request.url);
    const serviceId = searchParams.get('id');

    if (!serviceId) {
      return NextResponse.json(
        { error: 'Service ID is required' },
        { status: 400 }
      );
    }

    // Delete service
    await prisma.service.delete({
      where: { 
        id: serviceId,
        providerId: provider.id, // Ensure the service belongs to this provider
      },
    });

    return new Response(null, { status: 204 });
  } catch (error) {
    console.error('Error deleting service:', error);
    return NextResponse.json(
      { error: 'Failed to delete service' },
      { status: 500 }
    );
  }
}
