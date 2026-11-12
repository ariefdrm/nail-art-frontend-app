import axios from 'axios'

import { ENV } from '@/lib/env'

import { ApiError, toApiError } from './errors'

import type { TokenPair } from './types'

/**
 * The only instance with credentials: the refresh cookie (Path=/api/v1/auth) must travel on the auth
 * calls and nowhere else. No interceptors, so a failing refresh can never trigger another refresh.
 */
const authClient = axios.create({
  baseURL: ENV.VITE_API_BASE_URL,
  timeout: 15_000,
  withCredentials: true,
})

/** What the app keeps from a token response. `refresh_token` in the body is dropped on purpose. */
export type AccessGrant = Pick<TokenPair, 'access_token' | 'expires_in'>

function toGrant(pair: TokenPair): AccessGrant {
  return { access_token: pair.access_token, expires_in: pair.expires_in }
}

/** 403 on the cookie routes means the page origin is not in the backend CORS_ORIGINS. */
function toAuthError(error: unknown): ApiError {
  const apiError = toApiError(error)
  if (apiError.status !== 403) return apiError
  return new ApiError({
    status: 403,
    code: 'ORIGIN_NOT_ALLOWED',
    message: apiError.message,
  })
}

/** POST /auth/login. The backend sets the refresh cookie; only the access grant is returned. */
export async function postLogin(email: string, password: string): Promise<AccessGrant> {
  try {
    const res = await authClient.post<{ data: TokenPair }>('/auth/login', { email, password })
    return toGrant(res.data.data)
  } catch (error) {
    throw toAuthError(error)
  }
}

/** POST /auth/refresh with the cookie and no body (a body token would win over the cookie). */
export async function postRefresh(): Promise<AccessGrant> {
  try {
    const res = await authClient.post<{ data: TokenPair }>('/auth/refresh')
    return toGrant(res.data.data)
  } catch (error) {
    throw toAuthError(error)
  }
}

/** POST /auth/logout with the cookie and no body; the backend clears the cookie. Idempotent. */
export async function postLogout(): Promise<void> {
  try {
    await authClient.post('/auth/logout')
  } catch (error) {
    throw toAuthError(error)
  }
}
