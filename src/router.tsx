import { createRouter as createTanStackRouter } from '@tanstack/react-router'

import { NotFoundPage } from '@/components/common/not-found-page'
import { RouteError } from '@/components/common/route-error'
import { createQueryClient } from '@/lib/query-client'

import { routeTree } from './routeTree.gen'

export function getRouter() {
  const queryClient = createQueryClient()

  const router = createTanStackRouter({
    routeTree,
    context: { queryClient },
    scrollRestoration: true,
    defaultPreload: 'intent',
    defaultPreloadStaleTime: 0,
    defaultNotFoundComponent: NotFoundPage,
    defaultErrorComponent: RouteError,
  })

  return router
}

declare module '@tanstack/react-router' {
  interface Register {
    router: ReturnType<typeof getRouter>
  }
}
