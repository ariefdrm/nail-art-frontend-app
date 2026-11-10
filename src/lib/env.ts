import { z } from 'zod'

const envSchema = z.object({
  VITE_API_BASE_URL: z.string().url(),
  VITE_MAX_ADVANCE_DAYS: z.coerce.number().int().min(1).max(365),
})

/** Validated browser env. Fails loudly at startup instead of sending requests to nowhere. */
export const ENV = envSchema.parse(import.meta.env)
