import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

const prisma = new PrismaClient();

export async function GET() {
  try {
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

    const providers = await prisma.provider.findMany({
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
            createdAt: true,
          },
        },
        _count: {
          select: { services: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(providers);
  } catch (error) {
    console.error('Error fetching providers:', error);
    return NextResponse.json(
      { error: 'Failed to fetch providers' },
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

    // Check if user is admin
    const admin = await prisma.admin.findFirst({
      where: { user: { email: session.user.email } },
    });

    if (!admin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const data = await request.json();
    
    // Update provider status
    const updatedProvider = await prisma.provider.update({
      where: { id: data.providerId },
      data: { status: data.status },
      include: {
        user: {
          select: { email: true, name: true }
        }
      }
    });

    // TODO: Send notification to provider about status update

    return NextResponse.json(updatedProvider);
  } catch (error) {
    console.error('Error updating provider status:', error);
    return NextResponse.json(
      { error: 'Failed to update provider status' },
      { status: 500 }
    );
  }
}
