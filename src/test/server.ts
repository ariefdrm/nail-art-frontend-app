import { HttpResponse, http } from 'msw'
import { setupServer } from 'msw/node'

export const API = 'http://api.test/api/v1'

/**
 * Answers that every admin page needs without being the subject of the test (the bell polls for
 * the unread count). A test that cares overrides them with server.use.
 */
export const server = setupServer(
  http.get(`${API}/admin/notifications/unread-count`, () =>
    HttpResponse.json({ data: { unread: 0 } }),
  ),
)
