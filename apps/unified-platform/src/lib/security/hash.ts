import { createHash } from 'crypto';

/**
 * Create a SHA-256 hash of the input string
 */
export function hash(input: string): string {
  return createHash('sha256').update(input).digest('hex');
}

/**
 * Create a time-safe comparison of two strings
 */
export function safeCompare(a: string, b: string): boolean {
  if (typeof a !== 'string' || typeof b !== 'string') {
    return false;
  }
  
  if (a.length !== b.length) {
    return false;
  }

  return createHash('sha256').update(a).digest('hex') === 
         createHash('sha256').update(b).digest('hex');
}
