import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/database/prisma';
import { getSession } from '@/lib/auth';
import { logger } from '../../../../lib/production-logger';
import { withAdminAuth } from '@/lib/api-middleware';
import { ApiResponseBuilder } from '@/lib/api-response';

// Validation schema for query parameters
const usersQuerySchema = z.object({
  page: z.string().transform(val => Math.max(1, parseInt(val) || 1)),
  limit: z.string().transform(val => Math.min(100, Math.max(1, parseInt(val) || 10))),
  role: z.enum(['customer', 'provider', 'admin', 'all']).optional(),
  status: z.enum(['active', 'banned', 'all']).optional(),
  search: z.string().max(100, 'Search term too long').trim().optional(),
});

async function handleGET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const queryParams = Object.fromEntries(searchParams.entries());
  
  // Validate and sanitize query parameters
  const validatedQuery = usersQuerySchema.parse(queryParams);
  const { page, limit, role, status, search } = validatedQuery;

  const skip = (page - 1) * limit;

  // Build where clause with proper sanitization
  const where: any = {};
  
  if (role && role !== 'all') {
    where.role = role;
  }

  if (status === 'banned') {
    where.banned = true;
  } else if (status === 'active') {
    where.banned = { not: true };
  }

  if (search && search.length > 0) {
    where.OR = [
      { name: { contains: search, mode: 'insensitive' } },
      { email: { contains: search, mode: 'insensitive' } },
    ];
  }

  const [users, total] = await Promise.all([
    prisma.user.findMany({
      where,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        phoneNumber: true,
        address: true,
        banned: true,
        banReason: true,
        banExpires: true,
        createdAt: true,
        updatedAt: true,
        provider: {
          select: {
            id: true,
            name: true,
            isVerified: true,
          },
        },
        _count: {
          select: {
            bookings: true,
            orders: true,
            reviews: true,
          },
        },
      },
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
    }),
    prisma.user.count({ where }),
  ]);

  // Calculate additional statistics
  const statistics = {
    totalUsers: total,
    activeUsers: await prisma.user.count({ where: { banned: { not: true } } }),
    bannedUsers: await prisma.user.count({ where: { banned: true } }),
    roleDistribution: await prisma.user.groupBy({
      by: ['role'],
      _count: { role: true },
    }),
  };

  return ApiResponseBuilder.success({
    users,
    statistics,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
      hasNext: page * limit < total,
      hasPrev: page > 1,
    },
  }, 'Users retrieved successfully');
}

// Export wrapped handler with admin authentication
export const GET = withAdminAuth(handleGET, {
  component: 'admin_users_api',
});