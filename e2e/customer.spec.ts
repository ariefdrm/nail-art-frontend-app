import { expect, test } from '@playwright/test'

import { findBookableDay } from './support'

// Scenarios S-01 and S-04 from the PRD. S-01 books a real slot and cancels it again, so it leaves
// one cancelled booking named "Uji Otomatis" in the database it runs against.

test('S-04: a wrong code and phone give one generic answer', async ({ page }) => {
  await page.goto('/cek-booking')
  await page.getByLabel('Kode booking').fill('NP-20000101-ZZZZ')
  await page.getByLabel('Nomor HP').fill('0812 0000 0001')
  await page.getByRole('button', { name: 'Cari pesanan' }).click()

  await expect(
    page.getByText('Reservasi tidak ditemukan. Periksa kode booking dan nomor HP Anda.'),
  ).toBeVisible()
})

test('S-01: book a slot, look it up with the code, cancel it', async ({ page, request }) => {
  const bookable = await findBookableDay(request)
  test.skip(bookable === null, 'The studio has no service with a free slot in the next 14 days.')
  if (!bookable) return

  await page.goto(`/pesan?layanan=${bookable.serviceId}&langkah=2&tanggal=${bookable.day}`)
  await expect(page.getByRole('heading', { name: 'Pilih tanggal dan jam' })).toBeVisible()

  await page
    .getByRole('button', { name: /^\d{2}\.\d{2}$/ })
    .first()
    .click()
  await page.getByRole('button', { name: 'Lanjut' }).click()

  await expect(page.getByRole('heading', { name: 'Isi data Anda' })).toBeVisible()
  await page.getByLabel('Nama', { exact: true }).fill('Uji Otomatis')
  await page.getByLabel('Nomor HP').fill('0812 0000 0002')
  await page.getByRole('button', { name: 'Lanjut' }).click()

  await expect(page.getByRole('heading', { name: 'Tinjau dan kirim' })).toBeVisible()
  await page.getByRole('button', { name: 'Kirim pemesanan' }).click()

  await expect(page.getByRole('heading', { name: 'Pemesanan terkirim' })).toBeVisible()
  const code =
    (await page
      .getByText(/^NP-\d{8}-[A-Z0-9]{4}$/)
      .first()
      .textContent()) ?? ''
  expect(code).toMatch(/^NP-\d{8}-[A-Z0-9]{4}$/)

  await page.goto('/cek-booking')
  await page.getByLabel('Kode booking').fill(code.toLowerCase())
  await page.getByLabel('Nomor HP').fill('+62 812 0000 0002')
  await page.getByRole('button', { name: 'Cari pesanan' }).click()
  await expect(page.getByText('Menunggu konfirmasi')).toBeVisible()

  await page.getByRole('button', { name: 'Batalkan pemesanan' }).click()
  await page.getByRole('button', { name: 'Batalkan pemesanan' }).last().click()
  await expect(page.getByText('Dibatalkan')).toBeVisible()
})
