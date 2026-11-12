import { api } from '@/lib/api/client'

import type { Admin } from '@/lib/api/types'

export async function fetchMe(): Promise<Admin> {
  const res = await api.get<{ data: Admin }>('/auth/me')
  return res.data.data
}

/**
 * Ends every session of this admin. Goes through the shared client so an expired access token is
 * refreshed first; the credentials flag is what lets the backend clear the cookie.
 */
export async function logoutAllRequest(): Promise<void> {
  await api.post('/auth/logout-all', undefined, { withCredentials: true })
}
