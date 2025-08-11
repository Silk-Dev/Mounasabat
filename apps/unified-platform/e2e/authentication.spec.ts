import { test, expect } from '@playwright/test';
import { testUsers } from './fixtures/test-data';

test.describe('Authentication Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Clear any existing authentication
    await page.context().clearCookies();
    await page.context().clearPermissions();
  });

  test('should sign up new customer', async ({ page }) => {
    await page.goto('/auth/signup');
    
    // Check signup form is visible
    await expect(page.locator('[data-testid="signup-form"]')).toBeVisible();
    
    // Fill signup form
    const timestamp = Date.now();
    const testEmail = `test-customer-${timestamp}@example.com`;
    
    await page.fill('[data-testid="first-name-input"]', testUsers.customer.firstName);
    await page.fill('[data-testid="last-name-input"]', testUsers.customer.lastName);
    await page.fill('[data-testid="email-input"]', testEmail);
    await page.fill('[data-testid="password-input"]', testUsers.customer.password);
    await page.fill('[data-testid="confirm-password-input"]', testUsers.customer.password);
    await page.fill('[data-testid="phone-input"]', testUsers.customer.phone);
    
    // Accept terms and conditions
    await page.check('[data-testid="terms-checkbox"]');
    
    // Submit form
    await page.click('[data-testid="signup-button"]');
    
    // Should redirect to verification page or dashboard
    await page.waitForURL(/\/(verify-email|dashboard|$)/);
    
    // Check success message or verification notice
    const isVerificationPage = page.url().includes('verify-email');
    if (isVerificationPage) {
      await expect(page.locator('[data-testid="verification-notice"]')).toBeVisible();
    } else {
      await expect(page.locator('[data-testid="welcome-message"]')).toBeVisible();
    }
  });

  test('should sign in existing user', async ({ page }) => {
    await page.goto('/auth/signin');
    
    // Check signin form is visible
    await expect(page.locator('[data-testid="signin-form"]')).toBeVisible();
    
    // Fill signin form
    await page.fill('[data-testid="email-input"]', testUsers.customer.email);
    await page.fill('[data-testid="password-input"]', testUsers.customer.password);
    
    // Submit form
    await page.click('[data-testid="signin-button"]');
    
    // Should redirect to dashboard or home
    await page.waitForURL(/\/(dashboard|$)/);
    
    // Check user is logged in
    await expect(page.locator('[data-testid="user-menu"]')).toBeVisible();
    
    // Check user name is displayed
    await expect(page.locator('[data-testid="user-name"]')).toContainText(testUsers.customer.firstName);
  });

  test('should handle invalid login credentials', async ({ page }) => {
    await page.goto('/auth/signin');
    
    // Fill with invalid credentials
    await page.fill('[data-testid="email-input"]', 'invalid@example.com');
    await page.fill('[data-testid="password-input"]', 'wrongpassword');
    
    // Submit form
    await page.click('[data-testid="signin-button"]');
    
    // Should show error message
    await expect(page.locator('[data-testid="error-message"]')).toBeVisible();
    await expect(page.locator('[data-testid="error-message"]')).toContainText(/invalid credentials/i);
    
    // Should stay on signin page
    expect(page.url()).toContain('/auth/signin');
  });

  test('should validate signup form fields', async ({ page }) => {
    await page.goto('/auth/signup');
    
    // Try to submit empty form
    await page.click('[data-testid="signup-button"]');
    
    // Should show validation errors
    await expect(page.locator('[data-testid="first-name-error"]')).toBeVisible();
    await expect(page.locator('[data-testid="email-error"]')).toBeVisible();
    await expect(page.locator('[data-testid="password-error"]')).toBeVisible();
    
    // Test invalid email format
    await page.fill('[data-testid="email-input"]', 'invalid-email');
    await page.click('[data-testid="signup-button"]');
    await expect(page.locator('[data-testid="email-error"]')).toContainText(/invalid email/i);
    
    // Test weak password
    await page.fill('[data-testid="password-input"]', '123');
    await page.click('[data-testid="signup-button"]');
    await expect(page.locator('[data-testid="password-error"]')).toContainText(/password must be/i);
    
    // Test password confirmation mismatch
    await page.fill('[data-testid="password-input"]', testUsers.customer.password);
    await page.fill('[data-testid="confirm-password-input"]', 'different-password');
    await page.click('[data-testid="signup-button"]');
    await expect(page.locator('[data-testid="confirm-password-error"]')).toContainText(/passwords do not match/i);
  });

  test('should handle forgot password flow', async ({ page }) => {
    await page.goto('/auth/signin');
    
    // Click forgot password link
    await page.click('[data-testid="forgot-password-link"]');
    
    // Should navigate to forgot password page
    await page.waitForURL('/auth/forgot-password');
    await expect(page.locator('[data-testid="forgot-password-form"]')).toBeVisible();
    
    // Fill email
    await page.fill('[data-testid="email-input"]', testUsers.customer.email);
    
    // Submit form
    await page.click('[data-testid="send-reset-link"]');
    
    // Should show success message
    await expect(page.locator('[data-testid="reset-email-sent"]')).toBeVisible();
    await expect(page.locator('[data-testid="reset-email-sent"]')).toContainText(/reset link sent/i);
  });

  test('should sign out user', async ({ page }) => {
    // First sign in
    await page.goto('/auth/signin');
    await page.fill('[data-testid="email-input"]', testUsers.customer.email);
    await page.fill('[data-testid="password-input"]', testUsers.customer.password);
    await page.click('[data-testid="signin-button"]');
    await page.waitForURL(/\/(dashboard|$)/);
    
    // Open user menu
    await page.click('[data-testid="user-menu"]');
    
    // Click sign out
    await page.click('[data-testid="signout-button"]');
    
    // Should redirect to home page
    await page.waitForURL('/');
    
    // User menu should not be visible
    await expect(page.locator('[data-testid="user-menu"]')).not.toBeVisible();
    
    // Sign in button should be visible
    await expect(page.locator('[data-testid="signin-link"]')).toBeVisible();
  });

  test('should redirect to intended page after login', async ({ page }) => {
    // Try to access protected page while not logged in
    await page.goto('/dashboard');
    
    // Should redirect to signin with return URL
    await page.waitForURL(/\/auth\/signin/);
    expect(page.url()).toContain('returnUrl');
    
    // Sign in
    await page.fill('[data-testid="email-input"]', testUsers.customer.email);
    await page.fill('[data-testid="password-input"]', testUsers.customer.password);
    await page.click('[data-testid="signin-button"]');
    
    // Should redirect back to intended page
    await page.waitForURL('/dashboard');
    await expect(page.locator('[data-testid="dashboard"]')).toBeVisible();
  });

  test('should handle provider signup', async ({ page }) => {
    await page.goto('/auth/signup?type=provider');
    
    // Check provider signup form
    await expect(page.locator('[data-testid="provider-signup-form"]')).toBeVisible();
    
    // Fill provider-specific fields
    const timestamp = Date.now();
    const testEmail = `test-provider-${timestamp}@example.com`;
    
    await page.fill('[data-testid="first-name-input"]', testUsers.provider.firstName);
    await page.fill('[data-testid="last-name-input"]', testUsers.provider.lastName);
    await page.fill('[data-testid="email-input"]', testEmail);
    await page.fill('[data-testid="password-input"]', testUsers.provider.password);
    await page.fill('[data-testid="confirm-password-input"]', testUsers.provider.password);
    await page.fill('[data-testid="business-name-input"]', testUsers.provider.businessName);
    await page.fill('[data-testid="phone-input"]', testUsers.provider.phone);
    
    // Select business category
    await page.selectOption('[data-testid="business-category"]', 'Photography');
    
    // Accept terms
    await page.check('[data-testid="terms-checkbox"]');
    await page.check('[data-testid="provider-terms-checkbox"]');
    
    // Submit form
    await page.click('[data-testid="signup-button"]');
    
    // Should redirect to provider verification or dashboard
    await page.waitForURL(/\/(provider\/verify|provider\/dashboard)/);
    
    // Check verification notice for providers
    if (page.url().includes('verify')) {
      await expect(page.locator('[data-testid="provider-verification-notice"]')).toBeVisible();
    }
  });

  test('should handle session expiration', async ({ page }) => {
    // Sign in first
    await page.goto('/auth/signin');
    await page.fill('[data-testid="email-input"]', testUsers.customer.email);
    await page.fill('[data-testid="password-input"]', testUsers.customer.password);
    await page.click('[data-testid="signin-button"]');
    await page.waitForURL(/\/(dashboard|$)/);
    
    // Simulate session expiration by clearing cookies
    await page.context().clearCookies();
    
    // Try to access protected resource
    await page.goto('/dashboard');
    
    // Should redirect to signin
    await page.waitForURL(/\/auth\/signin/);
    
    // Should show session expired message
    await expect(page.locator('[data-testid="session-expired-message"]')).toBeVisible();
  });

  test('should handle social login (if implemented)', async ({ page }) => {
    await page.goto('/auth/signin');
    
    // Check if social login buttons are present
    const googleButton = page.locator('[data-testid="google-signin"]');
    const facebookButton = page.locator('[data-testid="facebook-signin"]');
    
    if (await googleButton.isVisible()) {
      // Test Google login button (won't complete in test environment)
      await expect(googleButton).toBeVisible();
      await expect(googleButton).toContainText(/continue with google/i);
    }
    
    if (await facebookButton.isVisible()) {
      // Test Facebook login button
      await expect(facebookButton).toBeVisible();
      await expect(facebookButton).toContainText(/continue with facebook/i);
    }
  });
});