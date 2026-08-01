import { supabase } from './supabase'
import { getAllWebRentals, mergeWebIntoListings } from '../data/webRentals'
import {
  enrichListingsCampusFromWeb,
  listingDedupeKey,
  resolveLiveCampusId,
} from './campusAttribution'

/**
 * Approved DB listings used for campus histograms + live totals.
 * Includes price so room-level dedupe matches Browse.
 */
export async function fetchDbListingCampusRows() {
  const { data, error } = await supabase
    .from('listings')
    .select('id, whatsapp_number, nearest_university_id, price, title')
    .eq('verification_status', 'approved')
    .in('occupancy_status', ['available', 'rented'])

  if (error) throw error
  return data || []
}

/**
 * Merge DB + web/external catalog into one live total and per-campus counts.
 * Live listing total uses the same merge/dedupe path as Browse (WhatsApp + price).
 */
export function buildLiveListingStats(dbRows = [], webCatalog = null) {
  const rows = Array.isArray(dbRows) ? dbRows : []
  const web = Array.isArray(webCatalog) ? webCatalog : getAllWebRentals()

  const enrichedDb = enrichListingsCampusFromWeb(rows, web)
  // Same merge/dedupe path Browse uses for unfiltered "rooms found".
  const merged = mergeWebIntoListings(
    enrichedDb,
    {},
    { mapMode: true, sortBy: 'newest', catalog: web }
  )

  const campusCounts = {}
  function bump(campusIdOrListing) {
    const liveId = resolveLiveCampusId(campusIdOrListing)
    if (liveId == null || !Number.isFinite(liveId)) return
    campusCounts[liveId] = (campusCounts[liveId] || 0) + 1
  }

  for (const row of enrichedDb) {
    if (row.nearest_university_id != null) bump(row.nearest_university_id)
  }

  const dbKeys = new Set(enrichedDb.map((l) => listingDedupeKey(l)).filter(Boolean))
  let webExtra = 0
  for (const listing of web) {
    const key = listingDedupeKey(listing)
    if (key && dbKeys.has(key)) continue
    webExtra += 1
    bump(listing)
  }

  return {
    listings: merged.count,
    dbListings: rows.length,
    webListings: webExtra,
    campusCounts,
    campusesWithListings: Object.values(campusCounts).filter((n) => n > 0).length,
  }
}
