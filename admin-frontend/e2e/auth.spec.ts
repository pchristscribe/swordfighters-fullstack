import { test, expect } from '@playwright/test'

test.describe('Admin Authentication', () => {
  test('unauthenticated user is redirected to login', async ({ page }) => {
    await page.goto('/')
    await expect(page).toHaveURL(/\/login/)
  })

  test('login page renders correctly', async ({ page }) => {
    await page.goto('/login')
    await expect(page.locator('input[type="email"]')).toBeVisible()
    await expect(page.getByRole('button', { name: /login|sign in/i })).toBeVisible()
  })

  test('login rejects empty email', async ({ page }) => {
    await page.goto('/login')
    await page.getByRole('button', { name: /login|sign in/i }).click()
    await expect(page.locator('text=/email|required/i')).toBeVisible()
  })

  test('login rejects invalid email format', async ({ page }) => {
    await page.goto('/login')
    await page.locator('input[type="email"]').fill('not-an-email')
    await page.getByRole('button', { name: /login|sign in/i }).click()
    await expect(page.locator('text=/invalid|format|email/i')).toBeVisible()
  })

  test('CSP header is present', async ({ page }) => {
    const response = await page.goto('/login')
    const csp = await response?.headerValue('content-security-policy')
    if (!csp) {
      const html = await page.content()
      expect(html).toContain('Content-Security-Policy')
    }
  })

  test('protected routes redirect to login', async ({ page }) => {
    const protectedPaths = ['/products', '/categories', '/reviews']
    for (const path of protectedPaths) {
      await page.goto(path)
      await expect(page).toHaveURL(/\/login/)
    }
  })
})
