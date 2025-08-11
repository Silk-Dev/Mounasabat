import { test, expect } from '@playwright/test';
import { testBooking, testPayment } from './fixtures/test-data';

test.describe('Booking Flow', () => {
  test.use({ storageState: 'playwright/.auth/user.json' });

  test('should complete full booking flow', async ({ page }) => {
    // Start from search results
    await page.goto('/search?q=wedding+photography');
    await page.waitForLoadState('networkidle');
    
    // Click on first service
    await page.click('[data-testid="service-card"]').first();
    
    // Wait for provider profile page
    await page.waitForURL(/\/providers\/[^\/]+$/);
    
    // Click book now button
    await page.click('[data-testid="book-now-button"]');
    
    // Wait for booking wizard
    await page.waitForURL(/\/booking\/create/);
    await expect(page.locator('[data-testid="booking-wizard"]')).toBeVisible();
    
    // Step 1: Service Selection
    await expect(page.locator('[data-testid="step-service-selection"]')).toBeVisible();
    
    // Select service options if available
    const serviceOptions = page.locator('[data-testid="service-option"]');
    if (await serviceOptions.count() > 0) {
      await serviceOptions.first().click();
    }
    
    // Continue to next step
    await page.click('[data-testid="continue-to-details"]');
    
    // Step 2: Event Details
    await expect(page.locator('[data-testid="step-event-details"]')).toBeVisible();
    
    // Fill event details
    await page.selectOption('[data-testid="event-type"]', testBooking.eventType);
    await page.fill('[data-testid="event-date"]', testBooking.date);
    await page.fill('[data-testid="start-time"]', testBooking.startTime);
    await page.fill('[data-testid="end-time"]', testBooking.endTime);
    await page.fill('[data-testid="guest-count"]', testBooking.guestCount.toString());
    await page.fill('[data-testid="event-location"]', testBooking.location);
    await page.fill('[data-testid="special-requests"]', testBooking.specialRequests);
    
    // Continue to customer info
    await page.click('[data-testid="continue-to-customer"]');
    
    // Step 3: Customer Information (should be pre-filled for logged-in users)
    await expect(page.locator('[data-testid="step-customer-info"]')).toBeVisible();
    
    // Verify customer info is pre-filled
    await expect(page.locator('[data-testid="customer-email"]')).toHaveValue(/\S+@\S+\.\S+/);
    
    // Continue to payment
    await page.click('[data-testid="continue-to-payment"]');
    
    // Step 4: Payment
    await expect(page.locator('[data-testid="step-payment"]')).toBeVisible();
    
    // Check order summary is displayed
    await expect(page.locator('[data-testid="order-summary"]')).toBeVisible();
    await expect(page.locator('[data-testid="total-amount"]')).toBeVisible();
    
    // Fill payment information
    await page.fill('[data-testid="cardholder-name"]', testPayment.cardholderName);
    
    // Fill Stripe card element (this might need special handling for Stripe test mode)
    const cardFrame = page.frameLocator('[data-testid="stripe-card-element"] iframe');
    await cardFrame.fill('[name="cardnumber"]', testPayment.cardNumber);
    await cardFrame.fill('[name="exp-date"]', testPayment.expiryDate);
    await cardFrame.fill('[name="cvc"]', testPayment.cvc);
    
    // Submit payment
    await page.click('[data-testid="submit-payment"]');
    
    // Wait for payment processing
    await page.waitForLoadState('networkidle');
    
    // Step 5: Confirmation
    await expect(page.locator('[data-testid="booking-confirmation"]')).toBeVisible();
    await expect(page.locator('[data-testid="booking-id"]')).toBeVisible();
    await expect(page.locator('[data-testid="confirmation-message"]')).toContainText(/booking confirmed/i);
    
    // Check confirmation email notice
    await expect(page.locator('[data-testid="email-confirmation-notice"]')).toBeVisible();
  });

  test('should validate required fields in booking form', async ({ page }) => {
    // Navigate to booking page
    await page.goto('/search?q=photography');
    await page.waitForLoadState('networkidle');
    await page.click('[data-testid="service-card"]').first();
    await page.click('[data-testid="book-now-button"]');
    
    // Try to continue without filling required fields
    await page.click('[data-testid="continue-to-details"]');
    
    // Should stay on same step and show validation errors
    await expect(page.locator('[data-testid="step-service-selection"]')).toBeVisible();
    
    // Move to event details step
    await page.click('[data-testid="continue-to-details"]');
    await expect(page.locator('[data-testid="step-event-details"]')).toBeVisible();
    
    // Try to continue without filling required fields
    await page.click('[data-testid="continue-to-customer"]');
    
    // Should show validation errors
    await expect(page.locator('[data-testid="validation-error"]')).toBeVisible();
    
    // Fill required fields
    await page.selectOption('[data-testid="event-type"]', testBooking.eventType);
    await page.fill('[data-testid="event-date"]', testBooking.date);
    
    // Now should be able to continue
    await page.click('[data-testid="continue-to-customer"]');
    await expect(page.locator('[data-testid="step-customer-info"]')).toBeVisible();
  });

  test('should handle booking conflicts', async ({ page }) => {
    // Navigate to booking page
    await page.goto('/search?q=photography');
    await page.waitForLoadState('networkidle');
    await page.click('[data-testid="service-card"]').first();
    await page.click('[data-testid="book-now-button"]');
    
    // Fill form with a date that might be unavailable
    await page.click('[data-testid="continue-to-details"]');
    await page.selectOption('[data-testid="event-type"]', testBooking.eventType);
    
    // Select a date in the past (should be unavailable)
    await page.fill('[data-testid="event-date"]', '2020-01-01');
    
    // Try to continue
    await page.click('[data-testid="continue-to-customer"]');
    
    // Should show availability error
    await expect(page.locator('[data-testid="availability-error"]')).toBeVisible();
    await expect(page.locator('[data-testid="availability-error"]')).toContainText(/not available/i);
  });

  test('should save booking progress', async ({ page }) => {
    // Navigate to booking page
    await page.goto('/search?q=photography');
    await page.waitForLoadState('networkidle');
    await page.click('[data-testid="service-card"]').first();
    await page.click('[data-testid="book-now-button"]');
    
    // Fill some form data
    await page.click('[data-testid="continue-to-details"]');
    await page.selectOption('[data-testid="event-type"]', testBooking.eventType);
    await page.fill('[data-testid="event-date"]', testBooking.date);
    
    // Refresh page to simulate interruption
    await page.reload();
    
    // Check if progress is restored
    await expect(page.locator('[data-testid="restore-progress-banner"]')).toBeVisible();
    
    // Click restore progress
    await page.click('[data-testid="restore-progress"]');
    
    // Verify form data is restored
    await expect(page.locator('[data-testid="event-type"]')).toHaveValue(testBooking.eventType);
    await expect(page.locator('[data-testid="event-date"]')).toHaveValue(testBooking.date);
  });

  test('should handle payment failures', async ({ page }) => {
    // Navigate through booking flow to payment
    await page.goto('/search?q=photography');
    await page.waitForLoadState('networkidle');
    await page.click('[data-testid="service-card"]').first();
    await page.click('[data-testid="book-now-button"]');
    
    // Fill required steps quickly
    await page.click('[data-testid="continue-to-details"]');
    await page.selectOption('[data-testid="event-type"]', testBooking.eventType);
    await page.fill('[data-testid="event-date"]', testBooking.date);
    await page.click('[data-testid="continue-to-customer"]');
    await page.click('[data-testid="continue-to-payment"]');
    
    // Fill payment with a card that will be declined
    await page.fill('[data-testid="cardholder-name"]', testPayment.cardholderName);
    
    const cardFrame = page.frameLocator('[data-testid="stripe-card-element"] iframe');
    await cardFrame.fill('[name="cardnumber"]', '4000000000000002'); // Declined card
    await cardFrame.fill('[name="exp-date"]', testPayment.expiryDate);
    await cardFrame.fill('[name="cvc"]', testPayment.cvc);
    
    // Submit payment
    await page.click('[data-testid="submit-payment"]');
    
    // Should show payment error
    await expect(page.locator('[data-testid="payment-error"]')).toBeVisible();
    await expect(page.locator('[data-testid="payment-error"]')).toContainText(/declined/i);
    
    // Should still be on payment step
    await expect(page.locator('[data-testid="step-payment"]')).toBeVisible();
  });

  test('should show booking summary correctly', async ({ page }) => {
    // Navigate to booking page
    await page.goto('/search?q=photography');
    await page.waitForLoadState('networkidle');
    await page.click('[data-testid="service-card"]').first();
    await page.click('[data-testid="book-now-button"]');
    
    // Progress through steps to see summary
    await page.click('[data-testid="continue-to-details"]');
    await page.selectOption('[data-testid="event-type"]', testBooking.eventType);
    await page.fill('[data-testid="event-date"]', testBooking.date);
    await page.fill('[data-testid="guest-count"]', testBooking.guestCount.toString());
    await page.click('[data-testid="continue-to-customer"]');
    await page.click('[data-testid="continue-to-payment"]');
    
    // Check order summary
    await expect(page.locator('[data-testid="order-summary"]')).toBeVisible();
    
    // Check service details
    await expect(page.locator('[data-testid="summary-service-name"]')).toBeVisible();
    await expect(page.locator('[data-testid="summary-service-price"]')).toBeVisible();
    
    // Check event details
    await expect(page.locator('[data-testid="summary-event-date"]')).toContainText(testBooking.date);
    await expect(page.locator('[data-testid="summary-guest-count"]')).toContainText(testBooking.guestCount.toString());
    
    // Check pricing breakdown
    await expect(page.locator('[data-testid="subtotal"]')).toBeVisible();
    await expect(page.locator('[data-testid="taxes"]')).toBeVisible();
    await expect(page.locator('[data-testid="total"]')).toBeVisible();
  });

  test('should handle mobile booking flow', async ({ page, isMobile }) => {
    test.skip(!isMobile, 'Mobile-specific test');
    
    // Navigate to booking on mobile
    await page.goto('/search?q=photography');
    await page.waitForLoadState('networkidle');
    await page.click('[data-testid="service-card"]').first();
    
    // Check mobile-optimized booking button
    await expect(page.locator('[data-testid="mobile-book-button"]')).toBeVisible();
    await page.click('[data-testid="mobile-book-button"]');
    
    // Check mobile booking wizard
    await expect(page.locator('[data-testid="mobile-booking-wizard"]')).toBeVisible();
    
    // Check step indicators are mobile-friendly
    await expect(page.locator('[data-testid="mobile-step-indicator"]')).toBeVisible();
    
    // Test swipe navigation if implemented
    const wizard = page.locator('[data-testid="mobile-booking-wizard"]');
    await wizard.swipe({ direction: 'left' });
  });
});