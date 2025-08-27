import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

const prisma = new PrismaClient();

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const providerId = searchParams.get('providerId');
    
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is admin
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: { admin: true }
    });

    if (!user?.admin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const where: any = {};
    if (status) where.status = status;
    if (providerId) where.providerId = providerId;

    const services = await prisma.service.findMany({
      where,
      include: {
        provider: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(services);
  } catch (error) {
    console.error('Error fetching services:', error);
    return NextResponse.json(
      { error: 'Failed to fetch services' },
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

    // Check if user is admin
    const admin = await prisma.admin.findFirst({
      where: { user: { email: session.user.email } },
    });

    if (!admin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { serviceId, status, rejectionReason } = await request.json();
    
    // Update service status
    const updatedService = await prisma.service.update({
      where: { id: serviceId },
      data: { 
        status,
        ...(status === 'REJECTED' && { rejectionReason })
      },
      include: {
        provider: {
          include: {
            user: {
              select: { email: true, name: true }
            }
          }
        }
      }
    });

    // TODO: Send notification to provider about service status update

    return NextResponse.json(updatedService);
  } catch (error) {
    console.error('Error updating service status:', error);
    return NextResponse.json(
      { error: 'Failed to update service status' },
      { status: 500 }
    );
  }
}
