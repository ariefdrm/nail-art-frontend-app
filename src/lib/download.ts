/**
 * Saves a Blob as a file. A plain link cannot do it for protected downloads: it would not send the
 * bearer token, so the file is fetched with the API client first and handed to the browser here.
 */
export function saveBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.append(link)
  link.click()
  link.remove()
  // Revoke on the next tick: some browsers start reading the URL after click() returns.
  setTimeout(() => URL.revokeObjectURL(url), 0)
}

/** Reads the file name out of a Content-Disposition header, if there is one. */
export function filenameFromDisposition(header: string | null | undefined): string | null {
  if (!header) return null
  const match = /filename\*?=(?:UTF-8'')?"?([^";]+)"?/i.exec(header)
  const name = match?.[1]
  if (!name) return null
  try {
    return decodeURIComponent(name)
  } catch {
    return name
  }
}
