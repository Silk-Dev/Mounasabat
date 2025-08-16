import { describe, it, expect, beforeEach } from '@jest/globals';
import { z } from 'zod';
import {
  SecurityValidator,
  validateRequestBody,
  validateQueryParams,
  sanitizeString,
  createSafeStringSchema,
  createSafeTextSchema,
  CommonSchemas,
  ValidationPatterns,
} from '../lib/input-validation';

describe('SecurityValidator', () => {
  describe('validateInput', () => {
    it('should detect XSS attempts', () => {
      const xssAttempts = [
        '<script>alert("xss")</script>',
        'javascript:alert("xss")',
        '<img src="x" onerror="alert(1)">',
        '<iframe src="javascript:alert(1)"></iframe>',
        'on load="alert(1)"',
        'data:text/html,<script>alert(1)</script>',
      ];

      xssAttempts.forEach(attempt => {
        expect(SecurityValidator.validateInput(attempt, 'html')).toBe(false);
        expect(SecurityValidator.validateInput(attempt, 'general')).toBe(false);
      });
    });

    it('should detect SQL injection attempts', () => {
      const sqlAttempts = [
        "'; DROP TABLE users; --",
        "1' OR '1'='1",
        "UNION SELECT * FROM users",
        "'; INSERT INTO users VALUES ('hacker', 'password'); --",
        "1; EXEC xp_cmdshell('dir'); --",
        "' OR 1=1 --",
      ];

      sqlAttempts.forEach(attempt => {
        expect(SecurityValidator.validateInput(attempt, 'sql')).toBe(false);
        expect(SecurityValidator.validateInput(attempt, 'general')).toBe(false);
      });
    });

    it('should detect command injection attempts', () => {
      const commandAttempts = [
        '; cat /etc/passwd',
        '| whoami',
        '&& rm -rf /',
        '`id`',
        '$(whoami)',
        '../../../etc/passwd',
      ];

      commandAttempts.forEach(attempt => {
        expect(SecurityValidator.validateInput(attempt, 'command')).toBe(false);
        expect(SecurityValidator.validateInput(attempt, 'general')).toBe(false);
      });
    });

    it('should detect path traversal attempts', () => {
      const pathAttempts = [
        '../../../etc/passwd',
        '..\\..\\..\\windows\\system32\\config\\sam',
        '%2e%2e%2f%2e%2e%2f%2e%2e%2fetc%2fpasswd',
        '....//....//....//etc/passwd',
      ];

      pathAttempts.forEach(attempt => {
        expect(SecurityValidator.validateInput(attempt, 'path')).toBe(false);
        expect(SecurityValidator.validateInput(attempt, 'general')).toBe(false);
      });
    });

    it('should allow safe inputs', () => {
      const safeInputs = [
        'Hello World',
        'user@example.com',
        'This is a normal text with numbers 123',
        'Product Name - Special Edition',
        'Valid description with punctuation!',
      ];

      safeInputs.forEach(input => {
        expect(SecurityValidator.validateInput(input, 'general')).toBe(true);
      });
    });
  });

  describe('sanitizeInput', () => {
    it('should sanitize XSS attempts', () => {
      const input = '<script>alert("xss")</script>Hello World';
      const sanitized = SecurityValidator.sanitizeInput(input, 'html');
      
      expect(sanitized).not.toContain('<script>');
      expect(sanitized).not.toContain('alert');
      expect(sanitized).toContain('Hello World');
    });

    it('should sanitize SQL injection attempts', () => {
      const input = "'; DROP TABLE users; -- Hello";
      const sanitized = SecurityValidator.sanitizeInput(input, 'sql');
      
      expect(sanitized).not.toContain('DROP TABLE');
      expect(sanitized).not.toContain('--');
      expect(sanitized).toContain('Hello');
    });

    it('should preserve safe content', () => {
      const input = 'Hello World 123!';
      const sanitized = SecurityValidator.sanitizeInput(input, 'general');
      
      expect(sanitized).toBe('Hello World 123!');
    });
  });

  describe('validateEmail', () => {
    it('should validate correct email addresses', () => {
      const validEmails = [
        'user@example.com',
        'test.email+tag@domain.co.uk',
        'user123@test-domain.org',
      ];

      validEmails.forEach(email => {
        expect(SecurityValidator.validateEmail(email)).toBe(true);
      });
    });

    it('should reject invalid email addresses', () => {
      const invalidEmails = [
        'invalid-email',
        '@domain.com',
        'user@',
        'user@domain',
        '<script>alert(1)</script>@domain.com',
        'user@domain.com<script>',
      ];

      invalidEmails.forEach(email => {
        expect(SecurityValidator.validateEmail(email)).toBe(false);
      });
    });
  });

  describe('validateUrl', () => {
    it('should validate correct URLs', () => {
      const validUrls = [
        'https://example.com',
        'http://test.domain.org/path',
        'https://subdomain.example.com:8080/path?query=value',
      ];

      validUrls.forEach(url => {
        expect(SecurityValidator.validateUrl(url)).toBe(true);
      });
    });

    it('should reject invalid or dangerous URLs', () => {
      const invalidUrls = [
        'javascript:alert(1)',
        'data:text/html,<script>alert(1)</script>',
        'file:///etc/passwd',
        'ftp://example.com',
        'not-a-url',
      ];

      invalidUrls.forEach(url => {
        expect(SecurityValidator.validateUrl(url)).toBe(false);
      });
    });
  });

  describe('validatePhoneNumber', () => {
    it('should validate correct phone numbers', () => {
      const validPhones = [
        '+1234567890',
        '1234567890',
        '+44 20 7946 0958',
        '+33 1 42 86 83 26',
      ];

      validPhones.forEach(phone => {
        expect(SecurityValidator.validatePhoneNumber(phone)).toBe(true);
      });
    });

    it('should reject invalid phone numbers', () => {
      const invalidPhones = [
        'abc123',
        '123',
        '+',
        '++1234567890',
        '123-456-7890<script>',
      ];

      invalidPhones.forEach(phone => {
        expect(SecurityValidator.validatePhoneNumber(phone)).toBe(false);
      });
    });
  });

  describe('validateUuid', () => {
    it('should validate correct UUIDs', () => {
      const validUuids = [
        '123e4567-e89b-12d3-a456-426614174000',
        'f47ac10b-58cc-4372-a567-0e02b2c3d479',
        '6ba7b810-9dad-11d1-80b4-00c04fd430c8',
      ];

      validUuids.forEach(uuid => {
        expect(SecurityValidator.validateUuid(uuid)).toBe(true);
      });
    });

    it('should reject invalid UUIDs', () => {
      const invalidUuids = [
        'not-a-uuid',
        '123e4567-e89b-12d3-a456',
        '123e4567-e89b-12d3-a456-426614174000-extra',
        'xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx',
      ];

      invalidUuids.forEach(uuid => {
        expect(SecurityValidator.validateUuid(uuid)).toBe(false);
      });
    });
  });
});

