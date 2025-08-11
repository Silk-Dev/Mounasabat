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
    const user = await prisma.user.findUnique({
      where: { id },
      include: {
        provider: {
          include: {
            serviceOfferings: true,
            reviews: true,
          },
        },
        bookings: {
          include: {
            event: true,
            service: true,
          },
          orderBy: { createdAt: 'desc' },
          take: 10,
        },
        orders: {
          include: {
            items: true,
          },
          orderBy: { createdAt: 'desc' },
          take: 10,
        },
        reviews: {
          include: {
            provider: {
              select: {
                name: true,
              },
            },
            service: {
              select: {
                name: true,
              },
            },
          },
          orderBy: { createdAt: 'desc' },
          take: 10,
        },
        reportedIssues: {
          orderBy: { createdAt: 'desc' },
          take: 5,
        },
        _count: {
          select: {
            bookings: true,
            orders: true,
            reviews: true,
            reportedIssues: true,
          },
        },
      },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Transform user data to match expected format
    const transformedUser = {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role as 'customer' | 'provider' | 'admin',
      isVerified: user.emailVerified,
      phoneNumber: user.phoneNumber,
      address: user.address,
      image: user.image,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
      // Additional data for admin view
      provider: user.provider,
      bookings: user.bookings,
      orders: user.orders,
      reviews: user.reviews,
      reportedIssues: user.reportedIssues,
      _count: user._count,
      banned: user.banned,
      banReason: user.banReason,
      banExpires: user.banExpires,
    };

    return NextResponse.json(transformedUser);
  } catch (error) {
    console.error('Error fetching user:', error);
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
    const { role, banned, banReason, banExpires, name, email, phoneNumber, address } = body;

    const updateData: any = {};
    
    // Admin-specific updates
    if (role && ['customer', 'provider', 'admin'].includes(role)) {
      updateData.role = role;
    }

    if (typeof banned === 'boolean') {
      updateData.banned = banned;
      updateData.banReason = banned ? banReason : null;
      updateData.banExpires = banned && banExpires ? new Date(banExpires) : null;
    }

    // Profile updates
    if (name) updateData.name = name;
    if (email) updateData.email = email;
    if (phoneNumber !== undefined) updateData.phoneNumber = phoneNumber;
    if (address !== undefined) updateData.address = address;

    const { id } = await params;
    const user = await prisma.user.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json({ 
      success: true, 
      message: 'User updated successfully',
      user 
    });
  } catch (error) {
    console.error('Error updating user:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}