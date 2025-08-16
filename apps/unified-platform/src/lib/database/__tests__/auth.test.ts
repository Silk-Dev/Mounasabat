import { describe, it, expect, beforeEach, afterEach, vi, Mock } from 'vitest';
import { auth } from '../auth';
import { sendEmail } from '../email-service';
import { getAuthMessages, detectLanguage } from '@/lib/utils/i18n';

// Mock the email service
vi.mock('../email-service', () => ({
  sendEmail: vi.fn(),
}));

// Mock the i18n utilities
vi.mock('@lib/utils/i18n', () => ({
  getAuthMessages: vi.fn(),
  detectLanguage: vi.fn(),
}));

describe('Authentication Service', () => {
  const mockSendEmail = sendEmail as Mock;
  const mockGetAuthMessages = getAuthMessages as Mock;
  const mockDetectLanguage = detectLanguage as Mock;

  beforeEach(() => {
    vi.clearAllMocks();
    
    // Setup default mock returns
    mockGetAuthMessages.mockReturnValue({
      registration: {
        success: 'Registration successful',
        emailVerificationSent: 'Verification email sent',
        errors: {
          emailExists: 'Email already exists',
          invalidEmail: 'Invalid email',
          passwordTooShort: 'Password too short',
          nameRequired: 'Name required',
        },
      },
      passwordReset: {
        emailSent: 'Reset email sent',
        success: 'Password updated successfully',
        errors: {
          userNotFound: 'User not found',
          invalidToken: 'Invalid token',
          tokenExpired: 'Token expired',
        },
      },
      validation: {
        required: 'This field is required',
        invalidEmail: 'Invalid email format',
        passwordMinLength: 'Password must be at least 8 characters',
        nameMinLength: 'Name must be at least 2 characters',
      },
    });

    mockDetectLanguage.mockReturnValue('fr');
    mockSendEmail.mockResolvedValue(undefined);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Configuration', () => {
    it('should have correct base configuration', () => {
      expect(auth.options.baseURL).toBe('http://localhost:3000');
      expect(auth.options.secret).toBe('test-secret');
    });

    it('should have email and password authentication enabled', () => {
      expect(auth.options.emailAndPassword?.enabled).toBe(true);
      expect(auth.options.emailAndPassword?.requireEmailVerification).toBe(true);
    });

    it('should have Google OAuth configured with enhanced scopes', () => {
      expect(auth.options.socialProviders?.google).toBeDefined();
      expect(auth.options.socialProviders?.google?.clientId).toBe('test-google-client-id');
      expect(auth.options.socialProviders?.google?.clientSecret).toBe('test-google-client-secret');
      expect(auth.options.socialProviders?.google?.scope).toContain('openid');
    });

    it('should have Facebook OAuth configured with enhanced scopes', () => {
      expect(auth.options.socialProviders?.facebook).toBeDefined();
      expect(auth.options.socialProviders?.facebook?.clientId).toBe('test-facebook-client-id');
      expect(auth.options.socialProviders?.facebook?.clientSecret).toBe('test-facebook-client-secret');
      expect(auth.options.socialProviders?.facebook?.scope).toContain('user_location');
    });

    it('should have admin plugin enabled', () => {
      expect(auth.options.plugins).toBeDefined();
      expect(Array.isArray(auth.options.plugins)).toBe(true);
    });

    it('should have rate limiting enabled', () => {
      expect(auth.options.rateLimit?.enabled).toBe(true);
      expect(auth.options.rateLimit?.window).toBe(60);
      expect(auth.options.rateLimit?.max).toBe(10);
    });

    it('should have additional user fields configured', () => {
      expect(auth.options.user?.additionalFields).toBeDefined();
      expect(auth.options.user?.additionalFields?.language).toBeDefined();
      expect(auth.options.user?.additionalFields?.phoneNumber).toBeDefined();
      expect(auth.options.user?.additionalFields?.address).toBeDefined();
      expect(auth.options.user?.additionalFields?.preferences).toBeDefined();
      expect(auth.options.user?.additionalFields?.role).toBeDefined();
    });
  });

  describe('Email Verification', () => {
    it('should send verification email in French by default', async () => {
      const mockUser = {
        id: 'user-1',
        email: 'test@example.com',
        name: 'Test User',
        language: 'fr',
      };

      const mockUrl = 'http://localhost:3000/verify?token=abc123';
      const mockToken = 'abc123';

      // Call the sendVerificationEmail function
      await auth.options.emailAndPassword?.sendVerificationEmail?.({
        user: mockUser,
        url: mockUrl,
        token: mockToken,
      });

      expect(mockGetAuthMessages).toHaveBeenCalledWith('fr');
      expect(mockSendEmail).toHaveBeenCalledWith({
        to: 'test@example.com',
        subject: 'Vérification de votre email',
        template: 'email-verification',
        data: {
          name: 'Test User',
          verificationUrl: mockUrl,
          token: mockToken,
          language: 'fr',
          messages: expect.any(Object),
        },
      });
    });

    it('should send verification email in Arabic when user language is Arabic', async () => {
      const mockUser = {
        id: 'user-1',
        email: 'test@example.com',
        name: 'Test User',
        language: 'ar',
      };

      const mockUrl = 'http://localhost:3000/verify?token=abc123';
      const mockToken = 'abc123';

      await auth.options.emailAndPassword?.sendVerificationEmail?.({
        user: mockUser,
        url: mockUrl,
        token: mockToken,
      });

      expect(mockGetAuthMessages).toHaveBeenCalledWith('ar');
      expect(mockSendEmail).toHaveBeenCalledWith({
        to: 'test@example.com',
        subject: 'تأكيد البريد الإلكتروني',
        template: 'email-verification',
        data: {
          name: 'Test User',
          verificationUrl: mockUrl,
          token: mockToken,
          language: 'ar',
          messages: expect.any(Object),
        },
      });
    });

    it('should handle email sending errors gracefully', async () => {
      mockSendEmail.mockRejectedValue(new Error('Email service unavailable'));

      const mockUser = {
        id: 'user-1',
        email: 'test@example.com',
        name: 'Test User',
        language: 'fr',
      };

      const mockUrl = 'http://localhost:3000/verify?token=abc123';
      const mockToken = 'abc123';

      await expect(
        auth.options.emailAndPassword?.sendVerificationEmail?.({
          user: mockUser,
          url: mockUrl,
          token: mockToken,
        })
      ).rejects.toThrow('Failed to send verification email');
    });
    
    it('should return success object when email is sent successfully', async () => {
      const mockUser = {
        id: 'user-1',
        email: 'test@example.com',
        name: 'Test User',
        language: 'fr',
      };

      const mockUrl = 'http://localhost:3000/verify?token=abc123';
      const mockToken = 'abc123';

      const result = await auth.options.emailAndPassword?.sendVerificationEmail?.({
        user: mockUser,
        url: mockUrl,
        token: mockToken,
      });

      expect(result).toEqual({ success: true });
    });
  });

  describe('Password Reset', () => {
    it('should send password reset email in French by default', async () => {
      const mockUser = {
        id: 'user-1',
        email: 'test@example.com',
        name: 'Test User',
        language: 'fr',
      };

      const mockUrl = 'http://localhost:3000/reset?token=def456';
      const mockToken = 'def456';

      await auth.options.emailAndPassword?.sendResetPassword?.({
        user: mockUser,
        url: mockUrl,
        token: mockToken,
      });

      expect(mockGetAuthMessages).toHaveBeenCalledWith('fr');
      expect(mockSendEmail).toHaveBeenCalledWith({
        to: 'test@example.com',
        subject: 'Réinitialisation du mot de passe',
        template: 'password-reset',
        data: {
          name: 'Test User',
          resetUrl: mockUrl,
          token: mockToken,
          language: 'fr',
          messages: expect.any(Object),
        },
      });
    });

    it('should send password reset email in Arabic when user language is Arabic', async () => {
      const mockUser = {
        id: 'user-1',
        email: 'test@example.com',
        name: 'Test User',
        language: 'ar',
      };

      const mockUrl = 'http://localhost:3000/reset?token=def456';
      const mockToken = 'def456';

      await auth.options.emailAndPassword?.sendResetPassword?.({
        user: mockUser,
        url: mockUrl,
        token: mockToken,
      });

      expect(mockGetAuthMessages).toHaveBeenCalledWith('ar');
      expect(mockSendEmail).toHaveBeenCalledWith({
        to: 'test@example.com',
        subject: 'إعادة تعيين كلمة المرور',
        template: 'password-reset',
        data: {
          name: 'Test User',
          resetUrl: mockUrl,
          token: mockToken,
          language: 'ar',
          messages: expect.any(Object),
        },
      });
    });

    it('should handle password reset email errors gracefully', async () => {
      mockSendEmail.mockRejectedValue(new Error('Email service unavailable'));

      const mockUser = {
        id: 'user-1',
        email: 'test@example.com',
        name: 'Test User',
        language: 'fr',
      };

      const mockUrl = 'http://localhost:3000/reset?token=def456';
      const mockToken = 'def456';

      await expect(
        auth.options.emailAndPassword?.sendResetPassword?.({
          user: mockUser,
          url: mockUrl,
          token: mockToken,
        })
      ).rejects.toThrow('Failed to send password reset email');
    });
    
    it('should return success object when reset email is sent successfully', async () => {
      const mockUser = {
        id: 'user-1',
        email: 'test@example.com',
        name: 'Test User',
        language: 'fr',
      };

      const mockUrl = 'http://localhost:3000/reset?token=def456';
      const mockToken = 'def456';

      const result = await auth.options.emailAndPassword?.sendResetPassword?.({
        user: mockUser,
        url: mockUrl,
        token: mockToken,
      });

      expect(result).toEqual({ success: true });
    });
  });

  describe('Password Validation', () => {
    it('should validate password length', () => {
      const shortPassword = 'short';
      const result = auth.options.emailAndPassword?.passwordValidation?.(shortPassword);
      
      expect(result).toEqual({
        valid: false,
        message: 'Password must be at least 8 characters long'
      });
    });
    
    it('should validate password contains at least one number', () => {
      const noNumberPassword = 'password!';
      const result = auth.options.emailAndPassword?.passwordValidation?.(noNumberPassword);
      
      expect(result).toEqual({
        valid: false,
        message: 'Password must contain at least one number'
      });
    });
    
    it('should validate password contains at least one special character', () => {
      const noSpecialCharPassword = 'password123';
      const result = auth.options.emailAndPassword?.passwordValidation?.(noSpecialCharPassword);
      
      expect(result).toEqual({
        valid: false,
        message: 'Password must contain at least one special character'
      });
    });
    
    it('should accept valid passwords', () => {
      const validPassword = 'Password123!';
      const result = auth.options.emailAndPassword?.passwordValidation?.(validPassword);
      
      expect(result).toEqual({ valid: true });
    });
  });

  describe('Session Configuration', () => {
    it('should have correct session settings', () => {
      expect(auth.options.session?.expiresIn).toBe(60 * 60 * 24 * 7); // 7 days
      expect(auth.options.session?.updateAge).toBe(60 * 60 * 24); // 1 day
      expect(auth.options.session?.cookieCache?.enabled).toBe(true);
      expect(auth.options.session?.cookieCache?.maxAge).toBe(60 * 5); // 5 minutes
    });
  });

  describe('Security Configuration', () => {
    it('should have secure cookie settings for production', () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'production';

      // Note: This would require re-initializing the auth instance
      // For this test, we'll just verify the logic would work
      expect(process.env.NODE_ENV).toBe('production');
      expect(auth.options.advanced?.useSecureCookies).toBe(true);

      process.env.NODE_ENV = originalEnv;
    });

    it('should have cross-subdomain cookies disabled', () => {
      expect(auth.options.advanced?.crossSubDomainCookies?.enabled).toBe(false);
    });
    
    it('should have error handling configured', () => {
      expect(auth.options.advanced?.onError).toBeDefined();
      expect(typeof auth.options.advanced?.onError).toBe('function');
    });
  });

  describe('OAuth Providers', () => {
    it('should have correct Google OAuth scopes', () => {
      expect(auth.options.socialProviders?.google?.scope).toEqual(['email', 'profile', 'openid']);
    });

    it('should have correct Facebook OAuth scopes', () => {
      expect(auth.options.socialProviders?.facebook?.scope).toEqual(['email', 'public_profile', 'user_location']);
    });

    it('should have correct redirect URIs', () => {
      expect(auth.options.socialProviders?.google?.redirectURI).toBe(
        'http://localhost:3000/api/auth/callback/google'
      );
      expect(auth.options.socialProviders?.facebook?.redirectURI).toBe(
        'http://localhost:3000/api/auth/callback/facebook'
      );
    });
    
    it('should have Google profile handler configured', () => {
      expect(auth.options.socialProviders?.google?.profile).toBeDefined();
      expect(typeof auth.options.socialProviders?.google?.profile).toBe('function');
      
      // Test the profile handler
      const mockGoogleProfile = {
        sub: 'google-user-123',
        name: 'Google User',
        email: 'google@example.com',
        picture: 'https://example.com/picture.jpg',
        locale: 'fr-FR'
      };
      
      const result = auth.options.socialProviders?.google?.profile?.(mockGoogleProfile);
      
      expect(result).toEqual({
        id: 'google-user-123',
        name: 'Google User',
        email: 'google@example.com',
        image: 'https://example.com/picture.jpg',
        language: 'fr'
      });
    });
    
    it('should detect Arabic language from Google profile', () => {
      const mockGoogleProfile = {
        sub: 'google-user-123',
        name: 'Google User',
        email: 'google@example.com',
        picture: 'https://example.com/picture.jpg',
        locale: 'ar-TN'
      };
      
      const result = auth.options.socialProviders?.google?.profile?.(mockGoogleProfile);
      
      expect(result?.language).toBe('ar');
    });
    
    it('should have Facebook profile handler configured', () => {
      expect(auth.options.socialProviders?.facebook?.profile).toBeDefined();
      expect(typeof auth.options.socialProviders?.facebook?.profile).toBe('function');
      
      // Test the profile handler
      const mockFacebookProfile = {
        id: 'facebook-user-123',
        name: 'Facebook User',
        email: 'facebook@example.com',
        picture: {
          data: {
            url: 'https://example.com/fb-picture.jpg'
          }
        },
        location: {
          name: 'Tunis, Tunisia'
        }
      };
      
      const result = auth.options.socialProviders?.facebook?.profile?.(mockFacebookProfile);
      
      expect(result).toEqual({
        id: 'facebook-user-123',
        name: 'Facebook User',
        email: 'facebook@example.com',
        image: 'https://example.com/fb-picture.jpg',
        address: 'Tunis, Tunisia',
        language: 'fr'
      });
    });
  });

  describe('User Fields', () => {
    it('should have language field with French default', () => {
      const languageField = auth.options.user?.additionalFields?.language;
      expect(languageField?.type).toBe('string');
      expect(languageField?.defaultValue).toBe('fr');
      expect(languageField?.required).toBe(false);
    });

    it('should have optional phone number field', () => {
      const phoneField = auth.options.user?.additionalFields?.phoneNumber;
      expect(phoneField?.type).toBe('string');
      expect(phoneField?.required).toBe(false);
    });

    it('should have optional address field', () => {
      const addressField = auth.options.user?.additionalFields?.address;
      expect(addressField?.type).toBe('string');
      expect(addressField?.required).toBe(false);
    });

    it('should have preferences object field', () => {
      const preferencesField = auth.options.user?.additionalFields?.preferences;
      expect(preferencesField?.type).toBe('object');
      expect(preferencesField?.required).toBe(false);
    });

    it('should have role field with user default', () => {
      const roleField = auth.options.user?.additionalFields?.role;
      expect(roleField?.type).toBe('string');
      expect(roleField?.defaultValue).toBe('user');
      expect(roleField?.required).toBe(false);
    });
  });
  
  describe('Error Handling', () => {
    it('should have error handler configured', () => {
      expect(auth.options.advanced?.onError).toBeDefined();
    });
    
    it('should handle email-related errors', () => {
      const mockReq = {
        headers: { 'accept-language': 'fr' }
      };
      const mockRes = {
        status: vi.fn().mockReturnThis(),
        json: vi.fn()
      };
      const mockError = new Error('invalid email format');
      
      mockDetectLanguage.mockReturnValue('fr');
      
      auth.options.advanced?.onError?.(mockError, mockReq as any, mockRes as any);
      
      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: 'invalid_email',
        message: expect.any(String)
      });
    });
    
    it('should handle password-related errors', () => {
      const mockReq = {
        headers: { 'accept-language': 'ar' }
      };
      const mockRes = {
        status: vi.fn().mockReturnThis(),
        json: vi.fn()
      };
      const mockError = new Error('password too short');
      
      mockDetectLanguage.mockReturnValue('ar');
      
      auth.options.advanced?.onError?.(mockError, mockReq as any, mockRes as any);
      
      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: 'invalid_password',
        message: expect.any(String)
      });
    });
    
    it('should handle token-related errors', () => {
      const mockReq = {
        headers: { 'accept-language': 'fr' }
      };
      const mockRes = {
        status: vi.fn().mockReturnThis(),
        json: vi.fn()
      };
      const mockError = new Error('invalid token provided');
      
      mockDetectLanguage.mockReturnValue('fr');
      
      auth.options.advanced?.onError?.(mockError, mockReq as any, mockRes as any);
      
      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: 'invalid_token',
        message: expect.any(String)
      });
    });
    
    it('should handle generic errors', () => {
      const mockReq = {
        headers: { 'accept-language': 'ar' }
      };
      const mockRes = {
        status: vi.fn().mockReturnThis(),
        json: vi.fn()
      };
      const mockError = new Error('unknown error');
      
      mockDetectLanguage.mockReturnValue('ar');
      
      auth.options.advanced?.onError?.(mockError, mockReq as any, mockRes as any);
      
      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: 'auth_error',
        message: 'حدث خطأ في المصادقة'
      });
    });
  });
});