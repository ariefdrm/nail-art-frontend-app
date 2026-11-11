import { useEffect, useState } from 'react'

const TICK_MS = 500

/** Whole-second countdown, e.g. for a Retry-After. Call `start(seconds)` from an event handler. */
export function useCountdown(): { secondsLeft: number; start: (seconds: number) => void } {
  const [endsAt, setEndsAt] = useState(0)
  const [now, setNow] = useState(0)

  useEffect(() => {
    if (endsAt <= 0) return
    const timer = setInterval(() => {
      const current = Date.now()
      setNow(current)
      if (current >= endsAt) clearInterval(timer)
    }, TICK_MS)
    return () => clearInterval(timer)
  }, [endsAt])

  return {
    secondsLeft: Math.max(0, Math.ceil((endsAt - now) / 1000)),
    start: (seconds) => {
      const current = Date.now()
      setNow(current)
      setEndsAt(current + seconds * 1000)
    },
  }
}
