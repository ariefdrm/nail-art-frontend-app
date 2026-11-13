import { expect, test } from '@playwright/test'

// Cheap, read-only checks every public page must pass (PRD sections 9 and FE-01): a single h1,
// the page language, landmarks, alt text, no sideways scrolling, and a skip link first in the tab order.
const PUBLIC_PAGES = ['/', '/layanan', '/pesan', '/cek-booking', '/admin/login']

for (const path of PUBLIC_PAGES) {
  test(`${path} meets the basics`, async ({ page }) => {
    await page.goto(path)
    await page.waitForLoadState('networkidle')

    await expect(page.locator('html')).toHaveAttribute('lang', 'id')
    await expect(page.locator('h1')).toHaveCount(1)
    await expect(page.locator('main')).toHaveCount(1)

    const withoutAlt = await page.locator('img:not([alt])').count()
    expect(withoutAlt, 'images without alt text').toBe(0)

    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
    )
    expect(overflow, 'horizontal overflow in px').toBeLessThanOrEqual(0)
  })
}

test('the skip link is the first thing a keyboard reaches on the customer site', async ({
  page,
}) => {
  await page.goto('/')
  await page.keyboard.press('Tab')
  await expect(page.getByRole('link', { name: 'Lewati ke konten' })).toBeFocused()
})

test('an unknown address explains itself', async ({ page }) => {
  await page.goto('/tidak-ada-halaman-ini')
  await expect(page.getByRole('heading', { name: 'Halaman tidak ditemukan' })).toBeVisible()
})

test('the admin area sends a visitor without a session to the login page', async ({ page }) => {
  await page.goto('/admin/reservasi')
  await expect(page).toHaveURL(/\/admin\/login/)
  await expect(page.getByRole('heading', { name: 'Masuk' })).toBeVisible()
})
