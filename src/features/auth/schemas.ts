import { z } from 'zod'

export const loginSchema = z.object({
  email: z.string().trim().min(1, 'Email wajib diisi').email('Format email belum sesuai'),
  password: z.string().min(1, 'Kata sandi wajib diisi'),
})

export type LoginValues = z.infer<typeof loginSchema>

/**
 * Only same-app admin paths may be used as the post-login destination, so a crafted
 * /admin/login?lanjut=https://evil.test link cannot send a signed-in admin elsewhere.
 */
export function safeAdminPath(target: string | undefined): string {
  const fallback = '/admin'
  if (!target) return fallback
  if (!target.startsWith('/admin') || target.startsWith('//')) return fallback
  const rest = target.slice('/admin'.length)
  if (rest !== '' && !/^[/?#]/.test(rest)) return fallback
  return target
}
