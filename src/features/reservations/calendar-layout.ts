import { minutesOfDayWib } from '@/lib/format'

import type { Booking } from '@/lib/api/types'

const DAY_MINUTES = 24 * 60
/** A booking is drawn at least this tall so a short one stays readable and clickable. */
const MIN_VISIBLE_MINUTES = 30
const DEFAULT_FIRST_HOUR = 8
const DEFAULT_LAST_HOUR = 20

export type PlacedBooking = {
  booking: Booking
  startMin: number
  endMin: number
  /** Which side-by-side column the block sits in, among `lanes` columns. */
  lane: number
  lanes: number
}

function spanOf(booking: Booking): { startMin: number; endMin: number } {
  const startMin = minutesOfDayWib(booking.start_at)
  const rawEnd = minutesOfDayWib(booking.end_at)
  // An end at or before the start means it ran past midnight: clip it at the day's end.
  const endMin = rawEnd > startMin ? rawEnd : DAY_MINUTES
  return { startMin, endMin: Math.max(endMin, startMin + MIN_VISIBLE_MINUTES) }
}

/**
 * Places one day's bookings so overlapping ones sit side by side instead of on top of each other
 * (different artists can work at the same time). Overlaps are grouped into clusters; inside a
 * cluster each booking takes the first free lane, and every booking of the cluster gets the same
 * lane count so the widths line up.
 */
export function layoutDay(bookings: Booking[]): PlacedBooking[] {
  const spans = bookings
    .map((booking) => ({ booking, ...spanOf(booking) }))
    .sort((a, b) => a.startMin - b.startMin || a.endMin - b.endMin)

  const placed: PlacedBooking[] = []
  let cluster: PlacedBooking[] = []
  let clusterEnd = -1
  let laneEnds: number[] = []

  function closeCluster() {
    for (const item of cluster) item.lanes = laneEnds.length
    placed.push(...cluster)
    cluster = []
    laneEnds = []
    clusterEnd = -1
  }

  for (const span of spans) {
    if (cluster.length > 0 && span.startMin >= clusterEnd) closeCluster()
    let lane = laneEnds.findIndex((end) => end <= span.startMin)
    if (lane === -1) {
      lane = laneEnds.length
      laneEnds.push(span.endMin)
    } else {
      laneEnds[lane] = span.endMin
    }
    clusterEnd = Math.max(clusterEnd, span.endMin)
    cluster.push({ ...span, lane, lanes: 1 })
  }
  closeCluster()
  return placed
}

/** The hour rows to draw: the usual working day, stretched to hold anything outside it. */
export function gridHours(placed: PlacedBooking[]): { firstHour: number; lastHour: number } {
  let firstHour = DEFAULT_FIRST_HOUR
  let lastHour = DEFAULT_LAST_HOUR
  for (const item of placed) {
    firstHour = Math.min(firstHour, Math.floor(item.startMin / 60))
    lastHour = Math.max(lastHour, Math.ceil(item.endMin / 60))
  }
  return { firstHour, lastHour: Math.min(lastHour, 24) }
}
