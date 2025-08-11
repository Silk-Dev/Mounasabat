import { NextRequest, NextResponse } from 'next/server';
import { performHealthCheck } from '@/lib/monitoring';

export async function GET(request: NextRequest) {
  try {
    const healthCheck = await performHealthCheck();
    
    const status = healthCheck.status === 'healthy' ? 200 : 
                  healthCheck.status === 'degraded' ? 200 : 503;
    
    return NextResponse.json(healthCheck, { status });
  } catch (error) {
    console.error('Health check endpoint error:', error);
    
    return NextResponse.json(
      {
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        error: 'Health check failed',
      },
      { status: 503 }
    );
  }
}

// Simple ping endpoint for load balancer health checks
export async function HEAD(request: NextRequest) {
  return new NextResponse(null, { status: 200 });
}