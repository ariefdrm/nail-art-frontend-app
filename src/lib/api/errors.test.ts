import { AxiosError, AxiosHeaders } from 'axios'
import { describe, expect, it, vi } from 'vitest'

import { ApiError, applyApiErrors, errorMessage, toApiError } from './errors'

function axiosError(status: number, body?: unknown, headers: Record<string, string> = {}) {
  return new AxiosError('failed', 'ERR_BAD_REQUEST', undefined, undefined, {
    status,
    statusText: '',
    data: body,
    headers,
    config: { headers: new AxiosHeaders() },
  })
}

describe('toApiError', () => {
  it('reads the error envelope', () => {
    const error = toApiError(
      axiosError(422, {
        error: {
          code: 'VALIDATION_ERROR',
          message: 'x',
          details: [{ field: 'customer_phone', message: 'Nomor tidak valid' }],
        },
      }),
    )
    expect(error.code).toBe('VALIDATION_ERROR')
    expect(error.details).toEqual([{ field: 'customer_phone', message: 'Nomor tidak valid' }])
  })

  it('marks missing responses as network errors', () => {
    const error = toApiError(new AxiosError('Network Error', 'ERR_NETWORK'))
    expect(error.isNetwork).toBe(true)
    expect(errorMessage(error)).toBe('Tidak dapat terhubung ke server. Periksa koneksi Anda.')
  })

  it('survives a non-JSON body', () => {
    expect(toApiError(axiosError(502, '<html>').code)).toBeDefined()
    expect(errorMessage(axiosError(502, '<html>'))).toBe(
      'Terjadi kesalahan pada server. Coba lagi sebentar lagi.',
    )
  })

  it('reads Retry-After on 429', () => {
    const error = toApiError(
      axiosError(429, { error: { code: 'RATE_LIMITED', message: 'x' } }, { 'retry-after': '42' }),
    )
    expect(error.retryAfter).toBe(42)
    expect(errorMessage(error)).toBe('Terlalu banyak permintaan. Coba lagi dalam 42 detik.')
  })
})

describe('toApiError headers', () => {
  it('reads Retry-After from AxiosHeaders as the real adapters return it', () => {
    const response = {
      status: 429,
      statusText: '',
      data: { error: { code: 'RATE_LIMITED', message: 'x' } },
      headers: AxiosHeaders.from({ 'Retry-After': '30' }),
      config: { headers: new AxiosHeaders() },
    }
    const error = new AxiosError('failed', 'ERR_BAD_REQUEST', undefined, undefined, response)
    expect(toApiError(error).retryAfter).toBe(30)
  })
})

describe('errorMessage', () => {
  it('distinguishes bad credentials from an expired session', () => {
    const error = axiosError(401, { error: { code: 'UNAUTHORIZED', message: 'x' } })
    expect(errorMessage(error, { login: true })).toBe('Email atau kata sandi salah.')
    expect(errorMessage(error)).toContain('Sesi')
  })

  it('uses the API wording for invalid status transitions only', () => {
    const transition = axiosError(409, {
      error: { code: 'INVALID_STATUS_TRANSITION', message: 'Batas pembatalan terlewati' },
    })
    expect(errorMessage(transition)).toBe('Batas pembatalan terlewati')
    const slot = axiosError(409, { error: { code: 'SLOT_UNAVAILABLE', message: 'raw text' } })
    expect(errorMessage(slot)).toContain('pilih jam lain')
  })
})

describe('applyApiErrors', () => {
  const validation = new ApiError({
    status: 422,
    code: 'VALIDATION_ERROR',
    message: '',
    details: [
      { field: 'customer_phone', message: 'Nomor tidak valid' },
      { field: 'query.date_from', message: 'bad' },
    ],
  })

  it('maps known fields and reports the rest on the form', () => {
    const setError = vi.fn()
    expect(applyApiErrors(setError, validation)).toBe(true)
    expect(setError).toHaveBeenCalledWith(
      'customer_phone',
      { type: 'server', message: 'Nomor tidak valid' },
      { shouldFocus: true },
    )
    expect(setError).toHaveBeenCalledWith(
      'root.server',
      expect.objectContaining({ type: 'server' }),
    )
  })

  it('shows non-validation errors as a form error', () => {
    const setError = vi.fn()
    expect(applyApiErrors(setError, axiosError(500))).toBe(false)
    expect(setError).toHaveBeenCalledWith('root.server', expect.anything())
  })
})
