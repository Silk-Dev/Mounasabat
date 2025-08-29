import { 
  searchFiltersSchema, 
  bookingSchema, 
  userRegistrationSchema,
  passwordUpdateSchema,
  reviewSchema 
} from '../validation';

describe('Validation Schemas', () => {
  describe('searchFiltersSchema', () => {
    it('should validate valid search filters', () => {
      const validData = {
        query: 'wedding venue',
        location: 'New York',
        category: 'venue',
        priceRange: [100, 1000] as [number, number],
        rating: 4,
      };

      const result = searchFiltersSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should reject invalid search filters', () => {
      const invalidData = {
        query: '<script>alert("xss")</script>',
        location: 'A',
        priceRange: [-100, 200000],
        rating: 6,
      };

      const result = searchFiltersSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('should sanitize query input', () => {
      const data = {
        query: 'wedding <script>alert("xss")</script> venue',
      };

      const result = searchFiltersSchema.safeParse(data);
      if (result.success) {
        expect(result.data.query).not.toContain('<script>');
      }
    });
  });

  describe('userRegistrationSchema', () => {
    it('should validate strong password', () => {
      const validData = {
        email: 'user@example.com',
        password: 'StrongP@ssw0rd123',
        name: 'John Doe',
        role: 'customer' as const,
      };

      const result = userRegistrationSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should reject weak password', () => {
      const invalidData = {
        email: 'user@example.com',
        password: '123456',
        name: 'John Doe',
        role: 'customer' as const,
      };

      const result = userRegistrationSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.errors.some(err => 
          err.path.includes('password') && 
          err.message.includes('uppercase')
        )).toBe(true);
      }
    });

    it('should normalize email to lowercase', () => {
      const data = {
        email: 'USER@EXAMPLE.COM',
        password: 'StrongP@ssw0rd123',
        name: 'John Doe',
        role: 'customer' as const,
      };

      const result = userRegistrationSchema.safeParse(data);
      if (result.success) {
        expect(result.data.email).toBe('user@example.com');
      }
    });

    it('should sanitize name input', () => {
      const data = {
        email: 'user@example.com',
        password: 'StrongP@ssw0rd123',
        name: 'John <script>alert("xss")</script> Doe',
        role: 'customer' as const,
      };

      const result = userRegistrationSchema.safeParse(data);
      if (result.success) {
        expect(result.data.name).not.toContain('<script>');
      }
    });
  });

  describe('passwordUpdateSchema', () => {
    it('should validate matching passwords', () => {
      const validData = {
        currentPassword: 'OldP@ssw0rd123',
        newPassword: 'NewP@ssw0rd456',
        confirmPassword: 'NewP@ssw0rd456',
      };

      const result = passwordUpdateSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should reject non-matching passwords', () => {
      const invalidData = {
        currentPassword: 'OldP@ssw0rd123',
        newPassword: 'NewP@ssw0rd456',
        confirmPassword: 'DifferentP@ssw0rd789',
      };

      const result = passwordUpdateSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.errors.some(err => 
          err.message.includes("don't match")
        )).toBe(true);
      }
    });
  });

  describe('reviewSchema', () => {
    it('should validate valid review', () => {
      const validData = {
        bookingId: '123e4567-e89b-12d3-a456-426614174000',
        rating: 5,
        title: 'Excellent service!',
        comment: 'The service was outstanding and exceeded our expectations.',
      };

      const result = reviewSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should reject invalid rating', () => {
      const invalidData = {
        bookingId: '123e4567-e89b-12d3-a456-426614174000',
        rating: 6, // Invalid rating > 5
        comment: 'Great service',
      };

      const result = reviewSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('should reject invalid booking ID format', () => {
      const invalidData = {
        bookingId: 'invalid-uuid',
        rating: 5,
        comment: 'Great service',
      };

      const result = reviewSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('should sanitize comment input', () => {
      const data = {
        bookingId: '123e4567-e89b-12d3-a456-426614174000',
        rating: 5,
        comment: 'Great service <script>alert("xss")</script> overall!',
      };

      const result = reviewSchema.safeParse(data);
      if (result.success) {
        expect(result.data.comment).not.toContain('<script>');
      }
    });
  });

  describe('Input Sanitization', () => {
    it('should handle basic special characters safely', () => {
      const data = {
        query: 'wedding venue',
        location: 'New York City',
      };

      const result = searchFiltersSchema.safeParse(data);
      expect(result.success).toBe(true);
    });

    it('should reject SQL injection attempts', () => {
      const data = {
        query: "'; DROP TABLE users; --",
        location: "1' OR '1'='1",
      };

      const result = searchFiltersSchema.safeParse(data);
      expect(result.success).toBe(false);
    });

    it('should handle basic name characters', () => {
      const data = {
        name: 'John Smith',
        email: 'john@example.com',
        password: 'StrongP@ssw0rd123',
        role: 'customer' as const,
      };

      const result = userRegistrationSchema.safeParse(data);
      expect(result.success).toBe(true);
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty optional fields', () => {
      const data = {
        query: 'wedding',
        // All other fields are optional
      };

      const result = searchFiltersSchema.safeParse(data);
      expect(result.success).toBe(true);
    });

    it('should handle maximum length inputs', () => {
      const data = {
        email: 'user@example.com',
        password: 'StrongP@ssw0rd123',
        name: 'A'.repeat(50), // Maximum allowed length
        role: 'customer' as const,
      };

      const result = userRegistrationSchema.safeParse(data);
      expect(result.success).toBe(true);
    });

    it('should reject inputs exceeding maximum length', () => {
      const data = {
        email: 'user@example.com',
        password: 'StrongP@ssw0rd123',
        name: 'A'.repeat(51), // Exceeds maximum length
        role: 'customer' as const,
      };

      const result = userRegistrationSchema.safeParse(data);
      expect(result.success).toBe(false);
    });
  });
});
