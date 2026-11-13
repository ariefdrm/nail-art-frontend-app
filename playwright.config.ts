import { defineConfig, devices } from '@playwright/test'

/**
 * End-to-end smoke tests (PRD FE-18). They drive a real browser against a stack you start yourself:
 * the backend, then the frontend (`bun --bun run dev` or the dev container).
 *
 *   E2E_BASE_URL   frontend, default http://localhost:5173
 *   E2E_API_URL    backend API, default http://localhost:3000/api/v1
 *   E2E_ADMIN_EMAIL / E2E_ADMIN_PASSWORD   enable the admin specs (never committed)
 */
export default defineConfig({
  testDir: 'e2e',
  fullyParallel: false,
  // The backend rate-limits bookings and lookups per IP, so run one test at a time.
  workers: 1,
  retries: 0,
  reporter: [['list']],
  use: {
    baseURL: process.env.E2E_BASE_URL ?? 'http://localhost:5173',
    locale: 'id-ID',
    timezoneId: 'Asia/Jakarta',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  projects: [
    { name: 'desktop', use: { ...devices['Desktop Chrome'] } },
    { name: 'phone', use: { ...devices['Pixel 5'] } },
  ],
})
