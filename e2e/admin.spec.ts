import { expect, test } from '@playwright/test'

// Needs a real owner or staff account, passed through the environment so it is never written down:
//   E2E_ADMIN_EMAIL=... E2E_ADMIN_PASSWORD=... bun --bun run test:e2e
const email = process.env.E2E_ADMIN_EMAIL
const password = process.env.E2E_ADMIN_PASSWORD

test.describe('admin', () => {
  test.skip(
    !email || !password,
    'Set E2E_ADMIN_EMAIL and E2E_ADMIN_PASSWORD to run the admin specs.',
  )

  test('S-11: a wrong password gets one generic answer', async ({ page }) => {
    await page.goto('/admin/login')
    await page.getByLabel('Email').fill(email ?? '')
    await page.getByLabel('Kata sandi').fill('bukan-kata-sandi-yang-benar')
    await page.getByRole('button', { name: 'Masuk' }).click()
    await expect(page.getByText('Email atau kata sandi salah.')).toBeVisible()
  })

  test('sign in, keep the session across a reload and a new tab, then sign out', async ({
    page,
    context,
  }) => {
    await page.goto('/admin/login')
    await page.getByLabel('Email').fill(email ?? '')
    await page.getByLabel('Kata sandi').fill(password ?? '')
    await page.getByRole('button', { name: 'Masuk' }).click()
    await expect(page.getByRole('heading', { name: 'Dashboard' })).toBeVisible()

    await page.reload()
    await expect(page.getByRole('heading', { name: 'Dashboard' })).toBeVisible()

    const second = await context.newPage()
    await second.goto('/admin/reservasi')
    await expect(second.getByRole('heading', { name: 'Reservasi' })).toBeVisible()

    // Signing out in one tab signs out the other.
    await page.getByRole('button', { name: 'Keluar' }).click()
    await expect(page.getByRole('heading', { name: 'Masuk' })).toBeVisible()
    await expect(second.getByRole('heading', { name: 'Masuk' })).toBeVisible()
  })

  test('the main admin pages open', async ({ page }) => {
    await page.goto('/admin/login')
    await page.getByLabel('Email').fill(email ?? '')
    await page.getByLabel('Kata sandi').fill(password ?? '')
    await page.getByRole('button', { name: 'Masuk' }).click()
    await expect(page.getByRole('heading', { name: 'Dashboard' })).toBeVisible()

    for (const [path, heading] of [
      ['/admin/reservasi', 'Reservasi'],
      ['/admin/layanan', 'Layanan'],
      ['/admin/artist', 'Artist'],
      ['/admin/jadwal', 'Jadwal'],
      ['/admin/notifikasi', 'Notifikasi'],
      ['/admin/pengaturan', 'Pengaturan'],
    ] as const) {
      await page.goto(path)
      await expect(page.getByRole('heading', { name: heading, exact: true })).toBeVisible()
    }
  })
})
