import { hash, compare, genSalt } from 'bcryptjs';

export class PasswordUtils {
  private static readonly SALT_ROUNDS = 12;

  /**
   * Hash a password using bcrypt
   */
  static async hashPassword(password: string): Promise<string> {
    const salt = await genSalt(this.SALT_ROUNDS);
    return hash(password, salt);
  }

  /**
   * Verify a password against a hash
   */
  static async verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
    return compare(password, hashedPassword);
  }

  /**
   * Validate password strength
   */
  static validatePassword(password: string): {
    isValid: boolean;
    score: number;
    feedback: string[];
  } {
    const feedback: string[] = [];
    let score = 0;

    // Length check (8-100 characters)
    if (password.length < 8) {
      feedback.push('Password must be at least 8 characters long');
    } else if (password.length > 100) {
      feedback.push('Password must be no more than 100 characters long');
    } else if (password.length >= 12) {
      score += 2;
    } else {
      score += 1;
    }

    // Character variety checks
    if (!/[a-z]/.test(password)) {
      feedback.push('Include at least one lowercase letter');
    } else {
      score += 1;
    }

    if (!/[A-Z]/.test(password)) {
      feedback.push('Include at least one uppercase letter');
    } else {
      score += 1;
    }

    if (!/\d/.test(password)) {
      feedback.push('Include at least one number');
    } else {
      score += 1;
    }

    if (!/[@$!%*?&]/.test(password)) {
      feedback.push('Include at least one special character (@$!%*?&)');
    } else {
      score += 1;
    }

    // Check for common patterns
    if (/(.)\1{2,}/.test(password)) {
      feedback.push('Avoid repeated characters');
      score -= 1;
    }

    if (/123|abc|qwe|password|admin/i.test(password)) {
      feedback.push('Avoid common patterns');
      score -= 1;
    }

    const isValid = feedback.length === 0 && score >= 4;

    return {
      isValid,
      score: Math.max(0, Math.min(5, score)),
      feedback,
    };
  }
}
