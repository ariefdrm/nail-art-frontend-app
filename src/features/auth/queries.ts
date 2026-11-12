import { queryOptions, useMutation, useQueryClient } from '@tanstack/react-query'

import { postLogin } from '@/lib/api/auth-endpoints'
import { endLocalSession, logout, startSession } from '@/lib/auth/session'

import { fetchMe, logoutAllRequest } from './api'

import type { LoginValues } from './schemas'

export const authKeys = { me: ['auth', 'me'] as const }

export const meOptions = () =>
  queryOptions({
    queryKey: authKeys.me,
    queryFn: fetchMe,
    staleTime: 300_000,
    // A 401 here already went through refresh-and-retry; retrying again would only delay the login page.
    retry: false,
  })

export function useLoginMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (values: LoginValues) => {
      const grant = await postLogin(values.email, values.password)
      startSession(grant)
      return fetchMe()
    },
    onSuccess: (admin) => {
      queryClient.setQueryData(authKeys.me, admin)
    },
  })
}

/** Ends this browser's session, then drops everything cached for the admin. */
export function useLogoutMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: logout,
    onSettled: () => {
      queryClient.clear()
    },
  })
}

export function useLogoutAllMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: logoutAllRequest,
    onSuccess: () => {
      // The backend revoked every session and cleared the cookie; forget the local token too.
      endLocalSession()
      queryClient.clear()
    },
  })
}