describe('sanitizeString', () => {
  it('should sanitize HTML by default', () => {
    const input = '<script>alert("xss")</script>Hello';
    const result = sanitizeString(input);
    
    expect(result).not.toContain('<script>');
    expect(result).toContain('Hello');
  });

  it('should respect maxLength option', () => {
    const input = 'This is a very long string that should be truncated';
    const result = sanitizeString(input, { maxLength: 10 });
    
    expect(result.length).toBeLessThanOrEqual(10);
  });

  it('should validate against pattern', () => {
    const input = 'Hello123!';
    const pattern = /^[a-zA-Z0-9]+$/;
    
    expect(() => sanitizeString(input, { pattern })).toThrow();
  });

  it('should allow HTML when specified', () => {
    const input = '<b>Bold text</b>';
    const result = sanitizeString(input, { allowHtml: true });
    
    expect(result).toContain('<b>');
    expect(result).toContain('</b>');
  });
});

describe('createSafeStringSchema', () => {
  it('should create a schema with length constraints', () => {
    const schema = createSafeStringSchema(5, 20);
    
    expect(() => schema.parse('Hi')).toThrow(); // Too short
    expect(() => schema.parse('This is a very long string that exceeds the limit')).toThrow(); // Too long
    expect(schema.parse('Valid string')).toBe('Valid string');
  });

  it('should sanitize input', () => {
    const schema = createSafeStringSchema(1, 100);
    const input = '<script>alert("xss")</script>Hello';
    const result = schema.parse(input);
    
    expect(result).not.toContain('<script>');
    expect(result).toContain('Hello');
  });
});

describe('validateRequestBody', () => {
  const testSchema = z.object({
    name: z.string().min(1),
    email: z.string().email(),
    age: z.number().min(0),
  });

  it('should validate correct data', () => {
    const validData = {
      name: 'John Doe',
      email: 'john@example.com',
      age: 30,
    };

    const result = validateRequestBody(validData, testSchema);
    expect(result).toEqual(validData);
  });

  it('should reject invalid data', () => {
    const invalidData = {
      name: '',
      email: 'invalid-email',
      age: -5,
    };

    expect(() => validateRequestBody(invalidData, testSchema)).toThrow();
  });

  it('should respect maxSize option', () => {
    const largeData = {
      name: 'John Doe',
      email: 'john@example.com',
      age: 30,
    };

    expect(() => validateRequestBody(largeData, testSchema, { maxSize: 10 })).toThrow();
  });

  it('should sanitize inputs when enabled', () => {
    const dataWithXSS = {
      name: '<script>alert("xss")</script>John',
      email: 'john@example.com',
      age: 30,
    };

    const result = validateRequestBody(dataWithXSS, testSchema, { sanitize: true });
    expect(result.name).not.toContain('<script>');
    expect(result.name).toContain('John');
  });
});

