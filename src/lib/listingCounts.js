import { supabase } from './supabase'
import { getAllWebRentals } from '../data/webRentals'

/**
 * Approved DB listings used for campus histograms + live totals.
 * Lightweight rows only — no photos/PII beyond WhatsApp for dedupe.
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

function primaryCampusId(listing) {
  if (Array.isArray(listing?.campus_ids) && listing.campus_ids.length) {
    return Number(listing.campus_ids[0])
  }
  if (listing?.nearest_university_id != null) {
    return Number(listing.nearest_university_id)
  }
  return null
}

/**
 * Merge DB + web/external catalog into one live total and per-campus counts.
 * Web rows already present in DB (same WhatsApp) are skipped to avoid double-counting.
 */
export function buildLiveListingStats(dbRows = [], webCatalog = null) {
  const rows = Array.isArray(dbRows) ? dbRows : []
  const web = Array.isArray(webCatalog) ? webCatalog : getAllWebRentals()
  const dbWhatsapps = new Set(rows.map((r) => r.whatsapp_number).filter(Boolean).map(String))

  const campusCounts = {}
  for (const row of rows) {
    const id = row.nearest_university_id
    if (id == null) continue
    campusCounts[id] = (campusCounts[id] || 0) + 1
  }

  // Count each web listing once toward its primary campus (avoids inflating TOTAL LISTINGS)
  let webExtra = 0
  for (const listing of web) {
    const wa = listing?.whatsapp_number != null ? String(listing.whatsapp_number) : ''
    if (wa && dbWhatsapps.has(wa)) continue
    webExtra += 1
    const campusId = primaryCampusId(listing)
    if (campusId != null && Number.isFinite(campusId)) {
      campusCounts[campusId] = (campusCounts[campusId] || 0) + 1
    }
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
