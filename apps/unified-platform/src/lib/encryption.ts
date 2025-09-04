import { logger } from './logger';

// Encryption configuration
const KEY_LENGTH = 32;
const IV_LENGTH = 16;
const SALT_LENGTH = 32;
const TAG_LENGTH = 16;

// Web Crypto API helpers
const textEncoder = new TextEncoder();
const textDecoder = new TextDecoder();

export class DataEncryption {
  private static encryptionKey: CryptoKey | null = null;

  // Initialize encryption key from environment
  private static async getEncryptionKey(): Promise<CryptoKey> {
    if (this.encryptionKey) {
      return this.encryptionKey;
    }

    const masterKey = process.env.ENCRYPTION_MASTER_KEY;
    if (!masterKey) {
      throw new Error('ENCRYPTION_MASTER_KEY environment variable is required');
    }

    // Derive key using PBKDF2
    const salt = process.env.ENCRYPTION_SALT || 'default-salt';
    const keyMaterial = await crypto.subtle.importKey(
      'raw',
      textEncoder.encode(masterKey),
      'PBKDF2',
      false,
      ['deriveBits', 'deriveKey']
    );

    this.encryptionKey = await crypto.subtle.deriveKey(
      {
        name: 'PBKDF2',
        salt: textEncoder.encode(salt),
        iterations: 100000,
        hash: 'SHA-256'
      },
      keyMaterial,
      { name: 'AES-GCM', length: 256 },
      false,
      ['encrypt', 'decrypt']
    );
    
    return this.encryptionKey;
  }

  // Encrypt sensitive data
  static async encrypt(plaintext: string): Promise<string> {
    try {
      const key = await this.getEncryptionKey();
      const iv = crypto.getRandomValues(new Uint8Array(IV_LENGTH));
      const aad = textEncoder.encode('mounasabet-platform');
      
      const encrypted = await crypto.subtle.encrypt(
        {
          name: 'AES-GCM',
          iv,
          additionalData: aad,
          tagLength: TAG_LENGTH * 8
        },
        key,
        textEncoder.encode(plaintext)
      );

      // Combine IV and encrypted data
      const result = new Uint8Array(iv.length + encrypted.byteLength);
      result.set(iv);
      result.set(new Uint8Array(encrypted), iv.length);
      
      // Convert to base64 using array buffer
      return btoa(
        Array.from(result)
          .map(byte => String.fromCharCode(byte))
          .join('')
      );
    } catch (error) {
      logger.error('Encryption error:', error);
      throw new Error('Failed to encrypt data');
    }
  }

  // Decrypt sensitive data
  static async decrypt(encryptedData: string): Promise<string> {
    try {
      const key = await this.getEncryptionKey();
      const data = new Uint8Array(
        atob(encryptedData).split('').map(char => char.charCodeAt(0))
      );
      
      const iv = data.slice(0, IV_LENGTH);
      const encrypted = data.slice(IV_LENGTH);
      const aad = textEncoder.encode('mounasabet-platform');
      
      const decrypted = await crypto.subtle.decrypt(
        {
          name: 'AES-GCM',
          iv,
          additionalData: aad,
          tagLength: TAG_LENGTH * 8
        },
        key,
        encrypted
      );
      
      return textDecoder.decode(decrypted);
    } catch (error) {
      logger.error('Decryption error:', error);
      throw new Error('Failed to decrypt data');
    }
  }

  // Hash sensitive data (one-way)
  static async hash(data: string, salt?: string): Promise<string> {
    const generateSalt = (): string => {
      const array = new Uint8Array(SALT_LENGTH);
      crypto.getRandomValues(array);
      return Array.from(array)
        .map(b => b.toString(16).padStart(2, '0'))
        .join('');
    };

    const actualSalt = salt || generateSalt();
    const encoder = new TextEncoder();
    const hashBuffer = await crypto.subtle.digest(
      'SHA-256',
      encoder.encode(data + actualSalt)
    );
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');
    
    return `${actualSalt}:${hashHex}`;
  }

  // Verify hashed data
  static async verifyHash(data: string, hashedData: string): Promise<boolean> {
    try {
      const [salt, hash] = hashedData.split(':');
      const newHash = await this.hash(data, salt);
      return newHash === hashedData;
    } catch {
      return false;
    }
  }

  // Generate secure random token
  static generateSecureToken(length: number = 32): string {
    const array = new Uint8Array(length);
    crypto.getRandomValues(array);
    return Array.from(array)
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');
  }

  // Encrypt PII (Personally Identifiable Information)
  static async encryptPII(data: {
    email?: string;
    phone?: string;
    address?: string;
    name?: string;
    [key: string]: any;
  }): Promise<{ [key: string]: any }> {
    const encrypted: { [key: string]: any } = { ...data };
    
    // Fields that should be encrypted
    const piiFields = ['email', 'phone', 'address', 'name'];
    
    for (const field of piiFields) {
      if (encrypted[field] && typeof encrypted[field] === 'string') {
        encrypted[field] = await this.encrypt(encrypted[field]);
        encrypted[`${field}_encrypted`] = true;
      }
    }
    
    return encrypted;
  }

