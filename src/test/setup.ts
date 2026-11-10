import '@testing-library/jest-dom/vitest'
import { cleanup } from '@testing-library/react'
import axios from 'axios'
import { afterAll, afterEach, beforeAll } from 'vitest'

import { clearSession } from '@/lib/auth/token-store'

import { server } from './server'

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }))
afterEach(() => {
  server.resetHandlers()
  cleanup()
  clearSession()
})
afterAll(() => server.close())

// Use fetch so MSW intercepts requests without browser-style CORS checks.
axios.defaults.adapter = 'fetch'
