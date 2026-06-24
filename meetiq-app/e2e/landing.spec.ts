import { test, expect } from '@playwright/test';

test.describe('Landing Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('renders hero section with heading', async ({ page }) => {
    await expect(page.locator('h1')).toContainText('confirmed commitments');
  });

  test('both CTA buttons are visible and link correctly', async ({ page }) => {
    const startFree = page.getByText('Start Free Trial');
    await expect(startFree).toBeVisible();
    await expect(startFree).toHaveAttribute('href', '/register');

    const accessDashboard = page.getByText('Access Dashboard');
    await expect(accessDashboard).toBeVisible();
    await expect(accessDashboard).toHaveAttribute('href', '/login');
  });

  test('navigation links work', async ({ page }) => {
    await page.getByText('Start Free Trial').click();
    await expect(page).toHaveURL(/\/register/);
  });
});

test.describe('Authentication Flow', () => {
  test('login page renders form', async ({ page }) => {
    await page.goto('/login');
    await expect(page.getByLabel(/email/i)).toBeVisible();
    await expect(page.getByLabel(/password/i)).toBeVisible();
    await expect(page.getByRole('button', { name: /sign in/i })).toBeVisible();
  });

  test('register page renders form', async ({ page }) => {
    await page.goto('/register');
    await expect(page.getByLabel(/email/i)).toBeVisible();
    await expect(page.getByLabel(/password/i)).toBeVisible();
  });
});
