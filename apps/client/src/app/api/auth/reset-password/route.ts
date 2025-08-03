import { NextRequest, NextResponse } from "next/server";
import { auth } from "@mounasabet/database/src/auth";
import { getAuthMessages, detectLanguage, type Language } from "@repo/utils/i18n";

/**
 * Enhanced password reset API with secure token generation
 * Supports multi-language password reset flows
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, language } = body;
    
    // Detect language from request headers if not provided in body
    const detectedLanguage = language || detectLanguage(req.headers.get("accept-language") || undefined);
    const messages = getAuthMessages(detectedLanguage as Language);
    
    // Validate email
    if (!email) {
      return NextResponse.json(
        { 
          error: "missing_email", 
          message: messages.validation.required 
        },
        { status: 400 }
      );
    }
    
    // Check if user exists
    const user = await auth.getUserByEmail(email);
    if (!user) {
      // For security reasons, we still return success even if the user doesn't exist
      // This prevents email enumeration attacks
      return NextResponse.json(
        { 
          success: true, 
          message: messages.passwordReset.emailSent 
        },
        { status: 200 }
      );
    }
    
    // Send password reset email
    await auth.sendPasswordResetEmail({
      email,
      // Update user language preference if provided
      extraParams: language ? { language } : undefined,
    });
    
    return NextResponse.json(
      { 
        success: true, 
        message: messages.passwordReset.emailSent 
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("Password reset request error:", error);
    
    // Detect language from request headers
    const language = detectLanguage(req.headers.get("accept-language") || undefined);
    const messages = getAuthMessages(language);
    
    return NextResponse.json(
      { 
        error: "reset_request_failed", 
        message: error.message || messages.passwordReset.errors.userNotFound 
      },
      { status: 500 }
    );
  }
}

/**
 * Handle password reset token verification and password update
 */
export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const { token, password, language } = body;
    
    // Detect language from request headers if not provided in body
    const detectedLanguage = language || detectLanguage(req.headers.get("accept-language") || undefined);
    const messages = getAuthMessages(detectedLanguage as Language);
    
    // Validate required fields
    if (!token || !password) {
      return NextResponse.json(
        { 
          error: "missing_fields", 
          message: messages.validation.required 
        },
        { status: 400 }
      );
    }
    
    // Validate password strength
    if (password.length < 8) {
      return NextResponse.json(
        { 
          error: "weak_password", 
          message: messages.validation.passwordMinLength 
        },
        { status: 400 }
      );
    }
    
    // Verify token and update password
    const result = await auth.resetPassword({
      token,
      password,
    });
    
    if (!result.success) {
      return NextResponse.json(
        { 
          error: "invalid_token", 
          message: messages.passwordReset.errors.invalidToken 
        },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { 
        success: true, 
        message: messages.passwordReset.success 
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("Password reset error:", error);
    
    // Detect language from request headers
    const language = detectLanguage(req.headers.get("accept-language") || undefined);
    const messages = getAuthMessages(language);
    
    // Handle specific error types
    if (error.message.includes("token")) {
      return NextResponse.json(
        { 
          error: "invalid_token", 
          message: messages.passwordReset.errors.invalidToken 
        },
        { status: 400 }
      );
    }
    
    if (error.message.includes("expired")) {
      return NextResponse.json(
        { 
          error: "token_expired", 
          message: messages.passwordReset.errors.tokenExpired 
        },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { 
        error: "reset_failed", 
        message: error.message || messages.passwordReset.errors.invalidToken 
      },
      { status: 500 }
    );
  }
}