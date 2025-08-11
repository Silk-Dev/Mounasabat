import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@mounasabet/database';
import { getSession } from '@/lib/auth';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession(request);

    if (!session?.user || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const provider = await prisma.provider.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            phoneNumber: true,
            address: true,
            createdAt: true,
            banned: true,
            banReason: true,
            banExpires: true,
          },
        },
        serviceOfferings: {
          include: {
            reviews: {
              select: {
                rating: true,
                comment: true,
                user: {
                  select: {
                    name: true,
                  },
                },
                createdAt: true,
              },
            },
          },
        },
        reviews: {
          include: {
            user: {
              select: {
                name: true,
              },
            },
          },
          orderBy: { createdAt: 'desc' },
        },
        packages: true,
        _count: {
          select: {
            serviceOfferings: true,
            reviews: true,
          },
        },
      },
    });

    if (!provider) {
      return NextResponse.json({ error: 'Provider not found' }, { status: 404 });
    }

    return NextResponse.json({ provider });
  } catch (error) {
    console.error('Error fetching provider:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession(request);

    if (!session?.user || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { isVerified, banUser, banReason, banExpires } = body;

    // Update provider verification status
    const updateData: any = {};
    if (typeof isVerified === 'boolean') {
      updateData.isVerified = isVerified;
    }

    const { id } = await params;
    const provider = await prisma.provider.update({
      where: { id },
      data: updateData,
      include: {
        user: true,
      },
    });

    // Update user ban status if provided
    if (typeof banUser === 'boolean') {
      await prisma.user.update({
        where: { id: provider.userId },
        data: {
          banned: banUser,
          banReason: banUser ? banReason : null,
          banExpires: banUser && banExpires ? new Date(banExpires) : null,
        },
      });
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Provider updated successfully' 
    });
  } catch (error) {
    console.error('Error updating provider:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}