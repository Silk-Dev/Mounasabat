import { test, expect } from '@playwright/test';

test.describe('Provider Dashboard', () => {
  test.beforeEach(async ({ page }) => {
    // Sign in as provider
    await page.goto('/auth/signin');
    await page.fill('[data-testid="email-input"]', 'provider@example.com');
    await page.fill('[data-testid="password-input"]', 'providerpassword123');
    await page.click('[data-testid="signin-button"]');
    
    // Should redirect to provider dashboard
    await page.waitForURL('**/provider/dashboard');
  });

  test('displays provider dashboard overview', async ({ page }) => {
    await test.step('Verify dashboard components', async () => {
      // Check main dashboard elements
      await expect(page.locator('[data-testid="provider-dashboard"]')).toBeVisible();
      await expect(page.locator('[data-testid="dashboard-header"]')).toBeVisible();
      await expect(page.locator('text=Provider Dashboard')).toBeVisible();
      
      // Check metrics cards
      await expect(page.locator('[data-testid="total-bookings-card"]')).toBeVisible();
      await expect(page.locator('[data-testid="revenue-card"]')).toBeVisible();
      await expect(page.locator('[data-testid="rating-card"]')).toBeVisible();
      await expect(page.locator('[data-testid="active-services-card"]')).toBeVisible();
      
      // Check recent activity
      await expect(page.locator('[data-testid="recent-bookings"]')).toBeVisible();
      await expect(page.locator('[data-testid="upcoming-events"]')).toBeVisible();
    });

    await test.step('Verify navigation menu', async () => {
      // Check sidebar navigation
      await expect(page.locator('[data-testid="provider-nav"]')).toBeVisible();
      await expect(page.locator('[data-testid="nav-dashboard"]')).toBeVisible();
      await expect(page.locator('[data-testid="nav-services"]')).toBeVisible();
      await expect(page.locator('[data-testid="nav-bookings"]')).toBeVisible();
      await expect(page.locator('[data-testid="nav-availability"]')).toBeVisible();
      await expect(page.locator('[data-testid="nav-analytics"]')).toBeVisible();
    });
  });

  test('manages services', async ({ page }) => {
    await test.step('Navigate to services management', async () => {
      await page.click('[data-testid="nav-services"]');
      await page.waitForURL('**/provider/services');
      
      await expect(page.locator('[data-testid="services-page"]')).toBeVisible();
      await expect(page.locator('text=My Services')).toBeVisible();
    });

    await test.step('Create new service', async () => {
      await page.click('[data-testid="create-service-button"]');
      
      // Fill service form
      await page.fill('[data-testid="service-name"]', 'Premium Wedding Photography');
      await page.selectOption('[data-testid="service-category"]', 'Photography');
      await page.fill('[data-testid="service-description"]', 'Professional wedding photography with premium editing and delivery');
      await page.fill('[data-testid="base-price"]', '2500');
      await page.selectOption('[data-testid="price-unit"]', 'per_event');
      
      // Add features
      await page.click('[data-testid="add-feature-button"]');
      await page.fill('[data-testid="feature-input-0"]', '10 hours coverage');
      await page.click('[data-testid="add-feature-button"]');
      await page.fill('[data-testid="feature-input-1"]', 'Professional editing');
      await page.click('[data-testid="add-feature-button"]');
      await page.fill('[data-testid="feature-input-2"]', 'Online gallery');
      
      // Upload images
      await page.setInputFiles('[data-testid="service-images"]', [
        'test-files/service-image-1.jpg',
        'test-files/service-image-2.jpg',
      ]);
      
      // Save service
      await page.click('[data-testid="save-service-button"]');
      
      // Verify service was created
      await expect(page.locator('[data-testid="success-message"]')).toBeVisible();
      await expect(page.locator('text=Service created successfully')).toBeVisible();
      
      // Should appear in services list
      await expect(page.locator('[data-testid="service-item"]')).toContainText('Premium Wedding Photography');
    });

    await test.step('Edit existing service', async () => {
      // Click edit on first service
      await page.click('[data-testid="edit-service-button"]', { first: true });
      
      // Update service details
      await page.fill('[data-testid="service-description"]', 'Updated description with more details');
      await page.fill('[data-testid="base-price"]', '2750');
      
      // Save changes
      await page.click('[data-testid="save-service-button"]');
      
      await expect(page.locator('[data-testid="success-message"]')).toBeVisible();
      await expect(page.locator('text=Service updated successfully')).toBeVisible();
    });

    await test.step('Toggle service status', async () => {
      // Deactivate service
      await page.click('[data-testid="service-status-toggle"]', { first: true });
      
      await expect(page.locator('[data-testid="service-status"]').first()).toHaveText('Inactive');
      
      // Reactivate service
      await page.click('[data-testid="service-status-toggle"]', { first: true });
      
      await expect(page.locator('[data-testid="service-status"]').first()).toHaveText('Active');
    });
  });

  test('manages bookings', async ({ page }) => {
    await test.step('Navigate to bookings management', async () => {
      await page.click('[data-testid="nav-bookings"]');
      await page.waitForURL('**/provider/bookings');
      
      await expect(page.locator('[data-testid="bookings-page"]')).toBeVisible();
      await expect(page.locator('text=My Bookings')).toBeVisible();
    });

    await test.step('Filter bookings by status', async () => {
      // Check all status filters
      await expect(page.locator('[data-testid="filter-all"]')).toBeVisible();
      await expect(page.locator('[data-testid="filter-pending"]')).toBeVisible();
      await expect(page.locator('[data-testid="filter-confirmed"]')).toBeVisible();
      await expect(page.locator('[data-testid="filter-completed"]')).toBeVisible();
      
      // Filter by pending
      await page.click('[data-testid="filter-pending"]');
      
      // Verify only pending bookings are shown
      const bookingStatuses = page.locator('[data-testid="booking-status"]');
      const statusTexts = await bookingStatuses.allTextContents();
      statusTexts.forEach(status => {
        expect(status.toLowerCase()).toContain('pending');
      });
    });

    await test.step('View booking details', async () => {
      await page.click('[data-testid="booking-item"]', { first: true });
      
      // Should open booking detail modal or page
      await expect(page.locator('[data-testid="booking-detail"]')).toBeVisible();
      
      // Verify booking information
      await expect(page.locator('[data-testid="customer-info"]')).toBeVisible();
      await expect(page.locator('[data-testid="event-details"]')).toBeVisible();
      await expect(page.locator('[data-testid="service-details"]')).toBeVisible();
      await expect(page.locator('[data-testid="payment-info"]')).toBeVisible();
    });

    await test.step('Update booking status', async () => {
      // Confirm a pending booking
      await page.click('[data-testid="confirm-booking-button"]');
      
      // Should show confirmation dialog
      await expect(page.locator('[data-testid="confirm-dialog"]')).toBeVisible();
      await page.click('[data-testid="confirm-yes-button"]');
      
      // Verify status updated
      await expect(page.locator('[data-testid="success-message"]')).toBeVisible();
      await expect(page.locator('text=Booking confirmed successfully')).toBeVisible();
    });

    await test.step('Communicate with customer', async () => {
      await page.click('[data-testid="message-customer-button"]');
      
      // Should open messaging interface
      await expect(page.locator('[data-testid="message-dialog"]')).toBeVisible();
      
      await page.fill('[data-testid="message-input"]', 'Thank you for booking! I look forward to working with you.');
      await page.click('[data-testid="send-message-button"]');
      
      await expect(page.locator('[data-testid="message-sent"]')).toBeVisible();
    });
  });

  test('manages availability', async ({ page }) => {
    await test.step('Navigate to availability management', async () => {
      await page.click('[data-testid="nav-availability"]');
      await page.waitForURL('**/provider/availability');
      
      await expect(page.locator('[data-testid="availability-page"]')).toBeVisible();
      await expect(page.locator('text=Manage Availability')).toBeVisible();
    });

    await test.step('Set available dates', async () => {
      // Should show calendar interface
      await expect(page.locator('[data-testid="availability-calendar"]')).toBeVisible();
      
      // Click on a date to toggle availability
      await page.click('[data-testid="calendar-date-15"]');
      
      // Should show time slot configuration
      await expect(page.locator('[data-testid="time-slots-config"]')).toBeVisible();
      
      // Add available time slots
      await page.click('[data-testid="add-time-slot"]');
      await page.fill('[data-testid="start-time-0"]', '09:00');
      await page.fill('[data-testid="end-time-0"]', '17:00');
      
      await page.click('[data-testid="add-time-slot"]');
      await page.fill('[data-testid="start-time-1"]', '18:00');
      await page.fill('[data-testid="end-time-1"]', '23:00');
      
      await page.click('[data-testid="save-availability"]');
      
      await expect(page.locator('[data-testid="success-message"]')).toBeVisible();
    });

    await test.step('Block unavailable dates', async () => {
      await page.click('[data-testid="calendar-date-20"]');
      await page.click('[data-testid="block-date-button"]');
      
      // Add reason for blocking
      await page.fill('[data-testid="block-reason"]', 'Personal vacation');
      await page.click('[data-testid="confirm-block"]');
      
      // Date should appear as blocked
      await expect(page.locator('[data-testid="calendar-date-20"]')).toHaveClass(/blocked/);
    });

    await test.step('Set recurring availability', async () => {
      await page.click('[data-testid="recurring-availability-tab"]');
      
      // Set weekly recurring schedule
      await page.check('[data-testid="monday-available"]');
      await page.check('[data-testid="tuesday-available"]');
      await page.check('[data-testid="wednesday-available"]');
      await page.check('[data-testid="thursday-available"]');
      await page.check('[data-testid="friday-available"]');
      
      // Set default time slots
      await page.fill('[data-testid="default-start-time"]', '10:00');
      await page.fill('[data-testid="default-end-time"]', '18:00');
      
      await page.click('[data-testid="save-recurring-availability"]');
      
      await expect(page.locator('[data-testid="success-message"]')).toBeVisible();
    });
  });

  test('views analytics and reports', async ({ page }) => {
    await test.step('Navigate to analytics', async () => {
      await page.click('[data-testid="nav-analytics"]');
      await page.waitForURL('**/provider/analytics');
      
      await expect(page.locator('[data-testid="analytics-page"]')).toBeVisible();
      await expect(page.locator('text=Analytics & Reports')).toBeVisible();
    });

    await test.step('View performance metrics', async () => {
      // Check key metrics
      await expect(page.locator('[data-testid="bookings-chart"]')).toBeVisible();
      await expect(page.locator('[data-testid="revenue-chart"]')).toBeVisible();
      await expect(page.locator('[data-testid="rating-trend"]')).toBeVisible();
      await expect(page.locator('[data-testid="popular-services"]')).toBeVisible();
    });

    await test.step('Filter analytics by date range', async () => {
      await page.click('[data-testid="date-range-picker"]');
      await page.click('[data-testid="last-30-days"]');
      
      // Charts should update
      await expect(page.locator('[data-testid="chart-loading"]')).toBeVisible();
      await expect(page.locator('[data-testid="chart-loading"]')).not.toBeVisible();
      
      // Verify data updated
      await expect(page.locator('[data-testid="date-range-display"]')).toContainText('Last 30 days');
    });

    await test.step('Export analytics report', async () => {
      await page.click('[data-testid="export-report-button"]');
      
      // Should show export options
      await expect(page.locator('[data-testid="export-options"]')).toBeVisible();
      
      await page.click('[data-testid="export-pdf"]');
      
      // Should trigger download
      const downloadPromise = page.waitForEvent('download');
      await page.click('[data-testid="confirm-export"]');
      const download = await downloadPromise;
      
      expect(download.suggestedFilename()).toContain('analytics-report');
    });
  });

  test('manages profile and settings', async ({ page }) => {
    await test.step('Navigate to profile settings', async () => {
      await page.click('[data-testid="provider-menu"]');
      await page.click('[data-testid="profile-settings"]');
      
      await expect(page.locator('[data-testid="profile-page"]')).toBeVisible();
    });

    await test.step('Update business information', async () => {
      await page.fill('[data-testid="business-name"]', 'Updated Business Name');
      await page.fill('[data-testid="business-description"]', 'Updated business description with more details');
      await page.fill('[data-testid="business-phone"]', '+1234567890');
      await page.fill('[data-testid="business-website"]', 'https://updatedbusiness.com');
      
      // Update business address
      await page.fill('[data-testid="business-address"]', '123 Updated St');
      await page.fill('[data-testid="business-city"]', 'New York');
      await page.selectOption('[data-testid="business-state"]', 'NY');
      await page.fill('[data-testid="business-zip"]', '10001');
      
      await page.click('[data-testid="save-profile"]');
      
      await expect(page.locator('[data-testid="success-message"]')).toBeVisible();
    });

    await test.step('Update profile images', async () => {
      // Upload new profile image
      await page.setInputFiles('[data-testid="profile-image-upload"]', 'test-files/profile-image.jpg');
      
      // Upload business gallery images
      await page.setInputFiles('[data-testid="gallery-upload"]', [
        'test-files/gallery-1.jpg',
        'test-files/gallery-2.jpg',
        'test-files/gallery-3.jpg',
      ]);
      
      await page.click('[data-testid="save-images"]');
      
      await expect(page.locator('[data-testid="success-message"]')).toBeVisible();
    });

    await test.step('Configure notification preferences', async () => {
      await page.click('[data-testid="notifications-tab"]');
      
      // Configure email notifications
      await page.check('[data-testid="email-new-bookings"]');
      await page.check('[data-testid="email-booking-updates"]');
      await page.uncheck('[data-testid="email-marketing"]');
      
      // Configure push notifications
      await page.check('[data-testid="push-new-bookings"]');
      await page.check('[data-testid="push-messages"]');
      
      await page.click('[data-testid="save-notifications"]');
      
      await expect(page.locator('[data-testid="success-message"]')).toBeVisible();
    });
  });

  test('handles real-time notifications', async ({ page }) => {
    await test.step('Receive new booking notification', async () => {
      // Simulate new booking (this would typically come from WebSocket)
      await page.evaluate(() => {
        window.dispatchEvent(new CustomEvent('new-booking', {
          detail: {
            id: 'booking-123',
            customerName: 'John Doe',
            serviceName: 'Wedding Photography',
            eventDate: '2024-06-15',
          }
        }));
      });
      
      // Should show notification
      await expect(page.locator('[data-testid="notification-toast"]')).toBeVisible();
      await expect(page.locator('text=New booking received')).toBeVisible();
      
      // Notification bell should show count
      await expect(page.locator('[data-testid="notification-count"]')).toBeVisible();
    });

    await test.step('View notification details', async () => {
      await page.click('[data-testid="notification-bell"]');
      
      await expect(page.locator('[data-testid="notifications-dropdown"]')).toBeVisible();
      await expect(page.locator('[data-testid="notification-item"]')).toBeVisible();
      
      // Click on notification to view details
      await page.click('[data-testid="notification-item"]', { first: true });
      
      // Should navigate to booking details
      await expect(page.locator('[data-testid="booking-detail"]')).toBeVisible();
    });
  });

  test('supports mobile provider dashboard', async ({ page, isMobile }) => {
    test.skip(!isMobile, 'This test is only for mobile');
    
    await test.step('Navigate mobile dashboard', async () => {
      // Mobile navigation should be collapsed
      await expect(page.locator('[data-testid="mobile-nav-toggle"]')).toBeVisible();
      
      await page.tap('[data-testid="mobile-nav-toggle"]');
      await expect(page.locator('[data-testid="mobile-nav-menu"]')).toBeVisible();
      
      await page.tap('[data-testid="nav-bookings"]');
      await expect(page.locator('[data-testid="mobile-bookings-page"]')).toBeVisible();
    });

    await test.step('Manage bookings on mobile', async () => {
      // Mobile booking cards should be touch-optimized
      await page.tap('[data-testid="booking-item"]', { first: true });
      
      await expect(page.locator('[data-testid="mobile-booking-detail"]')).toBeVisible();
      
      // Mobile action buttons
      await expect(page.locator('[data-testid="mobile-confirm-button"]')).toBeVisible();
      await expect(page.locator('[data-testid="mobile-message-button"]')).toBeVisible();
    });
  });

  test('handles offline functionality', async ({ page, context }) => {
    await test.step('Work offline', async () => {
      // Go offline
      await context.setOffline(true);
      
      // Should show offline indicator
      await expect(page.locator('[data-testid="offline-indicator"]')).toBeVisible();
      
      // Cached data should still be available
      await expect(page.locator('[data-testid="cached-bookings"]')).toBeVisible();
      
      // Actions should be queued
      await page.click('[data-testid="confirm-booking-button"]', { first: true });
      await expect(page.locator('[data-testid="action-queued"]')).toBeVisible();
    });

    await test.step('Sync when back online', async () => {
      // Go back online
      await context.setOffline(false);
      
      // Should sync queued actions
      await expect(page.locator('[data-testid="syncing-indicator"]')).toBeVisible();
      await expect(page.locator('[data-testid="sync-complete"]')).toBeVisible();
      
      // Offline indicator should disappear
      await expect(page.locator('[data-testid="offline-indicator"]')).not.toBeVisible();
    });
  });
});