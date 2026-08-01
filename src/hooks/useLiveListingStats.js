import { useEffect, useState } from 'react'
import { useWebRentalsFeed } from './useWebRentalsFeed'
import { useUniversities } from './useUniversities'
import { buildLiveListingStats, fetchDbListingCampusRows } from '../lib/listingCounts'
import { subscribeListingsLive } from '../lib/listingsLiveBus'
import { createDebouncer } from '../lib/queryOptim'

const EMPTY = {
  listings: 0,
  dbListings: 0,
  webListings: 0,
  campusCounts: {},
  campusesWithListings: 0,
  loading: true,
}

/**
 * Real-time live listing totals + per-campus histogram (DB + web rentals).
 * Shared by Home stats and Universities showcase.
 */
export function useLiveListingStats() {
  const webCatalog = useWebRentalsFeed()
  const { universities } = useUniversities()
  const [stats, setStats] = useState(EMPTY)

  useEffect(() => {
    let cancelled = false

    async function load() {
      try {
        const rows = await fetchDbListingCampusRows()
        if (cancelled) return
        const next = buildLiveListingStats(rows, webCatalog)
        setStats({ ...next, loading: false })
      } catch {
        if (cancelled) return
        const next = buildLiveListingStats([], webCatalog)
        setStats({ ...next, loading: false })
      }
    }

    load()
    const debouncedLoad = createDebouncer(() => {
      if (!cancelled) load()
    }, 2500)

    const unsub = subscribeListingsLive(() => debouncedLoad())

    return () => {
      cancelled = true
      debouncedLoad.cancel()
      unsub()
    }
  }, [webCatalog, universities])

  return stats
}
