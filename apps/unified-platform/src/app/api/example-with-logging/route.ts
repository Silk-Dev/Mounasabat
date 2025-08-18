import { NextRequest, NextResponse } from 'next/server';
import { withRequestLogger } from '@/lib/request-logger-middleware';
import { logger } from '@/lib/production-logger';

async function handler(req: NextRequest): Promise<NextResponse> {
  try {
    // Log user action
    logger.userAction('example_api_call', undefined, {
      endpoint: '/api/example-with-logging',
      method: req.method,
    });

    // Simulate some processing
    const startTime = Date.now();
    
    // Simulate database query
    await new Promise(resolve => setTimeout(resolve, 100));
    const queryDuration = Date.now() - startTime;
    
    logger.databaseQuery('SELECT * FROM example_table', queryDuration);

    // Return success response
    return NextResponse.json({
      success: true,
      message: 'Example API with production logging',
      timestamp: new Date().toISOString(),
    });

  } catch (error) {
    // Error will be automatically logged by the middleware
    logger.error('Example API error', error instanceof Error ? error : new Error(String(error)));
    
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Export the handler wrapped with request logging middleware
export const GET = withRequestLogger(handler, {
  logRequests: true,
  logResponses: true,
  logErrors: true,
  slowRequestThreshold: 500, // Log requests slower than 500ms
});

export const POST = withRequestLogger(handler);
export const PUT = withRequestLogger(handler);
export const DELETE = withRequestLogger(handler);