import { auth } from '@/lib/auth';
import { toNextJsHandler } from 'better-auth/next-js';
import { NextRequest, NextResponse } from 'next/server';
import { withRateLimit } from '@/lib/rate-limiter';
import { auditLogger, AuditEventType, AuditLogLevel } from '@/lib/audit-logger';
import { InputSanitizer } from '@/lib/security';

const { GET: getHandler, POST: postHandler } = toNextJsHandler(auth);

export async function GET(request: NextRequest) {
  try {
    return await withRateLimit(request, 'auth', async () => {
      const response = await getHandler(request);
      
      // Log auth-related GET requests (like session checks)
      const pathname = new URL(request.url).pathname;
      if (pathname.includes('/session')) {
        await auditLogger.logFromRequest(request, {
          level: AuditLogLevel.INFO,
          eventType: AuditEventType.USER_LOGIN,
          action: 'session_check',
          description: 'User session validation',
          success: response.status === 200,
        });
      }
      
      return response;
    });
  } catch (error) {
    await auditLogger.logFromRequest(request, {
      level: AuditLogLevel.ERROR,
      eventType: AuditEventType.SECURITY_VIOLATION,
      action: 'auth_get_error',
      description: 'Authentication GET request failed',
      success: false,
      errorMessage: error instanceof Error ? error.message : String(error),
    });

    if (error instanceof Error && error.message.includes('Rate limit')) {
      return NextResponse.json(
        { error: 'Too many requests. Please try again later.' },
        { status: 429 }
      );
    }

    return NextResponse.json(
      { error: 'Authentication service temporarily unavailable' },
      { status: 503 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    return await withRateLimit(request, 'auth', async () => {
      // Clone request to read body for logging
      const requestClone = request.clone();
      let requestBody: any = {};
      
      try {
        const bodyText = await requestClone.text();
        if (bodyText) {
          requestBody = JSON.parse(bodyText);
          
          // Sanitize input data
          if (requestBody.email) {
            requestBody.email = InputSanitizer.sanitizeGeneral(requestBody.email);
          }
          if (requestBody.name) {
            requestBody.name = InputSanitizer.sanitizeGeneral(requestBody.name);
          }
        }
      } catch (e) {
        // Body parsing failed, continue without logging details
      }

      const response = await postHandler(request);
      const pathname = new URL(request.url).pathname;
      const isSuccess = response.status >= 200 && response.status < 300;

      // Determine the auth action type
      let eventType = AuditEventType.USER_LOGIN;
      let action = 'auth_action';
      let description = 'Authentication action';

      if (pathname.includes('/sign-in')) {
        eventType = isSuccess ? AuditEventType.USER_LOGIN : AuditEventType.USER_LOGIN_FAILED;
        action = 'sign_in';
        description = isSuccess ? 'User signed in successfully' : 'User sign in failed';
      } else if (pathname.includes('/sign-up')) {
        eventType = AuditEventType.USER_CREATED;
        action = 'sign_up';
        description = isSuccess ? 'User registered successfully' : 'User registration failed';
      } else if (pathname.includes('/sign-out')) {
        eventType = AuditEventType.USER_LOGOUT;
        action = 'sign_out';
        description = 'User signed out';
      } else if (pathname.includes('/reset-password')) {
        eventType = AuditEventType.PASSWORD_RESET;
        action = 'password_reset';
        description = isSuccess ? 'Password reset initiated' : 'Password reset failed';
      } else if (pathname.includes('/change-password')) {
        eventType = AuditEventType.PASSWORD_CHANGED;
        action = 'password_change';
        description = isSuccess ? 'Password changed successfully' : 'Password change failed';
      }

      // Log the authentication event
      await auditLogger.logFromRequest(request, {
        level: isSuccess ? AuditLogLevel.INFO : AuditLogLevel.WARNING,
        eventType,
        userId: requestBody.email || undefined, // Use email as identifier for failed attempts
        action,
        description,
        success: isSuccess,
        metadata: {
          email: requestBody.email,
          userAgent: request.headers.get('user-agent'),
          method: pathname.split('/').pop(),
        },
      });

      return response;
    });
  } catch (error) {
    await auditLogger.logFromRequest(request, {
      level: AuditLogLevel.ERROR,
      eventType: AuditEventType.SECURITY_VIOLATION,
      action: 'auth_post_error',
      description: 'Authentication POST request failed',
      success: false,
      errorMessage: error instanceof Error ? error.message : String(error),
    });

    if (error instanceof Error && error.message.includes('Rate limit')) {
      return NextResponse.json(
        { error: 'Too many authentication attempts. Please try again later.' },
        { status: 429 }
      );
    }

    return NextResponse.json(
      { error: 'Authentication service temporarily unavailable' },
      { status: 503 }
    );
  }
}