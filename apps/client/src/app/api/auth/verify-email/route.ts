import { NextRequest, NextResponse } from "next/server";
import { auth } from "@mounasabet/database/src/auth";
import { getAuthMessages, detectLanguage, type Language } from "@repo/utils/i18n";

/**
 * Email verification API endpoint
 * Verifies user email using the token sent in the verification email
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { token, language } = body;
    
    // Detect language from request headers if not provided in body
    const detectedLanguage = language || detectLanguage(req.headers.get("accept-language") || undefined);
    const messages = getAuthMessages(detectedLanguage as Language);
    
    // Validate token
    if (!token) {
      return NextResponse.json(
        { 
          error: "missing_token", 
          message: messages.validation.required 
        },
        { status: 400 }
      );
    }
    
    // Verify email with token
    const result = await auth.verifyEmail({ token });
    
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
        message: messages.registration.success 
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("Email verification error:", error);
    
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
        error: "verification_failed", 
        message: error.message || "Email verification failed" 
      },
      { status: 500 }
    );
  }
}