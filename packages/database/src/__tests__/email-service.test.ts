import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { sendEmail, createEmailService, type EmailData, type EmailServiceConfig } from '../email-service';

// Mock console.log to capture email output
const mockConsoleLog = vi.spyOn(console, 'log').mockImplementation(() => {});

describe('Email Service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('sendEmail', () => {
    it('should log email verification template correctly', async () => {
      const emailData: EmailData = {
        to: 'test@example.com',
        subject: 'Verify your email',
        template: 'email-verification',
        data: {
          name: 'John Doe',
          verificationUrl: 'http://localhost:3000/verify?token=abc123',
          token: 'abc123',
          language: 'fr',
          messages: {
            success: 'Registration successful',
          },
        },
      };

      await sendEmail(emailData);

      expect(mockConsoleLog).toHaveBeenCalledWith('=== EMAIL SERVICE ===');
      expect(mockConsoleLog).toHaveBeenCalledWith('To:', 'test@example.com');
      expect(mockConsoleLog).toHaveBeenCalledWith('Subject:', 'Verify your email');
      expect(mockConsoleLog).toHaveBeenCalledWith('Template:', 'email-verification');
      expect(mockConsoleLog).toHaveBeenCalledWith('Language:', 'fr');
      expect(mockConsoleLog).toHaveBeenCalledWith('\n=== EMAIL VERIFICATION TEMPLATE ===');
      expect(mockConsoleLog).toHaveBeenCalledWith(expect.stringContaining('Bonjour John Doe'));
      expect(mockConsoleLog).toHaveBeenCalledWith(expect.stringContaining('http://localhost:3000/verify?token=abc123'));
      expect(mockConsoleLog).toHaveBeenCalledWith(expect.stringContaining('abc123'));
      expect(mockConsoleLog).toHaveBeenCalledWith('=== END EMAIL ===\n');
    });

    it('should log password reset template correctly', async () => {
      const emailData: EmailData = {
        to: 'user@example.com',
        subject: 'Reset your password',
        template: 'password-reset',
        data: {
          name: 'Jane Smith',
          resetUrl: 'http://localhost:3000/reset?token=def456',
          token: 'def456',
          language: 'ar',
          messages: {
            emailSent: 'Reset email sent',
          },
        },
      };

      await sendEmail(emailData);

      expect(mockConsoleLog).toHaveBeenCalledWith('=== EMAIL SERVICE ===');
      expect(mockConsoleLog).toHaveBeenCalledWith('To:', 'user@example.com');
      expect(mockConsoleLog).toHaveBeenCalledWith('Subject:', 'Reset your password');
      expect(mockConsoleLog).toHaveBeenCalledWith('Template:', 'password-reset');
      expect(mockConsoleLog).toHaveBeenCalledWith('Language:', 'ar');
      expect(mockConsoleLog).toHaveBeenCalledWith('\n=== PASSWORD RESET TEMPLATE ===');
      expect(mockConsoleLog).toHaveBeenCalledWith(expect.stringContaining('مرحبا Jane Smith'));
      expect(mockConsoleLog).toHaveBeenCalledWith(expect.stringContaining('http://localhost:3000/reset?token=def456'));
      expect(mockConsoleLog).toHaveBeenCalledWith(expect.stringContaining('def456'));
      expect(mockConsoleLog).toHaveBeenCalledWith('=== END EMAIL ===\n');
    });

    it('should handle unknown template types', async () => {
      const emailData: EmailData = {
        to: 'test@example.com',
        subject: 'Unknown template',
        template: 'unknown-template',
        data: {
          language: 'fr',
          messages: {},
        },
      };

      await sendEmail(emailData);

      expect(mockConsoleLog).toHaveBeenCalledWith('=== EMAIL SERVICE ===');
      expect(mockConsoleLog).toHaveBeenCalledWith('Template:', 'unknown-template');
      expect(mockConsoleLog).toHaveBeenCalledWith('=== END EMAIL ===\n');
      
      // Should not log specific template content for unknown templates
      expect(mockConsoleLog).not.toHaveBeenCalledWith(expect.stringContaining('=== EMAIL VERIFICATION TEMPLATE ==='));
      expect(mockConsoleLog).not.toHaveBeenCalledWith(expect.stringContaining('=== PASSWORD RESET TEMPLATE ==='));
    });

    it('should resolve successfully', async () => {
      const emailData: EmailData = {
        to: 'test@example.com',
        subject: 'Test email',
        template: 'test-template',
        data: {
          language: 'fr',
          messages: {},
        },
      };

      await expect(sendEmail(emailData)).resolves.toBeUndefined();
    });

    it('should log all provided data', async () => {
      const emailData: EmailData = {
        to: 'test@example.com',
        subject: 'Test email',
        template: 'email-verification',
        data: {
          name: 'Test User',
          verificationUrl: 'http://localhost:3000/verify',
          token: 'test-token',
          language: 'fr',
          messages: {
            success: 'Success message',
            error: 'Error message',
          },
        },
      };

      await sendEmail(emailData);

      expect(mockConsoleLog).toHaveBeenCalledWith('Data:', JSON.stringify(emailData.data, null, 2));
    });
    
    it('should support welcome template in French', async () => {
      const emailData: EmailData = {
        to: 'test@example.com',
        subject: 'Welcome',
        template: 'welcome',
        data: {
          name: 'New User',
          language: 'fr',
          messages: {},
        },
      };

      await sendEmail(emailData);

      expect(mockConsoleLog).toHaveBeenCalledWith('\n=== WELCOME TEMPLATE ===');
      expect(mockConsoleLog).toHaveBeenCalledWith(expect.stringContaining('Bonjour New User'));
      expect(mockConsoleLog).toHaveBeenCalledWith(expect.stringContaining('Bienvenue sur la plateforme Mounasabet'));
    });
    
    it('should support welcome template in Arabic', async () => {
      const emailData: EmailData = {
        to: 'test@example.com',
        subject: 'Welcome',
        template: 'welcome',
        data: {
          name: 'New User',
          language: 'ar',
          messages: {},
        },
      };

      await sendEmail(emailData);

      expect(mockConsoleLog).toHaveBeenCalledWith('\n=== WELCOME TEMPLATE ===');
      expect(mockConsoleLog).toHaveBeenCalledWith(expect.stringContaining('مرحبا New User'));
      expect(mockConsoleLog).toHaveBeenCalledWith(expect.stringContaining('مرحبًا بك في منصة مناسبات'));
    });
  });

  describe('createEmailService', () => {
    it('should create email service with sendgrid provider', () => {
      const config: EmailServiceConfig = {
        provider: 'sendgrid',
        apiKey: 'test-api-key',
        templates: {
          'email-verification': {
            fr: {
              subject: 'Vérifiez votre email',
              html: '<p>Bonjour {{name}}</p>',
              text: 'Bonjour {{name}}',
            },
            ar: {
              subject: 'تأكيد البريد الإلكتروني',
              html: '<p>مرحبا {{name}}</p>',
              text: 'مرحبا {{name}}',
            },
          },
        },
      };

      const emailService = createEmailService(config);
      expect(emailService).toBeDefined();
      expect(typeof emailService.sendEmail).toBe('function');
      expect(typeof emailService.getTemplates).toBe('function');
      expect(typeof emailService.getTemplateLanguages).toBe('function');
    });

    it('should create email service with SES provider', () => {
      const config: EmailServiceConfig = {
        provider: 'ses',
        apiKey: 'test-aws-key',
        templates: {
          'password-reset': {
            fr: {
              subject: 'Réinitialisation du mot de passe',
              html: '<p>Réinitialisez votre mot de passe</p>',
              text: 'Réinitialisez votre mot de passe',
            },
            ar: {
              subject: 'إعادة تعيين كلمة المرور',
              html: '<p>إعادة تعيين كلمة المرور</p>',
              text: 'إعادة تعيين كلمة المرور',
            },
          },
        },
      };

      const emailService = createEmailService(config);
      expect(emailService).toBeDefined();
      expect(typeof emailService.sendEmail).toBe('function');
    });

    it('should create email service with SMTP provider', () => {
      const config: EmailServiceConfig = {
        provider: 'smtp',
        smtpConfig: {
          host: 'smtp.example.com',
          port: 587,
          secure: false,
          auth: {
            user: 'test@example.com',
            pass: 'password',
          },
        },
        templates: {
          'email-verification': {
            fr: {
              subject: 'Vérification email',
              html: '<p>Vérifiez votre email</p>',
              text: 'Vérifiez votre email',
            },
            ar: {
              subject: 'تأكيد البريد',
              html: '<p>تأكيد البريد</p>',
              text: 'تأكيد البريد',
            },
          },
        },
      };

      const emailService = createEmailService(config);
      expect(emailService).toBeDefined();
      expect(typeof emailService.sendEmail).toBe('function');
    });

    it('should use the underlying sendEmail function', async () => {
      const config: EmailServiceConfig = {
        provider: 'sendgrid',
        apiKey: 'test-key',
        templates: {},
      };

      const emailService = createEmailService(config);
      const emailData: EmailData = {
        to: 'test@example.com',
        subject: 'Test',
        template: 'test',
        data: {
          language: 'fr',
          messages: {},
        },
      };

      await expect(emailService.sendEmail(emailData)).resolves.toBeUndefined();
      expect(mockConsoleLog).toHaveBeenCalledWith('=== EMAIL SERVICE ===');
    });
    
    it('should throw error if provider is not specified', () => {
      const config = {
        templates: {},
      } as EmailServiceConfig;
      
      expect(() => createEmailService(config)).toThrow('Email service provider is required');
    });
    
    it('should throw error if templates are not specified', () => {
      const config = {
        provider: 'sendgrid',
        apiKey: 'test-key',
      } as EmailServiceConfig;
      
      expect(() => createEmailService(config)).toThrow('Email templates are required');
    });
    
    it('should throw error if SendGrid API key is missing', () => {
      const config = {
        provider: 'sendgrid',
        templates: {},
      } as EmailServiceConfig;
      
      expect(() => createEmailService(config)).toThrow('SendGrid API key is required');
    });
    
    it('should throw error if SES credentials are missing', () => {
      const config = {
        provider: 'ses',
        templates: {},
      } as EmailServiceConfig;
      
      expect(() => createEmailService(config)).toThrow('AWS SES credentials are required');
    });
    
    it('should throw error if SMTP config is missing', () => {
      const config = {
        provider: 'smtp',
        templates: {},
      } as EmailServiceConfig;
      
      expect(() => createEmailService(config)).toThrow('SMTP configuration is required');
    });
    
    it('should get available templates', () => {
      const config: EmailServiceConfig = {
        provider: 'sendgrid',
        apiKey: 'test-key',
        templates: {
          'email-verification': {
            fr: {
              subject: 'Vérifiez votre email',
              html: '<p>Bonjour {{name}}</p>',
              text: 'Bonjour {{name}}',
            },
            ar: {
              subject: 'تأكيد البريد الإلكتروني',
              html: '<p>مرحبا {{name}}</p>',
              text: 'مرحبا {{name}}',
            },
          },
          'password-reset': {
            fr: {
              subject: 'Réinitialisation du mot de passe',
              html: '<p>Réinitialisez votre mot de passe</p>',
              text: 'Réinitialisez votre mot de passe',
            },
            ar: {
              subject: 'إعادة تعيين كلمة المرور',
              html: '<p>إعادة تعيين كلمة المرور</p>',
              text: 'إعادة تعيين كلمة المرور',
            },
          },
        },
      };

      const emailService = createEmailService(config);
      const templates = emailService.getTemplates();
      
      expect(templates).toEqual(['email-verification', 'password-reset']);
    });
    
    it('should get available languages for a template', () => {
      const config: EmailServiceConfig = {
        provider: 'sendgrid',
        apiKey: 'test-key',
        templates: {
          'email-verification': {
            fr: {
              subject: 'Vérifiez votre email',
              html: '<p>Bonjour {{name}}</p>',
              text: 'Bonjour {{name}}',
            },
            ar: {
              subject: 'تأكيد البريد الإلكتروني',
              html: '<p>مرحبا {{name}}</p>',
              text: 'مرحبا {{name}}',
            },
          },
        },
      };

      const emailService = createEmailService(config);
      const languages = emailService.getTemplateLanguages('email-verification');
      
      expect(languages).toEqual(['fr', 'ar']);
    });
    
    it('should return empty array for non-existent template', () => {
      const config: EmailServiceConfig = {
        provider: 'sendgrid',
        apiKey: 'test-key',
        templates: {},
      };

      const emailService = createEmailService(config);
      const languages = emailService.getTemplateLanguages('non-existent');
      
      expect(languages).toEqual([]);
    });
  });

  describe('EmailServiceConfig interface', () => {
    it('should support all required provider types', () => {
      const providers: EmailServiceConfig['provider'][] = ['sendgrid', 'ses', 'smtp'];
      
      providers.forEach(provider => {
        const config: EmailServiceConfig = {
          provider,
          templates: {},
        };
        expect(config.provider).toBe(provider);
      });
    });

    it('should support multi-language templates', () => {
      const config: EmailServiceConfig = {
        provider: 'sendgrid',
        templates: {
          'welcome': {
            fr: {
              subject: 'Bienvenue',
              html: '<h1>Bienvenue</h1>',
              text: 'Bienvenue',
            },
            ar: {
              subject: 'أهلا وسهلا',
              html: '<h1>أهلا وسهلا</h1>',
              text: 'أهلا وسهلا',
            },
          },
        },
      };

      expect(config.templates.welcome.fr.subject).toBe('Bienvenue');
      expect(config.templates.welcome.ar.subject).toBe('أهلا وسهلا');
    });
    
    it('should support enhanced configuration options', () => {
      const config: EmailServiceConfig = {
        provider: 'sendgrid',
        apiKey: 'test-key',
        defaultFrom: 'noreply@mounasabet.com',
        replyTo: 'support@mounasabet.com',
        templates: {},
        options: {
          trackOpens: true,
          trackClicks: true,
          retryCount: 3,
          retryDelay: 1000,
          timeout: 5000,
        },
      };
      
      expect(config.defaultFrom).toBe('noreply@mounasabet.com');
      expect(config.replyTo).toBe('support@mounasabet.com');
      expect(config.options?.trackOpens).toBe(true);
      expect(config.options?.trackClicks).toBe(true);
      expect(config.options?.retryCount).toBe(3);
      expect(config.options?.retryDelay).toBe(1000);
      expect(config.options?.timeout).toBe(5000);
    });
  });
});