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
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const issue = await prisma.issue.findUnique({
      where: { id },
      include: {
        reportedByUser: {
          select: {
            id: true,
            name: true,
            email: true,
            phoneNumber: true,
          },
        },
        assignedToUser: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        order: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
            items: true,
          },
        },
      },
    });

    if (!issue) {
      return NextResponse.json({ error: 'Issue not found' }, { status: 404 });
    }

    return NextResponse.json({ issue });
  } catch (error) {
    logger.error('Error fetching issue:', error);
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
    const { status, priority, assignedToUserId, description } = body;

    const updateData: any = {};
    
    if (status) {
      updateData.status = status;
      if (status === 'RESOLVED' || status === 'CLOSED') {
        updateData.resolvedAt = new Date();
      }
    }

    if (priority) {
      updateData.priority = priority;
    }

    if (assignedToUserId) {
      updateData.assignedToUserId = assignedToUserId;
    }

    if (description) {
      updateData.description = description;
    }

    const { id } = await params;
    
    // Get original issue data for audit logging
    const originalIssue = await prisma.issue.findUnique({
      where: { id },
      select: { 
        id: true, 
        title: true, 
        status: true, 
        priority: true, 
        assignedToUserId: true,
        reportedByUserId: true,
      },
    });

    if (!originalIssue) {
      await auditLogger.logFromRequest(request, {
        level: AuditLogLevel.WARNING,
        eventType: AuditEventType.admin_action,
        userId: session.user.id,
        userRole: 'admin',
        targetResourceId: id,
        targetResourceType: 'issue',
        action: 'update_issue',
        description: 'Attempted to update non-existent issue',
        success: false,
      });
      return NextResponse.json({ error: 'Issue not found' }, { status: 404 });
    }

    const issue = await prisma.issue.update({
      where: { id },
      data: updateData,
      include: {
        reportedByUser: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        assignedToUser: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    // Determine what changed for audit logging
    const changes: string[] = [];
    if (status && status !== originalIssue.status) changes.push(`status: ${originalIssue.status} → ${status}`);
    if (priority && priority !== originalIssue.priority) changes.push(`priority: ${originalIssue.priority} → ${priority}`);
    if (assignedToUserId && assignedToUserId !== originalIssue.assignedToUserId) {
      changes.push(`assigned to: ${originalIssue.assignedToUserId || 'unassigned'} → ${assignedToUserId}`);
    }

    // Log the issue update
    await auditLogger.logFromRequest(request, {
      level: AuditLogLevel.INFO,
      eventType: AuditEventType.admin_action,
      userId: session.user.id,
      userRole: 'admin',
      targetUserId: originalIssue.reportedByUserId || undefined,
      targetResourceId: issue.id,
      targetResourceType: 'issue',
      action: 'update_issue',
      description: `Admin updated issue "${originalIssue.title}"${changes.length > 0 ? '. Changes: ' + changes.join(', ') : ''}`,
      success: true,
      metadata: {
        originalData: {
          status: originalIssue.status,
          priority: originalIssue.priority,
          assignedToUserId: originalIssue.assignedToUserId,
        },
        newData: updateData,
        changes,
        issueTitle: originalIssue.title,
      },
    });

    return NextResponse.json({ 
      success: true, 
      message: 'Issue updated successfully',
      issue 
    });
  } catch (error) {
    logger.error('Error updating issue:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}