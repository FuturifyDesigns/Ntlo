import { supabase } from './supabase'
import { createDebouncer, createTtlCache, dedupeAsync } from './queryOptim'
import { getMarketKey } from './competitiveAdvisor'

export const MARKET_SELECT = `
  id, title, price, room_type, area, city, lat, lng, available, occupancy_status,
  distance_to_campus, nearest_university_id, custom_university_name, amenities,
  is_verified, landlord_verified, landlord_id, gender_preference, description,
  verification_status, created_at, updated_at, views,
  listing_photos(url, is_cover, display_order),
  nearest_university:universities(id, short_name, name, lat, lng),
  landlord:profiles(id, full_name, is_verified)
`

const cache = createTtlCache(45000, 32)
const listeners = new Map()
const channels = new Map()

const notifyKey = createDebouncer((marketKey) => {
  listeners.get(marketKey)?.forEach((cb) => cb())
}, 600)

async function queryMarket(anchorListing) {
  if (!anchorListing) return []

  let query = supabase.from('listings').select(MARKET_SELECT)

  if (anchorListing.nearest_university_id) {
    query = query
      .eq('nearest_university_id', anchorListing.nearest_university_id)
      .eq('room_type', anchorListing.room_type || 'single')
  } else if (anchorListing.city) {
    query = query
      .ilike('city', anchorListing.city.trim())
      .eq('room_type', anchorListing.room_type || 'single')
  } else {
    return []
  }

  const { data, error } = await query
    .in('occupancy_status', ['available', 'rented'])
    .eq('verification_status', 'approved')
    .order('created_at', { ascending: false })
    .limit(80)

  if (error) throw error
  return data || []
}

export async function fetchMarketListings(marketKey, anchorListing, { force = false } = {}) {
  if (!marketKey || !anchorListing) return []

  if (!force) {
    const cached = cache.get(marketKey)
    if (cached) return cached
  }

  return dedupeAsync(`market:${marketKey}`, async () => {
    const data = await queryMarket(anchorListing)
    cache.set(marketKey, data)
    return data
  })
}

export function invalidateMarketCache(marketKey) {
  if (marketKey) cache.invalidate(marketKey)
  else cache.invalidate('')
}

function ensureMarketChannel(marketKey, filter) {
  if (channels.has(marketKey)) return

  const channel = supabase
    .channel(`market-cache-${marketKey}`)
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'listings', filter },
      () => {
        cache.invalidate(marketKey)
        notifyKey(marketKey)
      }
    )
    .subscribe()

  channels.set(marketKey, channel)
}

export function subscribeMarket(marketKey, anchorListing, callback) {
  if (!marketKey || !anchorListing) return () => {}

  if (!listeners.has(marketKey)) listeners.set(marketKey, new Set())
  listeners.get(marketKey).add(callback)

  const filter = anchorListing.nearest_university_id
    ? `nearest_university_id=eq.${anchorListing.nearest_university_id}`
    : undefined

  if (filter) ensureMarketChannel(marketKey, filter)

  return () => {
    const set = listeners.get(marketKey)
    if (!set) return
    set.delete(callback)
    if (!set.size) {
      listeners.delete(marketKey)
      const ch = channels.get(marketKey)
      if (ch) {
        supabase.removeChannel(ch)
        channels.delete(marketKey)
      }
    }
  }
}

/** Batch-fetch unique markets for multiple anchor listings (one query per campus+room type). */
export async function fetchMarketsBatch(anchors) {
  const byKey = new Map()
  for (const anchor of anchors || []) {
    if (!anchor) continue
    const key = getMarketKey(anchor)
    if (key && !byKey.has(key)) byKey.set(key, anchor)
  }

  const entries = await Promise.all(
    [...byKey.entries()].map(async ([key, anchor]) => {
      const data = await fetchMarketListings(key, anchor)
      return [key, data]
    })
  )

  return new Map(entries)
}
