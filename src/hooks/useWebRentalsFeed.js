import { useEffect, useState } from 'react'
import {
  WEB_RENTALS,
  feedItemToListing,
  setLiveWebRentalsCatalog,
} from '../data/webRentals'
import { supabase } from '../lib/supabase'
import { listingDedupeKey } from '../lib/campusAttribution'

const FEED_URL = '/data/web-rentals-feed.json'
const CACHE_KEY = 'ntlo_web_rentals_feed_v4'
const CACHE_TTL_MS = 30 * 60 * 1000
const DB_LIMIT = 500

const DB_SELECT = `
  id, title, description, price, price_on_request, room_type, gender_preference,
  area, city, address, whatsapp_number, contact_name, campus_ids,
  custom_university_name, distance_to_campus, amenities, photo_urls,
  lat, lng, geo_precision, deposit_pula, utilities_included,
  source_label, source_url, last_seen_at
`

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
  } catch { /* quota — cache is optional */ }
}

function photoCount(row) {
  return Array.isArray(row?.listing_photos) ? row.listing_photos.length : 0
}

function score(row) {
  return photoCount(row) * 10 + (row?.amenities?.length || 0) * 2 + (row?.lat != null ? 1 : 0)
}

function mergeUnique(seed, live) {
  const map = new Map()
  for (const row of [...seed, ...live]) {
    if (!row?.id && !row?.whatsapp_number) continue
    const key = listingDedupeKey(row) || row.id
    if (!key) continue
    const prev = map.get(key)
    if (!prev || score(row) > score(prev)) map.set(key, row)
  }
  return [...map.values()]
}

/** Live table written daily by the sync-web-rentals Edge Function. */
async function loadFromDatabase() {
  const { data, error } = await supabase
    .from('web_rental_listings')
    .select(DB_SELECT)
    .order('last_seen_at', { ascending: false })
    .limit(DB_LIMIT)
  if (error) throw error
  return data || []
}

/** Static JSON shipped with the build — used until the Edge Function has run. */
async function loadFromStaticFeed() {
  const res = await fetch(`${FEED_URL}?t=${Date.now()}`, { cache: 'no-store' })
  if (!res.ok) throw new Error(`feed HTTP ${res.status}`)
  const data = await res.json()
  return data.listings || []
}

/**
 * Static seed + auto-synced catalogue.
 * Prefers the Supabase table (updated daily, no redeploy needed) and falls
 * back to the bundled JSON feed if the table is empty or unreachable.
 */
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
      let rows = await loadFromDatabase().catch(() => [])

      if (!rows.length) {
        try {
          rows = await loadFromStaticFeed()
        } catch {
          return
        }
      }

      const live = rows.map(feedItemToListing).filter(Boolean)
      if (cancelled || !live.length) return

      writeCache(live)
      const merged = mergeUnique(WEB_RENTALS, live)
      setLiveWebRentalsCatalog(merged)
      setRentals(merged)
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
