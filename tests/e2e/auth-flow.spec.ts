import { test, expect } from '@playwright/test';

/**
 * E2E Tests: Authentication Flow
 * Tests complete user authentication journey
 */

test.describe('Authentication Flow', () => {
  test('should display login page', async ({ page }) => {
    await page.goto('/');

    // Should redirect to login if not authenticated
    await expect(page).toHaveURL(/.*\/(login|auth\/signin)/);
    await expect(page.locator('h1, h2').filter({ hasText: /sign in|login/i })).toBeVisible();
  });

  test('should show GitHub OAuth button', async ({ page }) => {
    await page.goto('/auth/signin');

    const githubButton = page.locator('button, a').filter({ hasText: /github/i });
    await expect(githubButton).toBeVisible();
  });

  test('should validate email input', async ({ page }) => {
    await page.goto('/auth/signin');

    // Try to submit with invalid email
    const emailInput = page.locator('input[type="email"]').first();
    if (await emailInput.isVisible()) {
      await emailInput.fill('invalid-email');
      await page.locator('button[type="submit"]').first().click();

      // Should show validation error
      await expect(page.locator('text=/invalid|error/i')).toBeVisible({ timeout: 5000 });
    }
  });

  test('should navigate to signup page', async ({ page }) => {
    await page.goto('/auth/signin');

    const signupLink = page.locator('a').filter({ hasText: /sign up|create account/i });
    if (await signupLink.isVisible()) {
      await signupLink.click();
      await expect(page).toHaveURL(/.*\/(signup|register|auth\/signup)/);
    }
  });
});

test.describe('Protected Routes', () => {
  test('should redirect to login when accessing dashboard without auth', async ({ page }) => {
    await page.goto('/dashboard');

    // Should redirect to login
    await page.waitForURL(/.*\/(login|auth\/signin)/, { timeout: 5000 });
    expect(page.url()).toMatch(/\/(login|auth\/signin)/);
  });

  test('should redirect to login when accessing projects without auth', async ({ page }) => {
    await page.goto('/dashboard/projects');

    await page.waitForURL(/.*\/(login|auth\/signin)/, { timeout: 5000 });
    expect(page.url()).toMatch(/\/(login|auth\/signin)/);
  });

  test('should redirect to login when accessing content without auth', async ({ page }) => {
    await page.goto('/dashboard/content');

    await page.waitForURL(/.*\/(login|auth\/signin)/, { timeout: 5000 });
    expect(page.url()).toMatch(/\/(login|auth\/signin)/);
  });
});
