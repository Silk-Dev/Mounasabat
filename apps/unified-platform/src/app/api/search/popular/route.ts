import { NextRequest, NextResponse } from 'next/server';
import { SearchAnalytics } from '@/lib/search-analytics';
import { logger } from '@/lib/production-logger';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '10');
    const days = parseInt(searchParams.get('days') || '7');

    // Get popular search queries from analytics
    const popularQueries = await SearchAnalytics.getPopularQueries(days);
    const searches = popularQueries
      .slice(0, Math.min(limit, 20))
      .map(({ query }) => query);

    return NextResponse.json({
      success: true,
      searches,
      total: popularQueries.length,
      period: `${days} days`,
    });

  } catch (error) {
    logger.error('Popular searches API error:', error);

    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error',
        message: 'An error occurred while fetching popular searches',
        searches: [],
      },
      { status: 500 }
    );
  }
}