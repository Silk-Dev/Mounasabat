import { NextRequest } from 'next/server';
import { errorHandler } from '@/lib/production-error-handler';
import { ApiResponseBuilder } from '@/lib/api-response';
import { logger } from '@/lib/production-logger';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { error, section, url, userAgent, timestamp } = body;

    // Log the user-reported error
    logger.info('User reported error', {
      component: 'error_reporting',
      metadata: {
        reportedError: error,
        section,
        url,
        userAgent,
        timestamp,
        reportedAt: new Date().toISOString(),
      },
    });

    return ApiResponseBuilder.success(
      { reported: true },
      'Error report received. Thank you for helping us improve!'
    );
  } catch (error) {
    return errorHandler.handleAPIError(
      error instanceof Error ? error : new Error(String(error)),
      request,
      { component: 'error_reporting' }
    );
  }
}