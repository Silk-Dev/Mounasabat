import { NextRequest, NextResponse } from "next/server";
import { auth } from "@mounasabet/database/src/auth";
import { getAuthMessages, detectLanguage, type Language } from "@repo/utils/i18n";

/**
 * Enhanced user registration API with email verification
 * Supports multi-language registration flows
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, email, password, language = "fr", phoneNumber } = body;
    
    // Detect language from request headers if not provided in body
    const detectedLanguage = language || detectLanguage(req.headers.get("accept-language") || undefined);
    const messages = getAuthMessages(detectedLanguage as Language);
    
    // Validate required fields
    if (!name || !email || !password) {
      return NextResponse.json(
        { 
          error: "missing_fields", 
          message: messages.validation.required 
        },
        { status: 400 }
      );
    }
    
    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { 
          error: "invalid_email", 
          message: messages.validation.invalidEmail 
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
    
    // Check if user already exists
    const existingUser = await auth.getUserByEmail(email);
    if (existingUser) {
      return NextResponse.json(
        { 
          error: "email_exists", 
          message: messages.registration.errors.emailExists 
        },
        { status: 400 }
      );
    }
    
    // Create user with additional fields
    const user = await auth.createUser({
      name,
      email,
      password,
      language: detectedLanguage as Language,
      phoneNumber,
      emailVerified: false,
    });
    
    // Send verification email
    await auth.sendVerificationEmail({ email });
    
    return NextResponse.json(
      { 
        success: true, 
        message: messages.registration.emailVerificationSent,
        userId: user.id 
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("Registration error:", error);
    
    // Detect language from request headers
    const language = detectLanguage(req.headers.get("accept-language") || undefined);
    const messages = getAuthMessages(language);
    
    return NextResponse.json(
      { 
        error: "registration_failed", 
        message: error.message || messages.registration.errors.emailExists 
      },
      { status: 500 }
    );
  }
}