import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

export async function GET() {
  const session = await getServerSession(authOptions);
  
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const provider = await prisma.provider.findUnique({
    where: { 
      user: { 
        email: session.user.email 
      } 
    },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          image: true,
        },
      },
    },
  });

  if (!provider) {
    return NextResponse.json({ error: 'Provider not found' }, { status: 403 });
  }

  return NextResponse.json({ provider });
}
