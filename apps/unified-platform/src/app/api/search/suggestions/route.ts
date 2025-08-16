import { NextRequest, NextResponse } from 'next/server';
import { SearchOptimizer } from '@/lib/search';
import { SearchAnalytics } from '@/lib/search-analytics';
import { logger } from '../../../../lib/production-logger';

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const query = searchParams.get('q')?.trim();
        const limit = parseInt(searchParams.get('limit') || '5');

        if (!query) {
            // Return popular searches if no query provided
            const popularQueries = await SearchAnalytics.getPopularQueries(7);
            const suggestions = popularQueries
                .slice(0, Math.min(limit, 10))
                .map(({ query }) => query);

            return NextResponse.json({
                success: true,
                suggestions,
                type: 'popular',
            });
        }

        if (query.length < 2) {
            return NextResponse.json({
                success: true,
                suggestions: [],
                type: 'none',
                message: 'Query too short for suggestions',
            });
        }

        // Get suggestions based on query
        const suggestions = await SearchOptimizer.getSuggestions(query);
        const limitedSuggestions = suggestions.slice(0, Math.min(limit, 10));

        return NextResponse.json({
            success: true,
            suggestions: limitedSuggestions,
            type: 'autocomplete',
            query,
        });

    } catch (error) {
        logger.error('Search suggestions API error:', error);

        return NextResponse.json(
            {
                success: false,
                error: 'Internal server error',
                message: 'An error occurred while fetching search suggestions',
                suggestions: [],
            },
            { status: 500 }
        );
    }
}

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { query } = body;

        if (!query || typeof query !== 'string') {
            return NextResponse.json(
                {
                    success: false,
                    error: 'Invalid query',
                    message: 'Query parameter is required and must be a string',
                },
                { status: 400 }
            );
        }

        // Optimize the query
        const optimizedQuery = await SearchOptimizer.optimizeQuery(query);

        // Get suggestions
        const suggestions = await SearchOptimizer.getSuggestions(query);

        return NextResponse.json({
            success: true,
            originalQuery: query,
            optimizedQuery,
            suggestions,
        });

    } catch (error) {
        logger.error('Search suggestions API error:', error);

        return NextResponse.json(
            {
                success: false,
                error: 'Internal server error',
                message: 'An error occurred while processing the query',
            },
            { status: 500 }
        );
    }
}