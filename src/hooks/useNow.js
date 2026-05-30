import { useEffect, useState } from 'react'

/** Re-renders on an interval so relative timestamps stay fresh. */
export function useNow(intervalMs = 60000) {
  const [, setTick] = useState(0)
  useEffect(() => {
    const id = setInterval(() => setTick((n) => n + 1), intervalMs)
    return () => clearInterval(id)
  }, [intervalMs])
}
