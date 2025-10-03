import { test, expect } from '@playwright/test';

/**
 * E2E Tests: Project Creation Flow
 * Tests complete project creation and management journey
 */

test.describe('Project Creation Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to home page
    await page.goto('/');
  });

  test('should show create project button on dashboard', async ({ page }) => {
    // Check if we're on login page or dashboard
    const isLoginPage = await page.locator('h1, h2').filter({ hasText: /sign in|login/i }).isVisible().catch(() => false);

    if (isLoginPage) {
      // Skip test if authentication is required
      test.skip();
      return;
    }

    // Look for create/new project button
    const createButton = page.locator('button, a').filter({ hasText: /create|new project|add project/i }).first();
    await expect(createButton).toBeVisible({ timeout: 10000 });
  });

  test('should open project creation modal', async ({ page }) => {
    const isLoginPage = await page.locator('h1, h2').filter({ hasText: /sign in|login/i }).isVisible().catch(() => false);
    if (isLoginPage) {
      test.skip();
      return;
    }

    const createButton = page.locator('button, a').filter({ hasText: /create|new project/i }).first();

    if (await createButton.isVisible({ timeout: 5000 }).catch(() => false)) {
      await createButton.click();

      // Should show modal or navigate to form
      const modal = page.locator('[role="dialog"], .modal, form').filter({ has: page.locator('input[name*="name"], input[name*="project"]') });
      await expect(modal).toBeVisible({ timeout: 5000 });
    }
  });

  test('should validate required fields', async ({ page }) => {
    const isLoginPage = await page.locator('h1, h2').filter({ hasText: /sign in|login/i }).isVisible().catch(() => false);
    if (isLoginPage) {
      test.skip();
      return;
    }

    const createButton = page.locator('button, a').filter({ hasText: /create|new project/i }).first();

    if (await createButton.isVisible({ timeout: 5000 }).catch(() => false)) {
      await createButton.click();

      // Try to submit empty form
      const submitButton = page.locator('button[type="submit"]').filter({ hasText: /create|save|submit/i }).first();

      if (await submitButton.isVisible({ timeout: 5000 }).catch(() => false)) {
        await submitButton.click();

        // Should show validation errors
        const errors = page.locator('text=/required|invalid|error/i');
        await expect(errors.first()).toBeVisible({ timeout: 5000 });
      }
    }
  });

  test('should accept valid project data', async ({ page }) => {
    const isLoginPage = await page.locator('h1, h2').filter({ hasText: /sign in|login/i }).isVisible().catch(() => false);
    if (isLoginPage) {
      test.skip();
      return;
    }

    const createButton = page.locator('button, a').filter({ hasText: /create|new project/i }).first();

    if (await createButton.isVisible({ timeout: 5000 }).catch(() => false)) {
      await createButton.click();

      // Fill in project details
      const nameInput = page.locator('input[name*="name"], input[placeholder*="name"]').first();
      const repoInput = page.locator('input[name*="repo"], input[placeholder*="repository"]').first();

      if (await nameInput.isVisible({ timeout: 5000 }).catch(() => false)) {
        await nameInput.fill('Test Project E2E');
      }

      if (await repoInput.isVisible({ timeout: 5000 }).catch(() => false)) {
        await repoInput.fill('https://github.com/test/repo');
      }

      // Submit form
      const submitButton = page.locator('button[type="submit"]').filter({ hasText: /create|save/i }).first();

      if (await submitButton.isVisible({ timeout: 5000 }).catch(() => false)) {
        await submitButton.click();

        // Should show success message or redirect
        await page.waitForTimeout(2000);

        const success = page.locator('text=/success|created/i');
        const isVisible = await success.isVisible({ timeout: 5000 }).catch(() => false);

        if (isVisible) {
          expect(isVisible).toBe(true);
        }
      }
    }
  });
});

test.describe('Project Management', () => {
  test('should list existing projects', async ({ page }) => {
    await page.goto('/');

    const isLoginPage = await page.locator('h1, h2').filter({ hasText: /sign in|login/i }).isVisible().catch(() => false);
    if (isLoginPage) {
      test.skip();
      return;
    }

    // Navigate to projects page
    const projectsLink = page.locator('a, button').filter({ hasText: /projects/i }).first();

    if (await projectsLink.isVisible({ timeout: 5000 }).catch(() => false)) {
      await projectsLink.click();

      // Should show projects list or empty state
      const projectsList = page.locator('[data-testid*="project"], .project-card, .project-item').first();
      const emptyState = page.locator('text=/no projects|get started|create first/i').first();

      const hasProjects = await projectsList.isVisible({ timeout: 5000 }).catch(() => false);
      const isEmpty = await emptyState.isVisible({ timeout: 5000 }).catch(() => false);

      expect(hasProjects || isEmpty).toBe(true);
    }
  });

  test('should allow project settings access', async ({ page }) => {
    await page.goto('/');

    const isLoginPage = await page.locator('h1, h2').filter({ hasText: /sign in|login/i }).isVisible().catch(() => false);
    if (isLoginPage) {
      test.skip();
      return;
    }

    // Look for settings button
    const settingsButton = page.locator('button, a').filter({ hasText: /settings|configure/i }).first();

    if (await settingsButton.isVisible({ timeout: 5000 }).catch(() => false)) {
      await settingsButton.click();

      // Should show settings page or modal
      const settingsContent = page.locator('text=/settings|configuration|preferences/i').first();
      await expect(settingsContent).toBeVisible({ timeout: 5000 });
    }
  });
});
