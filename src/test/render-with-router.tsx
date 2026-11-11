import { QueryClientProvider } from '@tanstack/react-query'
import {
  RouterProvider,
  createMemoryHistory,
  createRootRoute,
  createRoute,
  createRouter,
} from '@tanstack/react-router'
import { render } from '@testing-library/react'

import { createQueryClient } from '@/lib/query-client'

/**
 * Renders `ui` at "/" inside a real router (so Link works) and a fresh query client.
 * The component under test is mounted as the index route; extra paths are catch-all stubs.
 */
export async function renderWithRouter(ui: React.ReactNode, url = '/') {
  const rootRoute = createRootRoute()
  const index = createRoute({ getParentRoute: () => rootRoute, path: '/', component: () => ui })
  const splat = createRoute({ getParentRoute: () => rootRoute, path: '$', component: () => null })
  const router = createRouter({
    routeTree: rootRoute.addChildren([index, splat]),
    history: createMemoryHistory({ initialEntries: [url] }),
  })
  const queryClient = createQueryClient()
  await router.load()
  return render(
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
    </QueryClientProvider>,
  )
}
