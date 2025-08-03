import { NextRequest, NextResponse } from "next/server";
import { auth } from "@mounasabet/database/src/auth";
import { getAuthMessages, detectLanguage, type Language } from "@repo/utils/i18n";

/**
 * Resend verification email API endpoint
 * Allows users to request a new verification email if the original one expired or was lost
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
          message: messages.registration.emailVerificationSent 
        },
        { status: 200 }
      );
    }
    
    // Check if email is already verified
    if (user.emailVerified) {
      return NextResponse.json(
        { 
          success: true, 
          message: "Email already verified" 
        },
        { status: 200 }
      );
    }
    
    // Send verification email
    await auth.sendVerificationEmail({
      email,
      // Update user language preference if provided
      extraParams: language ? { language } : undefined,
    });
    
    return NextResponse.json(
      { 
        success: true, 
        message: messages.registration.emailVerificationSent 
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("Resend verification error:", error);
    
    // Detect language from request headers
    const language = detectLanguage(req.headers.get("accept-language") || undefined);
    const messages = getAuthMessages(language);
    
    return NextResponse.json(
      { 
        error: "verification_request_failed", 
        message: error.message || "Failed to resend verification email" 
      },
      { status: 500 }
    );
  }
}