import { AxiosHeaders, isAxiosError } from 'axios'

import { ERROR_COPY, rateLimitedMessage } from '@/lib/copy'

import type { AffectedBooking, ApiErrorBody } from './types'
import type { FieldValues, Path, UseFormSetError } from 'react-hook-form'

export type ApiErrorDetail = { field: string; message: string }

type ApiErrorInit = {
  status: number
  code: string
  message: string
  details?: ApiErrorDetail[]
  conflicts?: AffectedBooking[]
  retryAfter?: number
  isNetwork?: boolean
}

/** The one error type components and hooks see (CODE_STYLE.md section 9). */
export class ApiError extends Error {
  readonly status: number
  readonly code: string
  readonly details: ApiErrorDetail[]
  readonly conflicts: AffectedBooking[]
  readonly retryAfter: number | undefined
  readonly isNetwork: boolean

  constructor(init: ApiErrorInit) {
    super(init.message)
    this.name = 'ApiError'
    this.status = init.status
    this.code = init.code
    this.details = init.details ?? []
    this.conflicts = init.conflicts ?? []
    this.retryAfter = init.retryAfter
    this.isNetwork = init.isNetwork ?? false
  }
}

/** Adapters return AxiosHeaders (fetch, xhr) or a plain object (tests, other adapters). */
function readHeader(headers: unknown, name: string): unknown {
  if (headers instanceof AxiosHeaders) return headers.get(name)
  return typeof headers === 'object' && headers !== null ? Reflect.get(headers, name) : undefined
}

function parseRetryAfter(value: unknown): number | undefined {
  const seconds = Number(Array.isArray(value) ? value[0] : value)
  return Number.isFinite(seconds) && seconds >= 0 ? Math.ceil(seconds) : undefined
}

// Proxies and crashes can answer with HTML or nothing, so the parameter admits undefined.
function readBody(data: ApiErrorBody | undefined): ApiErrorBody['error'] {
  return data?.error
}

/** Turns anything thrown by axios into an ApiError. Already normalized errors pass through. */
export function toApiError(error: unknown): ApiError {
  if (error instanceof ApiError) return error

  if (isAxiosError<ApiErrorBody>(error)) {
    if (!error.response) {
      return new ApiError({
        status: 0,
        code: 'NETWORK_ERROR',
        message: ERROR_COPY.network,
        isNetwork: true,
      })
    }
    const { status, headers } = error.response
    const body = readBody(error.response.data)
    return new ApiError({
      status,
      code: body?.code ?? (status === 413 ? 'PAYLOAD_TOO_LARGE' : 'UNKNOWN'),
      message: body?.message ?? '',
      details: (body?.details ?? []).flatMap((detail) =>
        detail.field && detail.message ? [{ field: detail.field, message: detail.message }] : [],
      ),
      // The contract marks every field optional; the backend always fills them.
      conflicts: body?.conflicts as AffectedBooking[] | undefined,
      retryAfter: parseRetryAfter(readHeader(headers, 'retry-after')),
    })
  }

  return new ApiError({
    status: 0,
    code: 'UNKNOWN',
    message: error instanceof Error ? error.message : '',
  })
}

/** User-facing Indonesian message from the PRD error table. Never raw server text, except where noted. */
export function errorMessage(error: unknown, context?: { login?: boolean }): string {
  const apiError = toApiError(error)
  if (apiError.isNetwork) return ERROR_COPY.network
  if (apiError.status === 429) return rateLimitedMessage(apiError.retryAfter)
  if (apiError.status === 413) return ERROR_COPY.tooLarge
  if (apiError.status === 401) {
    return context?.login ? ERROR_COPY.badCredentials : ERROR_COPY.unauthorized
  }
  if (apiError.code === 'ORIGIN_NOT_ALLOWED') return ERROR_COPY.originNotAllowed
  if (apiError.status === 403) return ERROR_COPY.forbidden
  if (apiError.status === 404) return ERROR_COPY.notFound
  if (apiError.code === 'SLOT_UNAVAILABLE') return ERROR_COPY.slotUnavailable
  if (apiError.code === 'BLOCK_HAS_BOOKINGS') return ERROR_COPY.blockHasBookings
  // The API already words this one for users (e.g. the cancellation deadline).
  if (apiError.code === 'INVALID_STATUS_TRANSITION' && apiError.message) return apiError.message
  if (apiError.status === 422) return ERROR_COPY.validation
  if (apiError.status >= 500) return ERROR_COPY.server
  return ERROR_COPY.unknown
}

/**
 * Maps 422 details onto form fields. Fields the form does not know (or `query.`/`params.` ones)
 * become the form-level `root.server` error. Returns true when the error was a validation error.
 */
export function applyApiErrors<T extends FieldValues>(
  setError: UseFormSetError<T>,
  error: unknown,
  knownFields?: readonly string[],
): boolean {
  const apiError = toApiError(error)
  if (apiError.status !== 422) {
    setError('root.server', { type: 'server', message: errorMessage(apiError) })
    return false
  }

  let first = true
  let hasUnmapped = false
  for (const detail of apiError.details) {
    const isKnown =
      !/^(query|params)\./.test(detail.field) && (knownFields?.includes(detail.field) ?? true)
    if (isKnown) {
      // The API names fields at runtime; unknown ones were filtered out above.
      setError(
        detail.field as Path<T>,
        { type: 'server', message: detail.message },
        { shouldFocus: first },
      )
      first = false
    } else {
      hasUnmapped = true
    }
  }
  if (apiError.details.length === 0 || hasUnmapped) {
    setError('root.server', { type: 'server', message: ERROR_COPY.validation })
  }
  return true
}
