import { supabase } from './supabase'
import { getAllWebRentals } from '../data/webRentals'
import {
  enrichListingCampusFromWeb,
  indexWebRentalsByWhatsapp,
  resolveLiveCampusId,
} from './campusAttribution'

/**
 * Approved DB listings used for campus histograms + live totals.
 * Lightweight rows only — no photos/PII beyond WhatsApp for dedupe + campus fill.
 */
export async function fetchDbListingCampusRows() {
  const { data, error } = await supabase
    .from('listings')
    .select('whatsapp_number, nearest_university_id')
    .eq('verification_status', 'approved')
    .in('occupancy_status', ['available', 'rented'])

  if (error) throw error
  return data || []
}

/**
 * Merge DB + web/external catalog into one live total and per-campus counts.
 * DB externals with null campus inherit campus from the matching web row (WhatsApp).
 * Web rows already present in DB are not double-counted.
 */
export function buildLiveListingStats(dbRows = [], webCatalog = null) {
  const rows = Array.isArray(dbRows) ? dbRows : []
  const web = Array.isArray(webCatalog) ? webCatalog : getAllWebRentals()
  const webByWa = indexWebRentalsByWhatsapp(web)
  const dbWhatsapps = new Set(
    rows
      .map((r) => (r.whatsapp_number != null ? String(r.whatsapp_number).replace(/\D/g, '') : ''))
      .filter(Boolean)
  )

  const campusCounts = {}
  function bump(campusId) {
    const liveId = resolveLiveCampusId(campusId)
    if (liveId == null || !Number.isFinite(liveId)) return
    campusCounts[liveId] = (campusCounts[liveId] || 0) + 1
  }

  for (const row of rows) {
    const enriched = enrichListingCampusFromWeb(row, webByWa)
    if (enriched.nearest_university_id != null) bump(enriched.nearest_university_id)
  }

  let webExtra = 0
  for (const listing of web) {
    const wa = listing?.whatsapp_number != null ? String(listing.whatsapp_number).replace(/\D/g, '') : ''
    if (wa && dbWhatsapps.has(wa)) continue
    webExtra += 1
    bump(listing)
  }

  const campusesWithListings = Object.values(campusCounts).filter((n) => n > 0).length

  return {
    listings: rows.length + webExtra,
    dbListings: rows.length,
    webListings: webExtra,
    campusCounts,
    campusesWithListings,
  }
}