describe('validateQueryParams', () => {
  const querySchema = z.object({
    page: z.string().transform(val => parseInt(val) || 1),
    limit: z.string().transform(val => parseInt(val) || 10),
    search: z.string().optional(),
  });

  it('should validate query parameters', () => {
    const searchParams = new URLSearchParams('page=2&limit=20&search=test');
    const result = validateQueryParams(searchParams, querySchema);
    
    expect(result.page).toBe(2);
    expect(result.limit).toBe(20);
    expect(result.search).toBe('test');
  });

  it('should handle missing optional parameters', () => {
    const searchParams = new URLSearchParams('page=1&limit=10');
    const result = validateQueryParams(searchParams, querySchema);
    
    expect(result.page).toBe(1);
    expect(result.limit).toBe(10);
    expect(result.search).toBeUndefined();
  });
});

describe('CommonSchemas', () => {
  describe('uuid', () => {
    it('should validate UUIDs', () => {
      const validUuid = '123e4567-e89b-12d3-a456-426614174000';
      expect(CommonSchemas.uuid.parse(validUuid)).toBe(validUuid);
      
      expect(() => CommonSchemas.uuid.parse('invalid-uuid')).toThrow();
    });
  });

  describe('email', () => {
    it('should validate and normalize emails', () => {
      const email = 'USER@EXAMPLE.COM';
      expect(CommonSchemas.email.parse(email)).toBe('user@example.com');
      
      expect(() => CommonSchemas.email.parse('invalid-email')).toThrow();
    });
  });

  describe('pagination', () => {
    it('should parse pagination parameters', () => {
      const params = { page: '2', limit: '50' };
      const result = CommonSchemas.pagination.parse(params);
      
      expect(result.page).toBe(2);
      expect(result.limit).toBe(50);
    });

    it('should handle invalid pagination parameters', () => {
      const params = { page: 'invalid', limit: '200' };
      const result = CommonSchemas.pagination.parse(params);
      
      expect(result.page).toBe(1); // Default
      expect(result.limit).toBe(100); // Max limit
    });
  });
});

describe('ValidationPatterns', () => {
  it('should have correct UUID pattern', () => {
    const validUuid = '123e4567-e89b-12d3-a456-426614174000';
    const invalidUuid = 'not-a-uuid';
    
    expect(ValidationPatterns.UUID.test(validUuid)).toBe(true);
    expect(ValidationPatterns.UUID.test(invalidUuid)).toBe(false);
  });

  it('should have correct email pattern', () => {
    const validEmail = 'user@example.com';
    const invalidEmail = 'invalid-email';
    
    expect(ValidationPatterns.EMAIL.test(validEmail)).toBe(true);
    expect(ValidationPatterns.EMAIL.test(invalidEmail)).toBe(false);
  });

  it('should have correct phone pattern', () => {
    const validPhone = '+1234567890';
    const invalidPhone = 'abc123';
    
    expect(ValidationPatterns.PHONE.test(validPhone)).toBe(true);
    expect(ValidationPatterns.PHONE.test(invalidPhone)).toBe(false);
  });

  it('should have correct URL pattern', () => {
    const validUrl = 'https://example.com';
    const invalidUrl = 'not-a-url';
    
    expect(ValidationPatterns.URL.test(validUrl)).toBe(true);
    expect(ValidationPatterns.URL.test(invalidUrl)).toBe(false);
  });
});

describe('Edge Cases and Security', () => {
  it('should handle null and undefined inputs safely', () => {
    expect(SecurityValidator.validateInput(null as any)).toBe(false);
    expect(SecurityValidator.validateInput(undefined as any)).toBe(false);
    expect(SecurityValidator.sanitizeInput(null as any)).toBe('');
    expect(SecurityValidator.sanitizeInput(undefined as any)).toBe('');
  });

  it('should handle non-string inputs safely', () => {
    expect(SecurityValidator.validateInput(123 as any)).toBe(false);
    expect(SecurityValidator.validateInput({} as any)).toBe(false);
    expect(SecurityValidator.validateInput([] as any)).toBe(false);
  });

  it('should handle very long inputs', () => {
    const longInput = 'a'.repeat(10000);
    const result = SecurityValidator.sanitizeInput(longInput);
    expect(typeof result).toBe('string');
    expect(result.length).toBeLessThanOrEqual(longInput.length);
  });

  it('should handle unicode and special characters safely', () => {
    const unicodeInput = 'Hello 世界 🌍 café';
    expect(SecurityValidator.validateInput(unicodeInput, 'general')).toBe(true);
    
    const sanitized = SecurityValidator.sanitizeInput(unicodeInput, 'general');
    expect(sanitized).toContain('Hello');
    expect(sanitized).toContain('世界');
    expect(sanitized).toContain('🌍');
  });

  it('should prevent bypass attempts', () => {
    const bypassAttempts = [
      'java\0script:alert(1)',
      'java\tscript:alert(1)',
      'java\nscript:alert(1)',
      'java\rscript:alert(1)',
      'SCRIPT>alert(1)</SCRIPT',
      'sCrIpT>alert(1)</ScRiPt',
    ];

    bypassAttempts.forEach(attempt => {
      expect(SecurityValidator.validateInput(attempt, 'html')).toBe(false);
    });
  });
});