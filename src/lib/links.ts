/** Only wa.me links are opened from API data (reminder_url, contact_url). */
export function isWhatsAppUrl(url: string | null | undefined): url is string {
  return typeof url === 'string' && url.startsWith('https://wa.me/')
}

/** True only for absolute http(s) URLs: rejects javascript:, data:, file: and unparseable text. */
export function isHttpUrl(value: string | null | undefined): value is string {
  if (typeof value !== 'string') return false
  try {
    const protocol = new URL(value).protocol
    return protocol === 'http:' || protocol === 'https:'
  } catch {
    return false
  }
}
