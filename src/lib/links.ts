/** Only wa.me links are opened from API data (reminder_url, contact_url). */
export function isWhatsAppUrl(url: string | null | undefined): url is string {
  return typeof url === 'string' && url.startsWith('https://wa.me/')
}
