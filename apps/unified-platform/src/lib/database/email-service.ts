import { type Language } from '@/lib/utils';

/**
 * Enhanced email data interface with multi-language support
 */
export interface EmailData {
  to: string;
  subject: string;
  template: string;
  data: {
    name?: string;
    verificationUrl?: string;
    resetUrl?: string;
    token?: string;
    language: Language;
    messages: any;
    // Additional fields for enhanced templates
    callToAction?: string;
    expiryTime?: string;
    appName?: string;
    supportEmail?: string;
  };
}

/**
 * Enhanced email service with multi-language support
 * Simulates sending emails with appropriate templates based on language
 */
export async function sendEmail(emailData: EmailData): Promise<void> {
  // For now, we'll log the email content
  // In production, this would integrate with a real email service like SendGrid, AWS SES, etc.
  
  console.log('=== EMAIL SERVICE ===');
  console.log('To:', emailData.to);
  console.log('Subject:', emailData.subject);
  console.log('Template:', emailData.template);
  console.log('Language:', emailData.data.language);
  console.log('Data:', JSON.stringify(emailData.data, null, 2));
  
  // Get localized greeting based on language
  const greeting = emailData.data.language === 'ar' 
    ? `مرحبا ${emailData.data.name || ''}`
    : `Bonjour ${emailData.data.name || ''}`;
  
  // Simulate email templates with multi-language support
  if (emailData.template === 'email-verification') {
    console.log('\n=== EMAIL VERIFICATION TEMPLATE ===');
    console.log(greeting);
    
    if (emailData.data.language === 'ar') {
      console.log(`الرجاء التحقق من بريدك الإلكتروني بالنقر على: ${emailData.data.verificationUrl}`);
      console.log(`رمز التحقق: ${emailData.data.token}`);
      console.log('شكرا لك على التسجيل في منصتنا!');
    } else {
      console.log(`Veuillez vérifier votre email en cliquant sur: ${emailData.data.verificationUrl}`);
      console.log(`Token: ${emailData.data.token}`);
      console.log('Merci de vous être inscrit sur notre plateforme!');
    }
  } else if (emailData.template === 'password-reset') {
    console.log('\n=== PASSWORD RESET TEMPLATE ===');
    console.log(greeting);
    
    if (emailData.data.language === 'ar') {
      console.log(`إعادة تعيين كلمة المرور الخاصة بك بالنقر على: ${emailData.data.resetUrl}`);
      console.log(`رمز إعادة التعيين: ${emailData.data.token}`);
      console.log('إذا لم تطلب إعادة تعيين كلمة المرور، يرجى تجاهل هذا البريد الإلكتروني.');
    } else {
      console.log(`Réinitialisez votre mot de passe en cliquant sur: ${emailData.data.resetUrl}`);
      console.log(`Token: ${emailData.data.token}`);
      console.log('Si vous n\'avez pas demandé de réinitialisation de mot de passe, veuillez ignorer cet email.');
    }
  } else if (emailData.template === 'welcome') {
    console.log('\n=== WELCOME TEMPLATE ===');
    console.log(greeting);
    
    if (emailData.data.language === 'ar') {
      console.log('مرحبًا بك في منصة مناسبات!');
      console.log('نحن سعداء بانضمامك إلينا.');
    } else {
      console.log('Bienvenue sur la plateforme Mounasabet!');
      console.log('Nous sommes ravis de vous compter parmi nous.');
    }
  }
  
  console.log('=== END EMAIL ===\n');
  
  // In a real implementation, you would:
  // 1. Load the appropriate email template based on language
  // 2. Render the template with the provided data
  // 3. Send the email using your preferred service
  // 4. Handle errors and retries
  
  // For now, we'll just resolve successfully
  return Promise.resolve();
}

/**
 * Enhanced email service configuration interface with multi-language support
 */
export interface EmailServiceConfig {
  provider: 'sendgrid' | 'ses' | 'smtp';
  apiKey?: string;
  defaultFrom?: string;
  replyTo?: string;
  smtpConfig?: {
    host: string;
    port: number;
    secure: boolean;
    auth: {
      user: string;
      pass: string;
    };
  };
  templates: {
    [key: string]: {
      [language in Language]: {
        subject: string;
        html: string;
        text: string;
      };
    };
  };
  // Enhanced configuration options
  options?: {
    trackOpens?: boolean;
    trackClicks?: boolean;
    retryCount?: number;
    retryDelay?: number;
    timeout?: number;
  };
}

/**
 * Enhanced email service factory with multi-language support
 */
export function createEmailService(config: EmailServiceConfig) {
  // Validate configuration
  if (!config.provider) {
    throw new Error('Email service provider is required');
  }
  
  if (!config.templates) {
    throw new Error('Email templates are required');
  }
  
  // Provider-specific validation
  if (config.provider === 'sendgrid' && !config.apiKey) {
    throw new Error('SendGrid API key is required');
  }
  
  if (config.provider === 'ses' && !config.apiKey) {
    throw new Error('AWS SES credentials are required');
  }
  
  if (config.provider === 'smtp' && !config.smtpConfig) {
    throw new Error('SMTP configuration is required');
  }
  
  return {
    /**
     * Send email with multi-language support
     */
    sendEmail: async (emailData: EmailData) => {
      // Validate email data
      if (!emailData.to || !emailData.template) {
        throw new Error('Email recipient and template are required');
      }
      
      // Check if template exists for the specified language
      const template = config.templates[emailData.template];
      if (!template) {
        throw new Error(`Template "${emailData.template}" not found`);
      }
      
      const languageTemplate = template[emailData.data.language];
      if (!languageTemplate) {
        // Fall back to French if the requested language is not available
        console.warn(`Template "${emailData.template}" not available in language "${emailData.data.language}", falling back to French`);
        emailData.data.language = 'fr';
      }
      
      // In a real implementation, this would use the appropriate email service
      // For now, use the mock implementation
      return sendEmail(emailData);
    },
    
    /**
     * Get available templates
     */
    getTemplates: () => {
      return Object.keys(config.templates);
    },
    
    /**
     * Get available languages for a template
     */
    getTemplateLanguages: (templateName: string) => {
      const template = config.templates[templateName];
      if (!template) {
        return [];
      }
      
      return Object.keys(template) as Language[];
    },
  };
}