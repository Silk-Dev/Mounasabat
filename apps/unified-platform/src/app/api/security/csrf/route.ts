import { NextRequest, NextResponse } from 'next/server';
import { CSRFProtection } from '@/lib/security';
import { auditLogger, AuditEventType } from '@/lib/audit-logger';
import { logger } from '@/lib/production-logger';

// Generate CSRF token
export async function GET(request: NextRequest) {
  try {
    const { token, secret } = CSRFProtection.generateToken();
    const tokenHash = CSRFProtection.generateTokenHash(token, secret);

    // Log CSRF token generation
    await auditLogger.logFromRequest(request, {
      level: 'info' as const,
      eventType: AuditEventType.SECURITY_VIOLATION,
      action: 'csrf_token_generated',
      description: 'CSRF token generated for client',
      success: true,
    });

    const response = NextResponse.json({ 
      token,
      expires: Date.now() + 24 * 60 * 60 * 1000, // 24 hours
    });

    // Set CSRF token in httpOnly cookie
    response.cookies.set('csrf-token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 24 * 60 * 60, // 24 hours
    });

    // Set secret in header for client-side access
    response.headers.set('X-CSRF-Secret', secret);

    return response;
  } catch (error) {
    logger.error('CSRF token generation error:', error);
    
    await auditLogger.logFromRequest(request, {
      level: 'error' as const,
      eventType: AuditEventType.SECURITY_VIOLATION,
      action: 'csrf_token_generation_failed',
      description: 'Failed to generate CSRF token',
      success: false,
      errorMessage: error instanceof Error ? error.message : String(error),
    });

    return NextResponse.json(
      { error: 'Failed to generate CSRF token' },
      { status: 500 }
    );
  }
}

// Validate CSRF token
export async function POST(request: NextRequest) {
  try {
    const { token, secret } = await request.json();

    if (!token || !secret) {
      return NextResponse.json(
        { error: 'Token and secret are required' },
        { status: 400 }
      );
    }

    const cookieToken = request.cookies.get('csrf-token')?.value;
    
    if (!cookieToken || cookieToken !== token) {
      await auditLogger.logFromRequest(request, {
        level: 'warning' as const,
        eventType: AuditEventType.SECURITY_VIOLATION,
        action: 'csrf_validation_failed',
        description: 'CSRF token validation failed - token mismatch',
        success: false,
      });

      return NextResponse.json(
        { error: 'Invalid CSRF token' },
        { status: 403 }
      );
    }

    // In a real implementation, you'd validate against a stored hash
    const isValid = token.length === 64 && secret.length === 64;

    if (isValid) {
      await auditLogger.logFromRequest(request, {
        level: 'info' as const,
        eventType: AuditEventType.SECURITY_VIOLATION,
        action: 'csrf_validation_success',
        description: 'CSRF token validated successfully',
        success: true,
      });

      return NextResponse.json({ valid: true });
    } else {
      await auditLogger.logFromRequest(request, {
        level: 'warning' as const,
        eventType: AuditEventType.SECURITY_VIOLATION,
        action: 'csrf_validation_failed',
        description: 'CSRF token validation failed - invalid format',
        success: false,
      });

      return NextResponse.json(
        { error: 'Invalid CSRF token format' },
        { status: 403 }
      );
    }
  } catch (error) {
    logger.error('CSRF validation error:', error);
    
    await auditLogger.logFromRequest(request, {
      level: 'error' as const,
      eventType: AuditEventType.SECURITY_VIOLATION,
      action: 'csrf_validation_error',
      description: 'CSRF token validation error',
      success: false,
      errorMessage: error instanceof Error ? error.message : String(error),
    });

    return NextResponse.json(
      { error: 'CSRF validation failed' },
      { status: 500 }
    );
  }
}