import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/database/prisma';
import { getSession } from '@/lib/auth';
import { logger } from '@/lib/production-logger';
import { auditLogger, AuditEventType, AuditLogLevel } from '@/lib/audit-logger';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession(request);

    if (!session?.user || session.user.role !== 'admin') {
      await auditLogger.logFromRequest(request, {
        level: AuditLogLevel.WARNING,
        eventType: AuditEventType.UNAUTHORIZED_ACCESS,
        userId: session?.user?.id,
        action: 'view_user_details',
        description: 'Unauthorized attempt to view user details',
        success: false,
      });
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
      await auditLogger.logFromRequest(request, {
        level: AuditLogLevel.WARNING,
        eventType: AuditEventType.ADMIN_ACTION,
        userId: session.user.id,
        userRole: 'admin',
        targetResourceId: (await params).id,
        targetResourceType: 'user',
        action: 'view_user_details',
        description: 'Attempted to view non-existent user',
        success: false,
      });
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Log successful user view
    await auditLogger.logFromRequest(request, {
      level: AuditLogLevel.INFO,
      eventType: AuditEventType.ADMIN_ACTION,
      userId: session.user.id,
      userRole: 'admin',
      targetUserId: user.id,
      targetResourceId: user.id,
      targetResourceType: 'user',
      action: 'view_user_details',
      description: `Admin viewed user details for ${user.name} (${user.email})`,
      success: true,
      metadata: {
        viewedUserRole: user.role,
        viewedUserBanned: user.banned,
      },
    });

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

    return Response.json(transformedUser);
  } catch (error) {
    logger.error('Error fetching user:', error as Error);
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
      await auditLogger.logFromRequest(request, {
        level: AuditLogLevel.WARNING,
        eventType: AuditEventType.UNAUTHORIZED_ACCESS,
        userId: session?.user?.id,
        action: 'update_user',
        description: 'Unauthorized attempt to update user',
        success: false,
      });
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
    
    // Get original user data for audit logging
    const originalUser = await prisma.user.findUnique({
      where: { id },
      select: { id: true, name: true, email: true, role: true, banned: true },
    });

    if (!originalUser) {
      await auditLogger.logFromRequest(request, {
        level: AuditLogLevel.WARNING,
        eventType: AuditEventType.ADMIN_ACTION,
        userId: session.user.id,
        userRole: 'admin',
        targetResourceId: id,
        targetResourceType: 'user',
        action: 'update_user',
        description: 'Attempted to update non-existent user',
        success: false,
      });
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const user = await prisma.user.update({
      where: { id },
      data: updateData,
    });

    // Determine what changed for audit logging
    const changes: string[] = [];
    if (role && role !== originalUser.role) changes.push(`role: ${originalUser.role} → ${role}`);
    if (typeof banned === 'boolean' && banned !== originalUser.banned) {
      changes.push(`banned: ${originalUser.banned} → ${banned}`);
      if (banned && banReason) changes.push(`ban reason: ${banReason}`);
    }
    if (name && name !== originalUser.name) changes.push(`name: ${originalUser.name} → ${name}`);
    if (email && email !== originalUser.email) changes.push(`email: ${originalUser.email} → ${email}`);

    // Log the user update
    await auditLogger.logFromRequest(request, {
      level: AuditLogLevel.INFO,
      eventType: banned ? AuditEventType.USER_SUSPENDED : AuditEventType.USER_UPDATED,
      userId: session.user.id,
      userRole: 'admin',
      targetUserId: user.id,
      targetResourceId: user.id,
      targetResourceType: 'user',
      action: banned ? 'ban_user' : 'update_user',
      description: `Admin ${banned ? 'banned' : 'updated'} user ${originalUser.name} (${originalUser.email})${changes.length > 0 ? '. Changes: ' + changes.join(', ') : ''}`,
      success: true,
      metadata: {
        originalData: {
          role: originalUser.role,
          banned: originalUser.banned,
        },
        newData: updateData,
        changes,
      },
    });

    return NextResponse.json({ 
      success: true, 
      message: 'User updated successfully',
      user 
    });
  } catch (error) {
    logger.error('Error updating user:', error);
    
    // Log the error
    const session = await getSession(request);
    await auditLogger.logFromRequest(request, {
      level: AuditLogLevel.ERROR,
      eventType: AuditEventType.ADMIN_ACTION,
      userId: session?.user?.id,
      userRole: 'admin',
      targetResourceId: (await params).id,
      targetResourceType: 'user',
      action: 'update_user',
      description: 'Failed to update user due to system error',
      success: false,
      errorMessage: error instanceof Error ? error.message : String(error),
    });

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}