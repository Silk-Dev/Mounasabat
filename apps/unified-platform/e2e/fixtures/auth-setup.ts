import { test as setup, expect } from '@playwright/test';
import { testUsers } from './test-data';

const authFile = 'playwright/.auth/user.json';
const providerAuthFile = 'playwright/.auth/provider.json';
const adminAuthFile = 'playwright/.auth/admin.json';

setup('authenticate as customer', async ({ page }) => {
  // Go to login page
  await page.goto('/auth/signin');
  
  // Fill login form
  await page.fill('[data-testid="email-input"]', testUsers.customer.email);
  await page.fill('[data-testid="password-input"]', testUsers.customer.password);
  
  // Click login button
  await page.click('[data-testid="signin-button"]');
  
  // Wait for redirect to dashboard or home
  await page.waitForURL(/\/(dashboard|$)/);
  
  // Verify we're logged in
  await expect(page.locator('[data-testid="user-menu"]')).toBeVisible();
  
  // Save authentication state
  await page.context().storageState({ path: authFile });
});

setup('authenticate as provider', async ({ page }) => {
  // Go to login page
  await page.goto('/auth/signin');
  
  // Fill login form
  await page.fill('[data-testid="email-input"]', testUsers.provider.email);
  await page.fill('[data-testid="password-input"]', testUsers.provider.password);
  
  // Click login button
  await page.click('[data-testid="signin-button"]');
  
  // Wait for redirect to provider dashboard
  await page.waitForURL('/provider/dashboard');
  
  // Verify we're logged in as provider
  await expect(page.locator('[data-testid="provider-dashboard"]')).toBeVisible();
  
  // Save authentication state
  await page.context().storageState({ path: providerAuthFile });
});

setup('authenticate as admin', async ({ page }) => {
  // Go to login page
  await page.goto('/auth/signin');
  
  // Fill login form
  await page.fill('[data-testid="email-input"]', testUsers.admin.email);
  await page.fill('[data-testid="password-input"]', testUsers.admin.password);
  
  // Click login button
  await page.click('[data-testid="signin-button"]');
  
  // Wait for redirect to admin dashboard
  await page.waitForURL('/admin/dashboard');
  
  // Verify we're logged in as admin
  await expect(page.locator('[data-testid="admin-dashboard"]')).toBeVisible();
  
  // Save authentication state
  await page.context().storageState({ path: adminAuthFile });
});