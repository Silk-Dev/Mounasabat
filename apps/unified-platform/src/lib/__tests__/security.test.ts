import { 
  InputSanitizer, 
  PasswordSecurity
} from '../security';

describe('Security Utilities', () => {

  describe('InputSanitizer', () => {
    it('should sanitize HTML content', () => {
      const maliciousHtml = '<script>alert("xss")</script><p>Safe content</p>';
      const sanitized = InputSanitizer.sanitizeHtml(maliciousHtml);
      
      expect(sanitized).not.toContain('<script>');
      expect(sanitized).toContain('<p>Safe content</p>');
    });

    it('should remove SQL injection attempts', () => {
      const maliciousSql = "'; DROP TABLE users; --";
      const sanitized = InputSanitizer.sanitizeSql(maliciousSql);
      
      expect(sanitized).not.toContain("'");
      expect(sanitized).not.toContain('DROP');
      expect(sanitized).not.toContain('--');
    });

    it('should sanitize file paths', () => {
      const maliciousPath = '../../../etc/passwd';
      const sanitized = InputSanitizer.sanitizeFilePath(maliciousPath);
      
      expect(sanitized).not.toContain('../');
      expect(sanitized).toBe('etc/passwd');
    });

    it('should perform general sanitization', () => {
      const maliciousInput = '<script>alert("xss")</script>; DROP TABLE users;';
      const sanitized = InputSanitizer.sanitizeGeneral(maliciousInput);
      
      expect(sanitized).not.toContain('<script>');
      expect(sanitized).not.toContain('DROP');
    });
  });

  describe('PasswordSecurity', () => {
    it('should validate strong passwords', () => {
      const strongPassword = 'StrongP@ssw0rd123';
      const result = PasswordSecurity.validateStrength(strongPassword);
      
      expect(result.isValid).toBe(true);
      expect(result.score).toBeGreaterThan(3);
      expect(result.feedback).toHaveLength(0);
    });

    it('should reject weak passwords', () => {
      const weakPassword = '123456';
      const result = PasswordSecurity.validateStrength(weakPassword);
      
      expect(result.isValid).toBe(false);
      expect(result.score).toBeLessThan(4);
      expect(result.feedback.length).toBeGreaterThan(0);
    });

    it('should provide feedback for password improvements', () => {
      const password = 'password';
      const result = PasswordSecurity.validateStrength(password);
      
      expect(result.feedback).toContain('Password must contain at least one uppercase letter');
      expect(result.feedback).toContain('Password must contain at least one number');
      expect(result.feedback).toContain('Password must contain at least one special character (@$!%*?&)');
    });

    it('should detect common patterns', () => {
      const commonPassword = 'password123';
      const result = PasswordSecurity.validateStrength(commonPassword);
      
      expect(result.feedback).toContain('Password should not contain common patterns');
    });
  });

});