  // Decrypt PII
  static async decryptPII(data: {
    [key: string]: any;
  }): Promise<{ [key: string]: any }> {
    const decrypted: { [key: string]: any } = { ...data };
    
    // Fields that might be encrypted
    const piiFields = ['email', 'phone', 'address', 'name'];
    
    for (const field of piiFields) {
      if (decrypted[`${field}_encrypted`] && decrypted[field]) {
        try {
          decrypted[field] = await this.decrypt(decrypted[field]);
          delete decrypted[`${field}_encrypted`];
        } catch (error) {
          logger.error(`Failed to decrypt ${field}:`, error);
          // Keep encrypted value if decryption fails
        }
      }
    }
    
    return decrypted;
  }
}

// Secure session management
export class SecureSession {
  private static readonly SESSION_TIMEOUT = 24 * 60 * 60 * 1000; // 24 hours
  private static readonly REFRESH_THRESHOLD = 2 * 60 * 60 * 1000; // 2 hours

  // Create secure session token
  static async createSessionToken(userId: string, role: string): Promise<{
    token: string;
    expiresAt: Date;
    refreshToken: string;
  }> {
    const sessionData = {
      userId,
      role,
      createdAt: Date.now(),
      expiresAt: Date.now() + this.SESSION_TIMEOUT,
      nonce: DataEncryption.generateSecureToken(16),
    };

    const token = await DataEncryption.encrypt(JSON.stringify(sessionData));
    const refreshToken = DataEncryption.generateSecureToken(32);

    return {
      token,
      expiresAt: new Date(sessionData.expiresAt),
      refreshToken,
    };
  }

  // Validate and decode session token
  static async validateSessionToken(token: string): Promise<{
    userId: string;
    role: string;
    isValid: boolean;
    needsRefresh: boolean;
  } | null> {
    try {
      const decryptedData = await DataEncryption.decrypt(token);
      const sessionData = JSON.parse(decryptedData);

      const now = Date.now();
      const isExpired = now > sessionData.expiresAt;
      const needsRefresh = now > (sessionData.expiresAt - this.REFRESH_THRESHOLD);

      if (isExpired) {
        return null;
      }

      return {
        userId: sessionData.userId,
        role: sessionData.role,
        isValid: true,
        needsRefresh,
      };
    } catch (error) {
      logger.error('Session validation error:', error);
      return null;
    }
  }
}

// Secure file handling
export class SecureFileHandler {
  private static readonly ALLOWED_MIME_TYPES = [
    'image/jpeg',
    'image/png',
    'image/webp',
    'image/gif',
    'application/pdf',
    'text/plain',
  ];

  private static readonly MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

  // Validate file upload
  static validateFile(file: File): {
    isValid: boolean;
    errors: string[];
  } {
    const errors: string[] = [];

    // Check file size
    if (file.size > this.MAX_FILE_SIZE) {
      errors.push(`File size exceeds ${this.MAX_FILE_SIZE / 1024 / 1024}MB limit`);
    }

    // Check MIME type
    if (!this.ALLOWED_MIME_TYPES.includes(file.type)) {
      errors.push(`File type ${file.type} is not allowed`);
    }

    // Check file extension
    const extension = file.name.split('.').pop()?.toLowerCase();
    const allowedExtensions = ['jpg', 'jpeg', 'png', 'webp', 'gif', 'pdf', 'txt'];
    if (!extension || !allowedExtensions.includes(extension)) {
      errors.push('Invalid file extension');
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  // Generate secure filename
  static async generateSecureFilename(originalName: string, userId: string): Promise<string> {
    const extension = originalName.split('.').pop()?.toLowerCase() || '';
    const timestamp = Date.now();
    const random = DataEncryption.generateSecureToken(8);
    
    const userHashBuffer = await crypto.subtle.digest(
      'SHA-256',
      textEncoder.encode(userId)
    );
    const userHash = Array.from(new Uint8Array(userHashBuffer))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('')
      .substring(0, 8);
    
    return `${userHash}_${timestamp}_${random}.${extension}`;
  }
}

// Environment variable validation
export function validateSecurityEnvironment(): {
  isValid: boolean;
  missingVars: string[];
} {
  const requiredVars = [
    'ENCRYPTION_MASTER_KEY',
    'ENCRYPTION_SALT',
    'NEXTAUTH_SECRET',
  ];

  const missingVars = requiredVars.filter(varName => !process.env[varName]);

  return {
    isValid: missingVars.length === 0,
    missingVars,
  };
}
