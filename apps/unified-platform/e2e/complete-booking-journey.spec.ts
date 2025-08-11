import { test, expect } from '@playwright/test';

test.describe('Complete Booking Journey', () => {
  test.beforeEach(async ({ page }) => {
    // Set up test data and authentication
    await page.goto('/');
  });

  test('customer can complete full booking journey', async ({ page }) => {
    // Step 1: Search for services
    await test.step('Search for wedding photography services', async () => {
      await page.fill('[data-testid="search-input"]', 'wedding photography');
      await page.fill('[data-testid="location-input"]', 'New York');
      await page.click('[data-testid="search-button"]');

      // Wait for search results
      await page.waitForSelector('[data-testid="search-results"]');
      await expect(page.locator('[data-testid="service-card"]').first()).toBeVisible();
    });

    // Step 2: Apply filters
    await test.step('Apply price and rating filters', async () => {
      await page.click('[data-testid="filter-toggle"]');
      await page.fill('[data-testid="price-min"]', '1000');
      await page.fill('[data-testid="price-max"]', '3000');
      await page.click('[data-testid="rating-4-stars"]');
      await page.click('[data-testid="apply-filters"]');

      // Wait for filtered results
      await page.waitForSelector('[data-testid="search-results"]');
      
      // Verify filters are applied
      const priceElements = page.locator('[data-testid="service-price"]');
      const prices = await priceElements.allTextContents();
      prices.forEach(price => {
        const numericPrice = parseInt(price.replace(/[^0-9]/g, ''));
        expect(numericPrice).toBeGreaterThanOrEqual(1000);
        expect(numericPrice).toBeLessThanOrEqual(3000);
      });
    });

    // Step 3: View service details
    await test.step('View detailed service information', async () => {
      await page.click('[data-testid="service-card"]', { first: true });
      
      // Wait for service detail page
      await page.waitForSelector('[data-testid="service-detail"]');
      
      // Verify service information is displayed
      await expect(page.locator('[data-testid="service-name"]')).toBeVisible();
      await expect(page.locator('[data-testid="service-price"]')).toBeVisible();
      await expect(page.locator('[data-testid="service-description"]')).toBeVisible();
      await expect(page.locator('[data-testid="provider-info"]')).toBeVisible();
      await expect(page.locator('[data-testid="reviews-section"]')).toBeVisible();
    });

    // Step 4: Check availability
    await test.step('Check service availability', async () => {
      await page.click('[data-testid="check-availability"]');
      
      // Select a date
      await page.click('[data-testid="date-picker"]');
      await page.click('[data-testid="available-date"]', { first: true });
      
      // Verify availability is shown
      await expect(page.locator('[data-testid="availability-confirmed"]')).toBeVisible();
    });

    // Step 5: Start booking process (requires authentication)
    await test.step('Authenticate user', async () => {
      await page.click('[data-testid="book-now-button"]');
      
      // Should redirect to sign in if not authenticated
      await page.waitForURL('**/auth/signin');
      
      // Sign in with test credentials
      await page.fill('[data-testid="email-input"]', 'test@example.com');
      await page.fill('[data-testid="password-input"]', 'testpassword123');
      await page.click('[data-testid="signin-button"]');
      
      // Should redirect back to booking flow
      await page.waitForSelector('[data-testid="booking-wizard"]');
    });

    // Step 6: Complete booking wizard
    await test.step('Complete service selection', async () => {
      // Step 1: Service Selection
      await expect(page.locator('[data-testid="booking-step-1"]')).toBeVisible();
      await expect(page.locator('text=Select Services')).toBeVisible();
      
      // Verify service is pre-selected
      await expect(page.locator('[data-testid="selected-service"]')).toBeVisible();
      
      // Add customizations if available
      const customizationSelect = page.locator('[data-testid="service-customization"]');
      if (await customizationSelect.isVisible()) {
        await customizationSelect.selectOption('premium');
      }
      
      await page.click('[data-testid="next-button"]');
    });

    await test.step('Select date and time', async () => {
      // Step 2: Date & Time Selection
      await expect(page.locator('[data-testid="booking-step-2"]')).toBeVisible();
      await expect(page.locator('text=Select Date & Time')).toBeVisible();
      
      // Select event date
      await page.click('[data-testid="event-date-picker"]');
      await page.click('[data-testid="available-date"]', { first: true });
      
      // Select time slots
      await page.fill('[data-testid="start-time"]', '14:00');
      await page.fill('[data-testid="end-time"]', '22:00');
      
      // Verify availability
      await expect(page.locator('[data-testid="time-slot-available"]')).toBeVisible();
      
      await page.click('[data-testid="next-button"]');
    });

    await test.step('Fill customer details', async () => {
      // Step 3: Customer Details
      await expect(page.locator('[data-testid="booking-step-3"]')).toBeVisible();
      await expect(page.locator('text=Your Details')).toBeVisible();
      
      // Fill in event details
      await page.fill('[data-testid="event-type"]', 'Wedding');
      await page.fill('[data-testid="guest-count"]', '150');
      await page.fill('[data-testid="event-location"]', 'Central Park, New York');
      await page.fill('[data-testid="special-requests"]', 'Please arrive 30 minutes early for setup');
      
      // Contact information should be pre-filled from user profile
      await expect(page.locator('[data-testid="customer-email"]')).toHaveValue('test@example.com');
      
      // Fill additional contact info if needed
      await page.fill('[data-testid="customer-phone"]', '+1234567890');
      
      await page.click('[data-testid="next-button"]');
    });

    await test.step('Complete payment', async () => {
      // Step 4: Payment
      await expect(page.locator('[data-testid="booking-step-4"]')).toBeVisible();
      await expect(page.locator('text=Payment')).toBeVisible();
      
      // Verify booking summary
      await expect(page.locator('[data-testid="booking-summary"]')).toBeVisible();
      await expect(page.locator('[data-testid="total-amount"]')).toBeVisible();
      
      // Fill payment information (using Stripe test card)
      const cardFrame = page.frameLocator('[data-testid="stripe-card-element"] iframe');
      await cardFrame.fill('[name="cardnumber"]', '4242424242424242');
      await cardFrame.fill('[name="exp-date"]', '12/25');
      await cardFrame.fill('[name="cvc"]', '123');
      await cardFrame.fill('[name="postal"]', '10001');
      
      // Complete booking
      await page.click('[data-testid="complete-booking-button"]');
      
      // Wait for payment processing
      await expect(page.locator('[data-testid="payment-processing"]')).toBeVisible();
    });

    // Step 7: Booking confirmation
    await test.step('Verify booking confirmation', async () => {
      // Should show confirmation page
      await page.waitForSelector('[data-testid="booking-confirmation"]', { timeout: 30000 });
      
      await expect(page.locator('text=Booking Confirmed!')).toBeVisible();
      await expect(page.locator('[data-testid="booking-id"]')).toBeVisible();
      await expect(page.locator('[data-testid="confirmation-details"]')).toBeVisible();
      
      // Verify booking details
      await expect(page.locator('text=Wedding Photography')).toBeVisible();
      await expect(page.locator('text=Wedding')).toBeVisible();
      await expect(page.locator('text=150 guests')).toBeVisible();
      
      // Should have options to view booking or continue browsing
      await expect(page.locator('[data-testid="view-booking-button"]')).toBeVisible();
      await expect(page.locator('[data-testid="continue-browsing-button"]')).toBeVisible();
    });

    // Step 8: Verify booking in user dashboard
    await test.step('Check booking in user dashboard', async () => {
      await page.click('[data-testid="view-booking-button"]');
      
      // Should navigate to user dashboard
      await page.waitForURL('**/dashboard');
      
      // Verify booking appears in user's bookings
      await expect(page.locator('[data-testid="user-bookings"]')).toBeVisible();
      await expect(page.locator('[data-testid="booking-item"]').first()).toBeVisible();
      
      // Verify booking status
      await expect(page.locator('[data-testid="booking-status"]').first()).toHaveText('Confirmed');
    });
  });

  test('handles booking errors gracefully', async ({ page }) => {
    await test.step('Simulate payment failure', async () => {
      // Navigate to a service and start booking
      await page.fill('[data-testid="search-input"]', 'wedding photography');
      await page.click('[data-testid="search-button"]');
      await page.waitForSelector('[data-testid="service-card"]');
      await page.click('[data-testid="service-card"]', { first: true });
      
      // Sign in
      await page.click('[data-testid="book-now-button"]');
      await page.fill('[data-testid="email-input"]', 'test@example.com');
      await page.fill('[data-testid="password-input"]', 'testpassword123');
      await page.click('[data-testid="signin-button"]');
      
      // Complete booking steps quickly
      await page.click('[data-testid="next-button"]'); // Service selection
      await page.click('[data-testid="event-date-picker"]');
      await page.click('[data-testid="available-date"]', { first: true });
      await page.fill('[data-testid="start-time"]', '14:00');
      await page.fill('[data-testid="end-time"]', '22:00');
      await page.click('[data-testid="next-button"]'); // Date selection
      
      await page.fill('[data-testid="event-type"]', 'Wedding');
      await page.fill('[data-testid="guest-count"]', '150');
      await page.click('[data-testid="next-button"]'); // Customer details
      
      // Use a card that will be declined
      const cardFrame = page.frameLocator('[data-testid="stripe-card-element"] iframe');
      await cardFrame.fill('[name="cardnumber"]', '4000000000000002'); // Declined card
      await cardFrame.fill('[name="exp-date"]', '12/25');
      await cardFrame.fill('[name="cvc"]', '123');
      
      await page.click('[data-testid="complete-booking-button"]');
      
      // Should show payment error
      await expect(page.locator('[data-testid="payment-error"]')).toBeVisible();
      await expect(page.locator('text=Payment failed')).toBeVisible();
      
      // Should allow retry
      await expect(page.locator('[data-testid="retry-payment-button"]')).toBeVisible();
    });
  });

  test('handles service unavailability', async ({ page }) => {
    await test.step('Select unavailable time slot', async () => {
      // Navigate to service
      await page.fill('[data-testid="search-input"]', 'wedding photography');
      await page.click('[data-testid="search-button"]');
      await page.click('[data-testid="service-card"]', { first: true });
      
      // Sign in and start booking
      await page.click('[data-testid="book-now-button"]');
      await page.fill('[data-testid="email-input"]', 'test@example.com');
      await page.fill('[data-testid="password-input"]', 'testpassword123');
      await page.click('[data-testid="signin-button"]');
      
      await page.click('[data-testid="next-button"]'); // Service selection
      
      // Try to select an unavailable date/time
      await page.click('[data-testid="event-date-picker"]');
      await page.click('[data-testid="unavailable-date"]', { first: true });
      
      // Should show unavailability message
      await expect(page.locator('[data-testid="unavailable-message"]')).toBeVisible();
      await expect(page.locator('text=This date is not available')).toBeVisible();
      
      // Should suggest alternative dates
      await expect(page.locator('[data-testid="alternative-dates"]')).toBeVisible();
    });
  });

  test('supports mobile booking flow', async ({ page, isMobile }) => {
    test.skip(!isMobile, 'This test is only for mobile');
    
    await test.step('Complete booking on mobile device', async () => {
      // Mobile-specific interactions
      await page.fill('[data-testid="search-input"]', 'wedding photography');
      await page.tap('[data-testid="search-button"]');
      
      // Verify mobile-optimized search results
      await expect(page.locator('[data-testid="mobile-search-results"]')).toBeVisible();
      
      await page.tap('[data-testid="service-card"]', { first: true });
      
      // Mobile booking flow should be optimized
      await page.tap('[data-testid="book-now-button"]');
      
      // Mobile sign in
      await page.fill('[data-testid="email-input"]', 'test@example.com');
      await page.fill('[data-testid="password-input"]', 'testpassword123');
      await page.tap('[data-testid="signin-button"]');
      
      // Verify mobile booking wizard
      await expect(page.locator('[data-testid="mobile-booking-wizard"]')).toBeVisible();
      
      // Complete mobile booking steps
      await page.tap('[data-testid="next-button"]');
      await page.tap('[data-testid="mobile-date-picker"]');
      await page.tap('[data-testid="available-date"]', { first: true });
      await page.tap('[data-testid="next-button"]');
      
      // Mobile form should be touch-optimized
      await page.fill('[data-testid="event-type"]', 'Wedding');
      await page.fill('[data-testid="guest-count"]', '150');
      await page.tap('[data-testid="next-button"]');
      
      // Mobile payment form
      const cardFrame = page.frameLocator('[data-testid="stripe-card-element"] iframe');
      await cardFrame.fill('[name="cardnumber"]', '4242424242424242');
      await cardFrame.fill('[name="exp-date"]', '12/25');
      await cardFrame.fill('[name="cvc"]', '123');
      
      await page.tap('[data-testid="complete-booking-button"]');
      
      // Verify mobile confirmation
      await expect(page.locator('[data-testid="mobile-booking-confirmation"]')).toBeVisible();
    });
  });

  test('preserves booking state across page refreshes', async ({ page }) => {
    await test.step('Start booking and refresh page', async () => {
      // Start booking process
      await page.fill('[data-testid="search-input"]', 'wedding photography');
      await page.click('[data-testid="search-button"]');
      await page.click('[data-testid="service-card"]', { first: true });
      
      await page.click('[data-testid="book-now-button"]');
      await page.fill('[data-testid="email-input"]', 'test@example.com');
      await page.fill('[data-testid="password-input"]', 'testpassword123');
      await page.click('[data-testid="signin-button"]');
      
      // Progress to step 2
      await page.click('[data-testid="next-button"]');
      await page.click('[data-testid="event-date-picker"]');
      await page.click('[data-testid="available-date"]', { first: true });
      
      // Refresh page
      await page.reload();
      
      // Should restore booking state
      await expect(page.locator('[data-testid="booking-step-2"]')).toBeVisible();
      await expect(page.locator('[data-testid="selected-date"]')).toBeVisible();
    });
  });

  test('handles concurrent booking attempts', async ({ page, context }) => {
    await test.step('Simulate concurrent bookings for same time slot', async () => {
      // Open second tab
      const secondPage = await context.newPage();
      
      // Both pages navigate to same service
      const serviceUrl = '/providers/test-provider/services/wedding-photography';
      await page.goto(serviceUrl);
      await secondPage.goto(serviceUrl);
      
      // Both start booking process simultaneously
      await Promise.all([
        page.click('[data-testid="book-now-button"]'),
        secondPage.click('[data-testid="book-now-button"]'),
      ]);
      
      // Sign in on both
      await Promise.all([
        (async () => {
          await page.fill('[data-testid="email-input"]', 'test1@example.com');
          await page.fill('[data-testid="password-input"]', 'testpassword123');
          await page.click('[data-testid="signin-button"]');
        })(),
        (async () => {
          await secondPage.fill('[data-testid="email-input"]', 'test2@example.com');
          await secondPage.fill('[data-testid="password-input"]', 'testpassword123');
          await secondPage.click('[data-testid="signin-button"]');
        })(),
      ]);
      
      // Both try to book same time slot
      const sameDate = '[data-testid="available-date"]:first-child';
      
      await Promise.all([
        (async () => {
          await page.click('[data-testid="next-button"]');
          await page.click('[data-testid="event-date-picker"]');
          await page.click(sameDate);
          await page.fill('[data-testid="start-time"]', '14:00');
          await page.fill('[data-testid="end-time"]', '22:00');
          await page.click('[data-testid="next-button"]');
          await page.fill('[data-testid="event-type"]', 'Wedding');
          await page.click('[data-testid="next-button"]');
        })(),
        (async () => {
          await secondPage.click('[data-testid="next-button"]');
          await secondPage.click('[data-testid="event-date-picker"]');
          await secondPage.click(sameDate);
          await secondPage.fill('[data-testid="start-time"]', '14:00');
          await secondPage.fill('[data-testid="end-time"]', '22:00');
          await secondPage.click('[data-testid="next-button"]');
          await secondPage.fill('[data-testid="event-type"]', 'Wedding');
          await secondPage.click('[data-testid="next-button"]');
        })(),
      ]);
      
      // One should succeed, one should get conflict error
      const firstPagePayment = page.locator('[data-testid="booking-step-4"]');
      const secondPageError = secondPage.locator('[data-testid="booking-conflict-error"]');
      
      await expect(
        Promise.race([
          firstPagePayment.waitFor(),
          secondPageError.waitFor(),
        ])
      ).resolves.toBeUndefined();
      
      await secondPage.close();
    });
  });
});