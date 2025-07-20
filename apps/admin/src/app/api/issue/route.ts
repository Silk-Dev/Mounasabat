
import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(req: NextRequest) {
  try {
    const issues = await prisma.issue.findMany({
      include: { reportedByUser: true, assignedToUser: true },
    });
    return NextResponse.json(issues);
  } catch (error) {
    console.error('Error fetching issues:', error);
    return NextResponse.json({ error: 'Failed to fetch issues' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { title, description, reportedByUserId, assignedToUserId, status, priority } = await req.json();

    if (!title || !reportedByUserId) {
      return NextResponse.json({ error: 'Title and reportedByUserId are required' }, { status: 400 });
    }

    const newIssue = await prisma.issue.create({
      data: {
        title,
        description,
        reportedByUserId,
        assignedToUserId,
        status,
        priority,
      },
    });

    return NextResponse.json(newIssue, { status: 201 });
  } catch (error) {
    console.error('Error creating issue:', error);
    return NextResponse.json({ error: 'Failed to create issue' }, { status: 500 });
  }
}
