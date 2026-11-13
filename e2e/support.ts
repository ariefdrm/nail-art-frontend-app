import type { APIRequestContext } from '@playwright/test'

export const API_URL = process.env.E2E_API_URL ?? 'http://localhost:3000/api/v1'

/** A WIB calendar day, `offset` days from today, as YYYY-MM-DD. */
export function wibDay(offset: number): string {
  const wibNow = Date.now() + 7 * 3_600_000
  return new Date(wibNow + offset * 86_400_000).toISOString().slice(0, 10)
}

export type BookableSlot = { serviceId: string; serviceName: string; day: string }

/** The first service with a free slot in the next two weeks, or null when the studio has none. */
export async function findBookableDay(request: APIRequestContext): Promise<BookableSlot | null> {
  const services = (await (await request.get(`${API_URL}/services`)).json()) as {
    data: { id: string; name: string }[]
  }
  for (const service of services.data) {
    for (let offset = 1; offset <= 14; offset += 1) {
      const day = wibDay(offset)
      const res = await request.get(`${API_URL}/availability`, {
        params: { service_id: service.id, date: day },
      })
      if (!res.ok()) continue
      const body = (await res.json()) as { data: { slots: unknown[] } }
      if (body.data.slots.length > 0)
        return { serviceId: service.id, serviceName: service.name, day }
    }
  }
  return null
}
