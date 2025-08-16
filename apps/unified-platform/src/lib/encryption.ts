import { createCipher, createDecipher, randomBytes, scrypt, createHash } from 'crypto';
import { promisify } from 'util';
import { logger } from './production-logger';

const scryptAsync = promisify(scrypt);

// Encryption configuration
const ALGORITHM = 'aes-256-gcm';
const KEY_LENGTH = 32;
const IV_LENGTH = 16;
const SALT_LENGTH = 32;
const TAG_LENGTH = 16;

export class DataEncryption {
  private static encryptionKey: Buffer | null = null;

  // Initialize encryption key from environment
  private static async getEncryptionKey(): Promise<Buffer> {
    if (this.encryptionKey) {
      return this.encryptionKey;
    }

    const masterKey = process.env.ENCRYPTION_MASTER_KEY;
    if (!masterKey) {
      throw new Error('ENCRYPTION_MASTER_KEY environment variable is required');
    }

    // Derive key using scrypt
    const salt = Buffer.from(process.env.ENCRYPTION_SALT || 'default-salt', 'utf8');
    this.encryptionKey = (await scryptAsync(masterKey, salt, KEY_LENGTH)) as Buffer;
    
    return this.encryptionKey;
  }

  // Encrypt sensitive data
  static async encrypt(plaintext: string): Promise<string> {
    try {
      const key = await this.getEncryptionKey();
      const iv = randomBytes(IV_LENGTH);
      
      const cipher = createCipher(ALGORITHM, key);
      cipher.setAAD(Buffer.from('mounasabet-platform', 'utf8'));
      
      let encrypted = cipher.update(plaintext, 'utf8', 'hex');
      encrypted += cipher.final('hex');
      
      const tag = cipher.getAuthTag();
      
      // Combine IV, tag, and encrypted data
      const result = Buffer.concat([iv, tag, Buffer.from(encrypted, 'hex')]);
      return result.toString('base64');
    } catch (error) {
      logger.error('Encryption error:', error);
      throw new Error('Failed to encrypt data');
    }
  }

  // Decrypt sensitive data
  static async decrypt(encryptedData: string): Promise<string> {
    try {
      const key = await this.getEncryptionKey();
      const data = Buffer.from(encryptedData, 'base64');
      
      // Extract IV, tag, and encrypted content
      const iv = data.subarray(0, IV_LENGTH);
      const tag = data.subarray(IV_LENGTH, IV_LENGTH + TAG_LENGTH);
      const encrypted = data.subarray(IV_LENGTH + TAG_LENGTH);
      
      const decipher = createDecipher(ALGORITHM, key);
      decipher.setAuthTag(tag);
      decipher.setAAD(Buffer.from('mounasabet-platform', 'utf8'));
      
      let decrypted = decipher.update(encrypted, undefined, 'utf8');
      decrypted += decipher.final('utf8');
      
      return decrypted;
    } catch (error) {
      logger.error('Decryption error:', error);
      throw new Error('Failed to decrypt data');
    }
  }

  // Hash sensitive data (one-way)
  static hash(data: string, salt?: string): string {
    const actualSalt = salt || randomBytes(SALT_LENGTH).toString('hex');
    const hash = createHash('sha256');
    hash.update(data + actualSalt);
    return `${actualSalt}:${hash.digest('hex')}`;
  }

  // Verify hashed data
  static verifyHash(data: string, hashedData: string): boolean {
    try {
      const [salt, hash] = hashedData.split(':');
      const newHash = this.hash(data, salt);
      return newHash === hashedData;
    } catch {
      return false;
    }
  }

  // Generate secure random token
  static generateSecureToken(length: number = 32): string {
    return randomBytes(length).toString('hex');
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
  static generateSecureFilename(originalName: string, userId: string): string {
    const extension = originalName.split('.').pop()?.toLowerCase() || '';
    const timestamp = Date.now();
    const random = DataEncryption.generateSecureToken(8);
    const userHash = createHash('sha256').update(userId).digest('hex').substring(0, 8);
    
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