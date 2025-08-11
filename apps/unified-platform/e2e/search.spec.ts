import { test, expect } from '@playwright/test';
import { searchQueries } from './fixtures/test-data';

test.describe('Search Functionality', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should display search interface on homepage', async ({ page }) => {
    // Check search bar is visible
    await expect(page.locator('[data-testid="search-bar"]')).toBeVisible();
    
    // Check search input placeholder
    await expect(page.locator('[data-testid="search-input"]')).toHaveAttribute(
      'placeholder', 
      /search for venues, catering, photography/i
    );
    
    // Check category browser is visible
    await expect(page.locator('[data-testid="category-browser"]')).toBeVisible();
  });

  test('should perform basic search', async ({ page }) => {
    // Enter search query
    await page.fill('[data-testid="search-input"]', searchQueries.wedding);
    
    // Click search button
    await page.click('[data-testid="search-button"]');
    
    // Wait for search results
    await page.waitForURL(/\/search\?/);
    
    // Check results are displayed
    await expect(page.locator('[data-testid="search-results"]')).toBeVisible();
    
    // Check search query is preserved in URL
    expect(page.url()).toContain(encodeURIComponent(searchQueries.wedding));
  });

  test('should filter search results', async ({ page }) => {
    // Perform initial search
    await page.fill('[data-testid="search-input"]', searchQueries.wedding);
    await page.click('[data-testid="search-button"]');
    await page.waitForURL(/\/search\?/);
    
    // Open filter panel
    await page.click('[data-testid="filter-button"]');
    await expect(page.locator('[data-testid="filter-panel"]')).toBeVisible();
    
    // Apply category filter
    await page.click('[data-testid="category-photography"]');
    
    // Apply price range filter
    await page.fill('[data-testid="price-min"]', searchQueries.priceRange[0].toString());
    await page.fill('[data-testid="price-max"]', searchQueries.priceRange[1].toString());
    
    // Apply filters
    await page.click('[data-testid="apply-filters"]');
    
    // Wait for filtered results
    await page.waitForLoadState('networkidle');
    
    // Check that filters are applied in URL
    expect(page.url()).toContain('category=Photography');
    expect(page.url()).toContain(`priceMin=${searchQueries.priceRange[0]}`);
    expect(page.url()).toContain(`priceMax=${searchQueries.priceRange[1]}`);
    
    // Check filter badges are displayed
    await expect(page.locator('[data-testid="filter-badge-photography"]')).toBeVisible();
  });

  test('should sort search results', async ({ page }) => {
    // Perform search
    await page.fill('[data-testid="search-input"]', searchQueries.wedding);
    await page.click('[data-testid="search-button"]');
    await page.waitForURL(/\/search\?/);
    
    // Open sort dropdown
    await page.click('[data-testid="sort-dropdown"]');
    
    // Select price low to high
    await page.click('[data-testid="sort-price-asc"]');
    
    // Wait for results to update
    await page.waitForLoadState('networkidle');
    
    // Check sort is applied in URL
    expect(page.url()).toContain('sort=price_asc');
    
    // Verify results are sorted by price
    const priceElements = await page.locator('[data-testid="service-price"]').all();
    const prices = await Promise.all(
      priceElements.map(el => el.textContent().then(text => 
        parseFloat(text?.replace(/[^0-9.]/g, '') || '0')
      ))
    );
    
    // Check prices are in ascending order
    for (let i = 1; i < prices.length; i++) {
      expect(prices[i]).toBeGreaterThanOrEqual(prices[i - 1]);
    }
  });

  test('should handle search suggestions', async ({ page }) => {
    // Start typing in search input
    await page.fill('[data-testid="search-input"]', 'wed');
    
    // Wait for suggestions to appear
    await expect(page.locator('[data-testid="search-suggestions"]')).toBeVisible();
    
    // Check suggestions contain relevant terms
    await expect(page.locator('[data-testid="suggestion-item"]').first()).toContainText(/wedding/i);
    
    // Click on a suggestion
    await page.click('[data-testid="suggestion-item"]').first();
    
    // Verify search is performed with selected suggestion
    await page.waitForURL(/\/search\?/);
    await expect(page.locator('[data-testid="search-results"]')).toBeVisible();
  });

  test('should handle location-based search', async ({ page }) => {
    // Enter location in search
    await page.fill('[data-testid="location-input"]', searchQueries.location);
    
    // Perform search
    await page.fill('[data-testid="search-input"]', searchQueries.venue);
    await page.click('[data-testid="search-button"]');
    
    // Wait for results
    await page.waitForURL(/\/search\?/);
    
    // Check location is in URL
    expect(page.url()).toContain(encodeURIComponent(searchQueries.location));
    
    // Check results show location information
    await expect(page.locator('[data-testid="service-location"]').first()).toBeVisible();
  });

  test('should handle empty search results', async ({ page }) => {
    // Search for something that won't have results
    await page.fill('[data-testid="search-input"]', 'xyznoresults123');
    await page.click('[data-testid="search-button"]');
    
    // Wait for search to complete
    await page.waitForURL(/\/search\?/);
    await page.waitForLoadState('networkidle');
    
    // Check empty state is displayed
    await expect(page.locator('[data-testid="no-results"]')).toBeVisible();
    await expect(page.locator('[data-testid="no-results"]')).toContainText(/no results found/i);
    
    // Check suggestions for alternative searches
    await expect(page.locator('[data-testid="search-suggestions-empty"]')).toBeVisible();
  });

  test('should clear filters', async ({ page }) => {
    // Perform search with filters
    await page.fill('[data-testid="search-input"]', searchQueries.wedding);
    await page.click('[data-testid="search-button"]');
    await page.waitForURL(/\/search\?/);
    
    // Apply filters
    await page.click('[data-testid="filter-button"]');
    await page.click('[data-testid="category-photography"]');
    await page.click('[data-testid="apply-filters"]');
    
    // Wait for filtered results
    await page.waitForLoadState('networkidle');
    
    // Clear all filters
    await page.click('[data-testid="clear-filters"]');
    
    // Wait for results to update
    await page.waitForLoadState('networkidle');
    
    // Check filters are removed from URL
    expect(page.url()).not.toContain('category=');
    
    // Check filter badges are removed
    await expect(page.locator('[data-testid="filter-badge-photography"]')).not.toBeVisible();
  });

  test('should handle search pagination', async ({ page }) => {
    // Perform search that will have many results
    await page.fill('[data-testid="search-input"]', 'service');
    await page.click('[data-testid="search-button"]');
    await page.waitForURL(/\/search\?/);
    
    // Check if pagination is present (only if there are enough results)
    const paginationExists = await page.locator('[data-testid="pagination"]').isVisible();
    
    if (paginationExists) {
      // Click next page
      await page.click('[data-testid="pagination-next"]');
      
      // Wait for new results to load
      await page.waitForLoadState('networkidle');
      
      // Check URL contains page parameter
      expect(page.url()).toContain('page=2');
      
      // Check results are different
      await expect(page.locator('[data-testid="search-results"]')).toBeVisible();
    }
  });
});