import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/database/prisma';
import { getSession } from '@/lib/auth';
import { logger } from '../../../../../lib/production-logger';
import { auditLogger, AuditEventType, AuditLogLevel } from '@/lib/audit-logger';

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
    logger.error('Error fetching provider:', error);
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
        eventType: AuditEventType.unauthorized_access,
        userId: session?.user?.id,
        action: 'update_provider',
        description: 'Unauthorized attempt to update provider',
        success: false,
      });
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { isVerified, banUser, banReason, banExpires } = body;

    const { id } = await params;
    
    // Get original provider data for audit logging
    const originalProvider = await prisma.provider.findUnique({
      where: { id },
      include: {
        user: {
          select: { id: true, name: true, email: true, banned: true },
        },
      },
    });

    if (!originalProvider) {
      await auditLogger.logFromRequest(request, {
        level: AuditLogLevel.WARNING,
        eventType: AuditEventType.admin_action,
        userId: session.user.id,
        userRole: 'admin',
        targetResourceId: id,
        targetResourceType: 'provider',
        action: 'update_provider',
        description: 'Attempted to update non-existent provider',
        success: false,
      });
      return NextResponse.json({ error: 'Provider not found' }, { status: 404 });
    }

    // Update provider verification status
    const updateData: any = {};
    if (typeof isVerified === 'boolean') {
      updateData.isVerified = isVerified;
    }

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

    // Determine what changed for audit logging
    const changes: string[] = [];
    if (typeof isVerified === 'boolean' && isVerified !== originalProvider.isVerified) {
      changes.push(`verification: ${originalProvider.isVerified} → ${isVerified}`);
    }
    if (typeof banUser === 'boolean' && banUser !== originalProvider.user.banned) {
      changes.push(`user banned: ${originalProvider.user.banned} → ${banUser}`);
      if (banUser && banReason) changes.push(`ban reason: ${banReason}`);
    }

    // Log the provider update
    const eventType = isVerified === true ? AuditEventType.provider_approved : 
                     isVerified === false ? AuditEventType.provider_rejected :
                     banUser ? AuditEventType.provider_suspended : AuditEventType.admin_action;

    await auditLogger.logFromRequest(request, {
      level: AuditLogLevel.INFO,
      eventType,
      userId: session.user.id,
      userRole: 'admin',
      targetUserId: provider.userId,
      targetResourceId: provider.id,
      targetResourceType: 'provider',
      action: isVerified === true ? 'approve_provider' : 
              isVerified === false ? 'reject_provider' :
              banUser ? 'suspend_provider' : 'update_provider',
      description: `Admin ${isVerified === true ? 'approved' : 
                           isVerified === false ? 'rejected' :
                           banUser ? 'suspended' : 'updated'} provider ${originalProvider.name} (${originalProvider.user.name})${changes.length > 0 ? '. Changes: ' + changes.join(', ') : ''}`,
      success: true,
      metadata: {
        originalData: {
          isVerified: originalProvider.isVerified,
          userBanned: originalProvider.user.banned,
        },
        newData: { isVerified, banUser, banReason },
        changes,
      },
    });

    return NextResponse.json({ 
      success: true, 
      message: 'Provider updated successfully' 
    });
  } catch (error) {
    logger.error('Error updating provider:', error);
    
    // Log the error
    const session = await getSession(request);
    await auditLogger.logFromRequest(request, {
      level: AuditLogLevel.ERROR,
      eventType: AuditEventType.admin_action,
      userId: session?.user?.id,
      userRole: 'admin',
      targetResourceId: (await params).id,
      targetResourceType: 'provider',
      action: 'update_provider',
      description: 'Failed to update provider due to system error',
      success: false,
      errorMessage: error instanceof Error ? error.message : String(error),
    });

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}