import { test, expect } from '@playwright/test';

test.describe('/city page', () => {
  test('should not have console errors', async ({ page }) => {
    const errors: string[] = [];
    const consoleMessages: string[] = [];

    page.on('console', (msg) => {
      consoleMessages.push(`[console:${msg.type()}] ${msg.text()}`);
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });

    page.on('pageerror', (error) => {
      errors.push(`Page error: ${error.message}`);
    });

    // Disable 3D for E2E to avoid reconciler/runtime errors in headless
    await page.goto('/city?e2e_disable_3d=true', { waitUntil: 'load' });

    // Wait for client-side rendering and potential 3D loading
    await page.waitForTimeout(5000);

    // Check for specific React reconciler errors
    const hasReconcilerError = errors.some(error =>
      error.includes("Cannot read properties of undefined (reading 'ReactCurrentBatchConfig')") ||
      error.includes("Cannot read properties of undefined (reading 'ReactCurrentOwner')")
    );

    // Log all errors for debugging
    console.log('All console errors:', errors);
    console.log('Has reconciler error:', hasReconcilerError);

    expect(hasReconcilerError).toBe(false);
  });
});