// Service worker for Web Push (PRD FE-16). Plain JavaScript on purpose: it is served as-is from
// the site root and runs outside the app bundle.
//
// The push payload is { notification_id, booking_id, type, title, body }. The text comes from the
// API, which keeps personal data (phone numbers, full names) out of it.

self.addEventListener('push', (event) => {
  let payload = {}
  try {
    payload = event.data ? event.data.json() : {}
  } catch {
    payload = {}
  }

  const title =
    typeof payload.title === 'string' && payload.title ? payload.title : 'The Nail Palace'
  const url = payload.booking_id
    ? `/admin/reservasi?id=${encodeURIComponent(payload.booking_id)}`
    : '/admin/notifikasi'

  event.waitUntil(
    self.registration.showNotification(title, {
      body: typeof payload.body === 'string' ? payload.body : '',
      // Same id replaces an earlier notification instead of stacking duplicates.
      tag: payload.notification_id || undefined,
      data: { url },
    }),
  )
})

self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  const target = new URL(event.notification.data?.url || '/admin/notifikasi', self.location.origin)

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windows) => {
      // Reuse a tab that is already on this site instead of opening another one.
      const existing = windows.find((client) => new URL(client.url).origin === target.origin)
      if (existing) {
        return existing
          .navigate(target.href)
          .then((client) => (client ? client.focus() : undefined))
      }
      return self.clients.openWindow(target.href)
    }),
  )
})
