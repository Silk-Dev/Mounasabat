/**
 * Demonstration of the comprehensive input validation and sanitization system
 */

import { SecurityValidator } from './input-validation';
import { ValidationSchemas } from './validation-schemas';
import { logger } from './production-logger';

/**
 * Demo function to show validation capabilities
 */
export function demonstrateValidation() {
  console.log('=== Input Validation and Sanitization Demo ===\n');

  // 1. XSS Protection Demo
  console.log('1. XSS Protection:');
  const xssAttempts = [
    '<script>alert("xss")</script>Hello World',
    'javascript:alert("xss")',
    '<img src="x" onerror="alert(1)">',
    'onclick="alert(1)"',
  ];

  xssAttempts.forEach(attempt => {
    const isValid = SecurityValidator.validateInput(attempt, 'html');
    const sanitized = SecurityValidator.sanitizeInput(attempt, 'html');
    console.log(`  Input: ${attempt}`);
    console.log(`  Valid: ${isValid}`);
    console.log(`  Sanitized: ${sanitized}`);
    console.log('');
  });

  // 2. SQL Injection Protection Demo
  console.log('2. SQL Injection Protection:');
  const sqlAttempts = [
    "'; DROP TABLE users; --",
    "1' OR '1'='1",
    "UNION SELECT * FROM users",
    "admin'--",
  ];

  sqlAttempts.forEach(attempt => {
    const isValid = SecurityValidator.validateInput(attempt, 'sql');
    const sanitized = SecurityValidator.sanitizeInput(attempt, 'sql');
    console.log(`  Input: ${attempt}`);
    console.log(`  Valid: ${isValid}`);
    console.log(`  Sanitized: ${sanitized}`);
    console.log('');
  });

  // 3. Command Injection Protection Demo
  console.log('3. Command Injection Protection:');
  const commandAttempts = [
    '; cat /etc/passwd',
    '| whoami',
    '&& rm -rf /',
    '`id`',
  ];

  commandAttempts.forEach(attempt => {
    const isValid = SecurityValidator.validateInput(attempt, 'command');
    const sanitized = SecurityValidator.sanitizeInput(attempt, 'command');
    console.log(`  Input: ${attempt}`);
    console.log(`  Valid: ${isValid}`);
    console.log(`  Sanitized: ${sanitized}`);
    console.log('');
  });

  // 4. Path Traversal Protection Demo
  console.log('4. Path Traversal Protection:');
  const pathAttempts = [
    '../../../etc/passwd',
    '..\\..\\..\\windows\\system32',
    '%2e%2e%2f%2e%2e%2f%2e%2e%2fetc%2fpasswd',
  ];

  pathAttempts.forEach(attempt => {
    const isValid = SecurityValidator.validateInput(attempt, 'path');
    const sanitized = SecurityValidator.sanitizeInput(attempt, 'path');
    console.log(`  Input: ${attempt}`);
    console.log(`  Valid: ${isValid}`);
    console.log(`  Sanitized: ${sanitized}`);
    console.log('');
  });

  // 5. Email Validation Demo
  console.log('5. Email Validation:');
  const emails = [
    'user@example.com',
    'invalid-email',
    'user@domain.com<script>',
    'test.email+tag@domain.co.uk',
  ];

  emails.forEach(email => {
    const isValid = SecurityValidator.validateEmail(email);
    console.log(`  Email: ${email} - Valid: ${isValid}`);
  });
  console.log('');

  // 6. URL Validation Demo
  console.log('6. URL Validation:');
  const urls = [
    'https://example.com',
    'javascript:alert(1)',
    'data:text/html,<script>alert(1)</script>',
    'http://valid-domain.org/path',
  ];

  urls.forEach(url => {
    const isValid = SecurityValidator.validateUrl(url);
    console.log(`  URL: ${url} - Valid: ${isValid}`);
  });
  console.log('');

  // 7. Schema Validation Demo
  console.log('7. Schema Validation:');
  try {
    const validUserData = {
      email: 'user@example.com',
      password: 'SecurePass123!',
      name: 'John Doe',
      role: 'customer' as const,
      acceptTerms: true,
    };

    const result = ValidationSchemas.userRegistration.parse(validUserData);
    console.log('  Valid user registration data passed validation');
    console.log(`  Parsed result: ${JSON.stringify(result, null, 2)}`);
  } catch (error) {
    console.log(`  Validation failed: ${error}`);
  }

  try {
    const invalidUserData = {
      email: 'invalid-email',
      password: 'weak',
      name: '<script>alert("xss")</script>',
      role: 'invalid' as any,
      acceptTerms: false,
    };

    ValidationSchemas.userRegistration.parse(invalidUserData);
    console.log('  Invalid data unexpectedly passed validation');
  } catch (error) {
    console.log('  Invalid user registration data correctly rejected');
    console.log(`  Error: ${error}`);
  }

  console.log('\n=== Demo Complete ===');
}

/**
 * Test the validation system with various attack vectors
 */
export function testSecurityValidation() {
  const testCases = [
    // XSS attempts
    {
      name: 'Basic XSS',
      input: '<script>alert("xss")</script>',
      expectedValid: false,
    },
    {
      name: 'Event handler XSS',
      input: '<img src="x" onerror="alert(1)">',
      expectedValid: false,
    },
    {
      name: 'JavaScript URL',
      input: 'javascript:alert("xss")',
      expectedValid: false,
    },
    
    // SQL injection attempts
    {
      name: 'Basic SQL injection',
      input: "'; DROP TABLE users; --",
      expectedValid: false,
    },
    {
      name: 'Union-based SQL injection',
      input: "1' UNION SELECT * FROM users --",
      expectedValid: false,
    },
    
    // Command injection attempts
    {
      name: 'Command chaining',
      input: '; cat /etc/passwd',
      expectedValid: false,
    },
    {
      name: 'Command substitution',
      input: '`whoami`',
      expectedValid: false,
    },
    
    // Path traversal attempts
    {
      name: 'Directory traversal',
      input: '../../../etc/passwd',
      expectedValid: false,
    },
    {
      name: 'URL encoded traversal',
      input: '%2e%2e%2f%2e%2e%2f%2e%2e%2fetc%2fpasswd',
      expectedValid: false,
    },
    
    // Valid inputs
    {
      name: 'Normal text',
      input: 'Hello World 123',
      expectedValid: true,
    },
    {
      name: 'Email address',
      input: 'user@example.com',
      expectedValid: true,
    },
    {
      name: 'Product description',
      input: 'High-quality product with excellent features!',
      expectedValid: true,
    },
  ];

  console.log('=== Security Validation Test Results ===\n');

  let passed = 0;
  let failed = 0;

  testCases.forEach(testCase => {
    const isValid = SecurityValidator.validateInput(testCase.input, 'general');
    const testPassed = isValid === testCase.expectedValid;
    
    console.log(`${testPassed ? '✅' : '❌'} ${testCase.name}`);
    console.log(`   Input: "${testCase.input}"`);
    console.log(`   Expected: ${testCase.expectedValid}, Got: ${isValid}`);
    
    if (!testPassed) {
      console.log(`   ⚠️  Test failed!`);
      failed++;
    } else {
      passed++;
    }
    console.log('');
  });

  console.log(`=== Test Summary ===`);
  console.log(`Passed: ${passed}`);
  console.log(`Failed: ${failed}`);
  console.log(`Total: ${testCases.length}`);
  console.log(`Success Rate: ${Math.round((passed / testCases.length) * 100)}%`);

  return { passed, failed, total: testCases.length };
}

// Export for use in other modules
export default {
  demonstrateValidation,
  testSecurityValidation,
};