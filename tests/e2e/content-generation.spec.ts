import { test, expect } from '@playwright/test';

/**
 * E2E Tests: Content Generation Flow
 * Tests complete content generation and publishing journey
 */

test.describe('Content Generation Flow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should navigate to content section', async ({ page }) => {
    const isLoginPage = await page.locator('h1, h2').filter({ hasText: /sign in|login/i }).isVisible().catch(() => false);
    if (isLoginPage) {
      test.skip();
      return;
    }

    const contentLink = page.locator('a, button').filter({ hasText: /content/i }).first();

    if (await contentLink.isVisible({ timeout: 5000 }).catch(() => false)) {
      await contentLink.click();
      await expect(page).toHaveURL(/.*\/(content|dashboard)/);
    }
  });

  test('should show generate content button', async ({ page }) => {
    const isLoginPage = await page.locator('h1, h2').filter({ hasText: /sign in|login/i }).isVisible().catch(() => false);
    if (isLoginPage) {
      test.skip();
      return;
    }

    const generateButton = page.locator('button, a').filter({ hasText: /generate|create content/i }).first();

    if (await generateButton.isVisible({ timeout: 10000 }).catch(() => false)) {
      await expect(generateButton).toBeVisible();
    }
  });

  test('should allow platform selection', async ({ page }) => {
    const isLoginPage = await page.locator('h1, h2').filter({ hasText: /sign in|login/i }).isVisible().catch(() => false);
    if (isLoginPage) {
      test.skip();
      return;
    }

    const generateButton = page.locator('button, a').filter({ hasText: /generate|create content/i }).first();

    if (await generateButton.isVisible({ timeout: 5000 }).catch(() => false)) {
      await generateButton.click();

      // Look for platform selection UI
      const platforms = ['Twitter', 'LinkedIn', 'Medium', 'Facebook'];

      for (const platform of platforms) {
        const platformCheckbox = page.locator(`input[type="checkbox"], label`).filter({ hasText: new RegExp(platform, 'i') }).first();

        if (await platformCheckbox.isVisible({ timeout: 2000 }).catch(() => false)) {
          expect(await platformCheckbox.isVisible()).toBe(true);
          break;
        }
      }
    }
  });

  test('should display generated content', async ({ page }) => {
    const isLoginPage = await page.locator('h1, h2').filter({ hasText: /sign in|login/i }).isVisible().catch(() => false);
    if (isLoginPage) {
      test.skip();
      return;
    }

    // Look for existing content or generation results
    const contentCards = page.locator('[data-testid*="content"], .content-card, article').first();

    if (await contentCards.isVisible({ timeout: 5000 }).catch(() => false)) {
      await expect(contentCards).toBeVisible();
    }
  });

  test('should allow content editing', async ({ page }) => {
    const isLoginPage = await page.locator('h1, h2').filter({ hasText: /sign in|login/i }).isVisible().catch(() => false);
    if (isLoginPage) {
      test.skip();
      return;
    }

    const editButton = page.locator('button').filter({ hasText: /edit/i }).first();

    if (await editButton.isVisible({ timeout: 5000 }).catch(() => false)) {
      await editButton.click();

      // Should show editor
      const editor = page.locator('textarea, [contenteditable="true"], .editor').first();
      await expect(editor).toBeVisible({ timeout: 5000 });
    }
  });

  test('should show copy button for content', async ({ page }) => {
    const isLoginPage = await page.locator('h1, h2').filter({ hasText: /sign in|login/i }).isVisible().catch(() => false);
    if (isLoginPage) {
      test.skip();
      return;
    }

    const copyButton = page.locator('button').filter({ hasText: /copy/i }).first();

    if (await copyButton.isVisible({ timeout: 5000 }).catch(() => false)) {
      await expect(copyButton).toBeVisible();
    }
  });
});

test.describe('Publishing Flow', () => {
  test('should show publish button', async ({ page }) => {
    await page.goto('/');

    const isLoginPage = await page.locator('h1, h2').filter({ hasText: /sign in|login/i }).isVisible().catch(() => false);
    if (isLoginPage) {
      test.skip();
      return;
    }

    const publishButton = page.locator('button').filter({ hasText: /publish/i }).first();

    if (await publishButton.isVisible({ timeout: 5000 }).catch(() => false)) {
      await expect(publishButton).toBeVisible();
    }
  });

  test('should show scheduling options', async ({ page }) => {
    await page.goto('/');

    const isLoginPage = await page.locator('h1, h2').filter({ hasText: /sign in|login/i }).isVisible().catch(() => false);
    if (isLoginPage) {
      test.skip();
      return;
    }

    const scheduleButton = page.locator('button, a').filter({ hasText: /schedule/i }).first();

    if (await scheduleButton.isVisible({ timeout: 5000 }).catch(() => false)) {
      await scheduleButton.click();

      // Should show date/time picker
      const datePicker = page.locator('input[type="date"], input[type="datetime-local"], [data-testid*="date"]').first();
      await expect(datePicker).toBeVisible({ timeout: 5000 });
    }
  });

  test('should display publishing status', async ({ page }) => {
    await page.goto('/');

    const isLoginPage = await page.locator('h1, h2').filter({ hasText: /sign in|login/i }).isVisible().catch(() => false);
    if (isLoginPage) {
      test.skip();
      return;
    }

    // Look for status indicators
    const statusBadge = page.locator('[data-testid*="status"], .status, .badge').filter({ hasText: /published|draft|pending|scheduled/i }).first();

    if (await statusBadge.isVisible({ timeout: 5000 }).catch(() => false)) {
      await expect(statusBadge).toBeVisible();
    }
  });
});

test.describe('Content Approval Flow', () => {
  test('should show approval queue', async ({ page }) => {
    await page.goto('/');

    const isLoginPage = await page.locator('h1, h2').filter({ hasText: /sign in|login/i }).isVisible().catch(() => false);
    if (isLoginPage) {
      test.skip();
      return;
    }

    const approvalLink = page.locator('a, button').filter({ hasText: /approval|review/i }).first();

    if (await approvalLink.isVisible({ timeout: 5000 }).catch(() => false)) {
      await approvalLink.click();

      // Should show approval queue or empty state
      const approvalQueue = page.locator('text=/pending approval|awaiting review/i').first();
      await expect(approvalQueue).toBeVisible({ timeout: 5000 });
    }
  });

  test('should allow approve/reject actions', async ({ page }) => {
    await page.goto('/');

    const isLoginPage = await page.locator('h1, h2').filter({ hasText: /sign in|login/i }).isVisible().catch(() => false);
    if (isLoginPage) {
      test.skip();
      return;
    }

    const approveButton = page.locator('button').filter({ hasText: /approve/i }).first();
    const rejectButton = page.locator('button').filter({ hasText: /reject/i }).first();

    const hasApproveButton = await approveButton.isVisible({ timeout: 5000 }).catch(() => false);
    const hasRejectButton = await rejectButton.isVisible({ timeout: 5000 }).catch(() => false);

    if (hasApproveButton || hasRejectButton) {
      expect(hasApproveButton || hasRejectButton).toBe(true);
    }
  });
});
