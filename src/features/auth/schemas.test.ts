import { describe, expect, it } from 'vitest'

import { loginSchema, safeAdminPath } from './schemas'

describe('safeAdminPath', () => {
  it('keeps admin paths, with their search', () => {
    expect(safeAdminPath('/admin')).toBe('/admin')
    expect(safeAdminPath('/admin/reservasi?status=pending')).toBe('/admin/reservasi?status=pending')
  })

  it.each([undefined, '', 'https://evil.test', '//evil.test', '/adminx', '/layanan', 'admin'])(
    'falls back to the dashboard for %s',
    (target) => {
      expect(safeAdminPath(target)).toBe('/admin')
    },
  )
})

describe('loginSchema', () => {
  it('asks for both fields in Indonesian', () => {
    const result = loginSchema.safeParse({ email: '', password: '' })
    const messages = result.error?.issues.map((issue) => issue.message)
    expect(messages).toContain('Email wajib diisi')
    expect(messages).toContain('Kata sandi wajib diisi')
  })

  it('rejects a malformed email', () => {
    expect(loginSchema.safeParse({ email: 'owner', password: 'x' }).success).toBe(false)
  })
})
