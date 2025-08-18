import { NextRequest, NextResponse } from 'next/server';
import { healthCheckService } from '@/lib/health-check-service';
import { logger } from '@/lib/production-logger';
import { withApiMiddleware } from '@/lib/api-middleware';
import { ApiResponseBuilder } from '@/lib/api-response';

async function handleGET(request: NextRequest) {
  const startTime = Date.now();
  const url = new URL(request.url);
  const detailed = url.searchParams.get('detailed') === 'true';
  
  try {
    const healthCheck = await healthCheckService.getSystemHealth();
    const degradationStatus = await healthCheckService.getDegradationStatus();
    
    // Add additional metadata
    const enhancedHealthCheck = {
      ...healthCheck,
      degradation_status: degradationStatus,
      cache_stats: healthCheckService.getCacheStats(),
    };
    
    // Determine HTTP status based on health status
    const httpStatus = healthCheck.status === 'healthy' ? 200 : 
                      healthCheck.status === 'degraded' ? 200 : 503;
    
    // Return appropriate response based on health status
    if (healthCheck.status === 'healthy') {
      return ApiResponseBuilder.success(
        detailed ? enhancedHealthCheck : { 
          status: healthCheck.status, 
          timestamp: healthCheck.timestamp,
          uptime: healthCheck.uptime,
          version: healthCheck.version 
        }, 
        'System is healthy'
      );
    } else if (healthCheck.status === 'degraded') {
      return NextResponse.json({
        success: true,
        data: detailed ? enhancedHealthCheck : {
          status: healthCheck.status,
          timestamp: healthCheck.timestamp,
          affected_services: healthCheck.degradation_info?.affected_services || [],
          fallback_status: degradationStatus.fallbackModes,
        },
        message: 'System is degraded but operational',
        warning: 'Some services may be experiencing issues',
        recommendations: getHealthRecommendations(healthCheck),
      }, { status: httpStatus });
    } else {
      return NextResponse.json({
        success: false,
        data: detailed ? enhancedHealthCheck : {
          status: healthCheck.status,
          timestamp: healthCheck.timestamp,
          critical_issues: Object.entries(healthCheck.services)
            .filter(([_, service]) => service.status === 'unhealthy')
            .map(([name, service]) => ({ service: name, error: service.error })),
        },
        error: 'System is unhealthy',
        message: 'Critical services are not operational',
        recommendations: getHealthRecommendations(healthCheck),
      }, { status: httpStatus });
    }
  } catch (error) {
    const responseTime = Date.now() - startTime;
    
    logger.error('Health check endpoint error:', error, {
      component: 'health_check',
      responseTime,
    });
    
    return NextResponse.json({
      success: false,
      error: 'Health check failed',
      data: {
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        responseTime,
        version: process.env.APP_VERSION || '1.0.0',
        error_details: error instanceof Error ? error.message : 'Unknown error',
      },
      message: 'Unable to determine system health',
      recommendations: [
        'Check system logs for detailed error information',
        'Verify database connectivity',
        'Restart health monitoring services',
      ],
    }, { status: 503 });
  }
}

// Simple ping endpoint for load balancer health checks
async function handleHEAD(request: NextRequest) {
  try {
    const quickCheck = await Promise.race([
      healthCheckService.getQuickHealth(),
      new Promise<{ status: 'unhealthy'; responseTime: number }>((_, reject) => 
        setTimeout(() => reject(new Error('Health check timeout')), 3000)
      )
    ]);
    
    const status = quickCheck.status === 'unhealthy' ? 503 : 200;
    return new NextResponse(null, { 
      status,
      headers: {
        'X-Health-Status': quickCheck.status,
        'X-Response-Time': quickCheck.responseTime.toString(),
      }
    });
  } catch (error) {
    logger.warn('Quick health check failed:', error);
    return new NextResponse(null, { 
      status: 503,
      headers: {
        'X-Health-Status': 'unhealthy',
        'X-Health-Error': error instanceof Error ? error.message : 'Unknown error',
      }
    });
  }
}

// Service-specific health check endpoint
async function handlePOST(request: NextRequest) {
  try {
    const body = await request.json();
    const { service } = body;
    
    if (!service || !['database', 'redis', 'stripe', 'external_apis'].includes(service)) {
      return NextResponse.json({
        success: false,
        error: 'Invalid service name',
        message: 'Service must be one of: database, redis, stripe, external_apis',
      }, { status: 400 });
    }
    
    const isAvailable = await healthCheckService.isServiceAvailable(service);
    
    return ApiResponseBuilder.success({
      service,
      available: isAvailable,
      timestamp: new Date().toISOString(),
    }, `Service ${service} status checked`);
  } catch (error) {
    logger.error('Service health check failed:', error);
    return NextResponse.json({
      success: false,
      error: 'Service health check failed',
      message: error instanceof Error ? error.message : 'Unknown error',
    }, { status: 500 });
  }
}

function getHealthRecommendations(healthCheck: any): string[] {
  const recommendations: string[] = [];
  
  if (healthCheck.services.database.status !== 'healthy') {
    recommendations.push('Check database connectivity and performance');
    recommendations.push('Review database connection pool settings');
  }
  
  if (healthCheck.services.redis.status !== 'healthy') {
    recommendations.push('Verify Redis server status and connectivity');
    recommendations.push('Consider operating without cache if Redis is unavailable');
  }
  
  if (healthCheck.services.stripe.status !== 'healthy') {
    recommendations.push('Check Stripe API credentials and connectivity');
    recommendations.push('Payment processing may be affected');
  }
  
  if (healthCheck.services.external_apis.status !== 'healthy') {
    recommendations.push('External integrations may be limited');
    recommendations.push('Core functionality should remain available');
  }
  
  if (healthCheck.metrics.memory_usage > 1000) {
    recommendations.push('High memory usage detected - consider scaling or optimization');
  }
  
  if (healthCheck.metrics.error_rate > 10) {
    recommendations.push('High error rate detected - check application logs');
  }
  
  return recommendations;
}

// Export wrapped handlers
export const GET = withApiMiddleware(handleGET, {
  component: 'health_api',
  logRequests: false, // Don't log health check requests to avoid noise
});

export const HEAD = withApiMiddleware(handleHEAD, {
  component: 'health_ping_api',
  logRequests: false, // Don't log ping requests
});

export const POST = withApiMiddleware(handlePOST, {
  component: 'service_health_api',
  logRequests: false,
});