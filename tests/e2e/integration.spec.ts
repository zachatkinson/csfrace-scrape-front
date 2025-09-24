import { test, expect } from '@playwright/test';

test.describe('Integration Tests @integration', () => {
  const API_URL = process.env.PLAYWRIGHT_API_URL || 'http://localhost:8000';
  const BASE_URL = process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:3000';

  test('should connect frontend to backend API @integration', async ({ page }) => {
    // Test basic API connectivity
    const response = await page.request.get(`${API_URL}/health`);
    expect(response.status()).toBe(200);

    const health = await response.json();
    expect(health).toHaveProperty('status');
    expect(health.status).toBe('healthy');
  });

  test('should load frontend application @integration', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Verify page loads successfully
    expect(page.url()).toContain(BASE_URL);
    
    // Check for basic page structure
    const body = await page.locator('body');
    await expect(body).toBeVisible();
  });

  test('should handle API authentication flow @integration', async ({ page }) => {
    // Test auth providers endpoint
    const response = await page.request.get(`${API_URL}/auth/providers`);
    expect(response.status()).toBe(200);

    const providers = await response.json();
    expect(providers).toHaveProperty('providers');
    expect(Array.isArray(providers.providers)).toBe(true);
  });

  test('should validate system info endpoint @integration', async ({ page }) => {
    const response = await page.request.get(`${API_URL}/system/info`);
    expect(response.status()).toBe(200);

    const systemInfo = await response.json();
    expect(systemInfo).toHaveProperty('version');
    expect(systemInfo).toHaveProperty('environment');
    expect(systemInfo).toHaveProperty('timestamp');
  });

  test('should handle scraping API endpoints @integration', async ({ page }) => {
    // Test scraping status endpoint
    const response = await page.request.get(`${API_URL}/scraping/status`);
    
    // Should return 200 or 401 (if authentication required)
    expect([200, 401]).toContain(response.status());
  });
});
