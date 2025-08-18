import { NextRequest, NextResponse } from 'next/server';
import { SearchAnalytics } from '@/lib/search-analytics';
import { logger } from '@/lib/production-logger';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') || 'metrics';
    const days = parseInt(searchParams.get('days') || '7');
    
    switch (type) {
      case 'metrics': {
        const startDate = searchParams.get('startDate');
        const endDate = searchParams.get('endDate');
        
        const dateRange = startDate && endDate ? {
          start: new Date(startDate),
          end: new Date(endDate),
        } : undefined;
        
        const metrics = await SearchAnalytics.getSearchMetrics(dateRange);
        
        return NextResponse.json({
          success: true,
          data: metrics,
        });
      }
      
      case 'performance': {
        const performanceMetrics = await SearchAnalytics.getPerformanceMetrics(days);
        
        return NextResponse.json({
          success: true,
          data: performanceMetrics,
        });
      }

      case 'empty-searches': {
        const emptySearchAnalytics = await SearchAnalytics.getEmptySearchAnalytics(days);
        
        return NextResponse.json({
          success: true,
          data: emptySearchAnalytics,
        });
      }

      case 'user-behavior': {
        const userBehavior = await SearchAnalytics.getUserSearchBehavior(days);
        
        return NextResponse.json({
          success: true,
          data: userBehavior,
        });
      }

      case 'trending-categories': {
        const trendingCategories = await SearchAnalytics.getTrendingCategories(days);
        
        return NextResponse.json({
          success: true,
          data: trendingCategories,
        });
      }
      
      default:
        return NextResponse.json(
          {
            success: false,
            error: 'Invalid analytics type',
            message: 'Supported types: metrics, performance, empty-searches, user-behavior, trending-categories',
          },
          { status: 400 }
        );
    }
  } catch (error) {
    logger.error('Search analytics API error:', error);
    
    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error',
        message: 'An error occurred while fetching search analytics',
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, data } = body;
    
    switch (action) {
      case 'record_performance': {
        const { query, responseTime, resultCount, fromCache } = data;
        await SearchAnalytics.recordSearchPerformance(query, responseTime, resultCount, fromCache);
        
        return NextResponse.json({
          success: true,
          message: 'Performance data recorded successfully',
        });
      }
      
      default:
        return NextResponse.json(
          {
            success: false,
            error: 'Invalid action',
            message: 'Supported actions: record_performance',
          },
          { status: 400 }
        );
    }
  } catch (error) {
    logger.error('Search analytics API error:', error);
    
    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error',
        message: 'An error occurred while processing analytics data',
      },
      { status: 500 }
    );
  }
}