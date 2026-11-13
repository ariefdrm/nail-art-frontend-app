import { STATUS_LABEL } from '@/lib/copy'
import { formatDate, formatRupiah, formatTime } from '@/lib/format'

import type { BookingStatus, Booking } from '@/lib/api/types'

export type ReceiptData = {
  booking_code: string
  status: BookingStatus
  service_name: string
  artist_name: string
  start_at: string
  end_at: string
  total_price: number
}

export function receiptFromBooking(booking: Booking): ReceiptData {
  return {
    booking_code: booking.booking_code,
    status: booking.status,
    service_name: booking.service.name,
    artist_name: booking.artist.name,
    start_at: booking.start_at,
    end_at: booking.end_at,
    total_price: booking.total_price,
  }
}

export function receiptFileName(code: string): string {
  return `bukti-booking-${code.toLowerCase()}.png`
}

/** The label/value rows printed on the receipt, in order. */
export function receiptRows(data: ReceiptData): { label: string; value: string }[] {
  return [
    { label: 'Status', value: STATUS_LABEL[data.status] },
    { label: 'Layanan', value: data.service_name },
    {
      label: 'Jadwal',
      value: `${formatDate(data.start_at)}, ${formatTime(data.start_at)} - ${formatTime(data.end_at)} WIB`,
    },
    { label: 'Artist', value: data.artist_name },
    { label: 'Total', value: formatRupiah(data.total_price) },
  ]
}

const WIDTH = 1080
const PAD = 88

function token(name: string): string {
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim()
}

function wrap(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string[] {
  const lines: string[] = []
  let line = ''
  for (const word of text.split(' ')) {
    const attempt = line ? `${line} ${word}` : word
    if (line && ctx.measureText(attempt).width > maxWidth) {
      lines.push(line)
      line = word
    } else {
      line = attempt
    }
  }
  if (line) lines.push(line)
  return lines
}

const MIN_HEIGHT = 1350
const VALUE_LINE = 46

/**
 * Paints the receipt top to bottom, each block placed after the previous one, and returns the
 * height the content needs. Nothing is positioned from the bottom edge, so text cannot overlap.
 */
function paint(canvas: HTMLCanvasElement, data: ReceiptData): number {
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('Canvas is not available')

  const ink = token('--foreground')
  const quiet = token('--muted-foreground')
  const rule = token('--border')
  const sans = '"Inter Variable", system-ui, sans-serif'
  const display = '"Bodoni Moda Variable", Didot, serif'
  const contentWidth = WIDTH - PAD * 2

  ctx.fillStyle = token('--background')
  ctx.fillRect(0, 0, WIDTH, canvas.height)
  ctx.textBaseline = 'alphabetic'

  ctx.fillStyle = ink
  ctx.font = `600 28px ${sans}`
  ctx.letterSpacing = '6px'
  ctx.fillText('THE NAIL PALACE', PAD, 130)
  ctx.letterSpacing = '0px'

  ctx.font = `500 80px ${display}`
  ctx.fillText('Bukti pemesanan', PAD, 270)

  ctx.fillStyle = rule
  ctx.fillRect(PAD, 320, contentWidth, 2)

  ctx.fillStyle = quiet
  ctx.font = `400 28px ${sans}`
  ctx.fillText('Kode booking', PAD, 400)
  ctx.fillStyle = ink
  ctx.font = '500 66px ui-monospace, "SFMono-Regular", Menlo, Consolas, monospace'
  ctx.letterSpacing = '3px'
  ctx.fillText(data.booking_code, PAD, 480)
  ctx.letterSpacing = '0px'

  let y = 570
  for (const row of receiptRows(data)) {
    ctx.fillStyle = quiet
    ctx.font = `400 26px ${sans}`
    ctx.fillText(row.label, PAD, y)
    ctx.fillStyle = ink
    ctx.font = `500 38px ${sans}`
    const lines = wrap(ctx, row.value, contentWidth)
    lines.forEach((line, index) => ctx.fillText(line, PAD, y + 48 + index * VALUE_LINE))
    y += 48 + (lines.length - 1) * VALUE_LINE + 64
  }

  ctx.fillStyle = rule
  ctx.fillRect(PAD, y, contentWidth, 2)
  ctx.fillStyle = quiet
  ctx.font = `400 26px ${sans}`
  const note = wrap(
    ctx,
    `Cek atau batalkan pesanan di ${window.location.origin}/cek-booking dengan kode ini dan nomor HP yang Anda pakai saat memesan.`,
    contentWidth,
  )
  note.forEach((line, index) => ctx.fillText(line, PAD, y + 56 + index * 38))

  return y + 56 + (note.length - 1) * 38 + PAD
}

/** Draws the receipt as a PNG using the site's own colors and fonts (read from the tokens). */
export async function renderReceipt(data: ReceiptData): Promise<Blob> {
  await Promise.allSettled([
    document.fonts.load('600 40px "Inter Variable"'),
    document.fonts.load('500 40px "Bodoni Moda Variable"'),
  ])

  const canvas = document.createElement('canvas')
  canvas.width = WIDTH
  canvas.height = MIN_HEIGHT
  const needed = paint(canvas, data)
  if (needed > MIN_HEIGHT) {
    // Resizing clears the canvas, so paint again at the height the content needs.
    canvas.height = needed
    paint(canvas, data)
  }

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error('Could not encode the receipt'))),
      'image/png',
    )
  })
}

export async function downloadReceipt(data: ReceiptData): Promise<void> {
  const blob = await renderReceipt(data)
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = receiptFileName(data.booking_code)
  document.body.append(link)
  link.click()
  link.remove()
  URL.revokeObjectURL(url)
}
