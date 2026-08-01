import { useEffect, useState } from 'react'
import {
  WEB_RENTALS,
  feedItemToListing,
  setLiveWebRentalsCatalog,
} from '../data/webRentals'
import { listingDedupeKey } from '../lib/campusAttribution'

const FEED_URL = '/data/web-rentals-feed.json'
const CACHE_KEY = 'ntlo_web_rentals_feed_v3'
const CACHE_TTL_MS = 30 * 60 * 1000

function readCache() {
  try {
    const raw = localStorage.getItem(CACHE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw)
    if (!parsed?.saved_at || Date.now() - parsed.saved_at > CACHE_TTL_MS) return null
    return Array.isArray(parsed.listings) ? parsed.listings : null
  } catch {
    return null
  }
}

function writeCache(listings) {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify({ saved_at: Date.now(), listings }))
  } catch { /* ignore */ }
}

function photoCount(row) {
  return Array.isArray(row?.listing_photos) ? row.listing_photos.length : 0
}

function mergeUnique(seed, live) {
  const map = new Map()
  for (const row of [...seed, ...live]) {
    if (!row?.id && !row?.whatsapp_number) continue
    const key = listingDedupeKey(row) || row.id
    if (!key) continue
    const prev = map.get(key)
    if (!prev || photoCount(row) > photoCount(prev)) {
      map.set(key, row)
    }
  }
  return [...map.values()]
}

/** Static seed + auto-synced public feed (refreshes in the background). */
export function useWebRentalsFeed() {
  const [rentals, setRentals] = useState(() => {
    const cached = typeof localStorage !== 'undefined' ? readCache() : null
    const initial = mergeUnique(WEB_RENTALS, cached || [])
    setLiveWebRentalsCatalog(initial)
    return initial
  })

  useEffect(() => {
    let cancelled = false
    async function load() {
      try {
        const res = await fetch(`${FEED_URL}?t=${Date.now()}`, { cache: 'no-store' })
        if (!res.ok) return
        const data = await res.json()
        const live = (data.listings || []).map(feedItemToListing).filter(Boolean)
        if (cancelled || !live.length) return
        writeCache(live)
        const merged = mergeUnique(WEB_RENTALS, live)
        setLiveWebRentalsCatalog(merged)
        setRentals(merged)
      } catch {
        /* keep seed/cache */
      }
    }
    load()
    const timer = setInterval(load, CACHE_TTL_MS)
    return () => {
      cancelled = true
      clearInterval(timer)
    }
  }, [])

  return rentals
}
