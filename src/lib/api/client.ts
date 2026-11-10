import axios from 'axios'

import { SessionExpiredError, refreshAccessToken } from '@/lib/auth/refresh'
import { emitSessionExpired } from '@/lib/auth/session'
import { getAccessToken } from '@/lib/auth/token-store'
import { ENV } from '@/lib/env'

import { toApiError } from './errors'

import type { InternalAxiosRequestConfig } from 'axios'

type RetriableConfig = InternalAxiosRequestConfig & { _retried?: boolean }

/** The one axios instance. Only src/lib/api and features/*\/api.ts may import it. */
export const api = axios.create({
  baseURL: ENV.VITE_API_BASE_URL,
  timeout: 15_000,
})

function needsBearer(url: string | undefined): boolean {
  if (!url) return false
  return url.startsWith('/admin') || url === '/auth/me' || url === '/auth/logout-all'
}

api.interceptors.request.use((config) => {
  const token = getAccessToken()
  if (token && needsBearer(config.url)) config.headers.set('Authorization', `Bearer ${token}`)
  return config
})

api.interceptors.response.use(
  (response) => response,
  async (error: unknown) => {
    if (axios.isAxiosError(error) && error.response?.status === 401 && error.config) {
      const config: RetriableConfig = error.config
      if (needsBearer(config.url) && !config._retried) {
        config._retried = true
        const rejected = String(config.headers.get('Authorization') ?? '').replace('Bearer ', '')
        try {
          const token = await refreshAccessToken({ rejected: rejected || null })
          config.headers.set('Authorization', `Bearer ${token}`)
          return await api.request(config)
        } catch (refreshError) {
          if (refreshError instanceof SessionExpiredError) {
            emitSessionExpired()
            throw toApiError(error)
          }
          throw toApiError(refreshError)
        }
      }
    }
    throw toApiError(error)
  },
)
