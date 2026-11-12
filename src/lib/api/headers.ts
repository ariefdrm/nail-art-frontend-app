import { AxiosHeaders } from 'axios'

/**
 * Reads a response header by name. Axios adapters hand back an AxiosHeaders instance (fetch, xhr)
 * or, in tests and some adapters, a plain object, and plain property access fails on the former.
 */
export function readHeader(headers: unknown, name: string): unknown {
  if (headers instanceof AxiosHeaders) return headers.get(name)
  return typeof headers === 'object' && headers !== null ? Reflect.get(headers, name) : undefined
}
