import { getUniversities, getUniversityById } from './universities'

/** Seed/web campus id → slug used when live Supabase ids differ. */
const SEED_CAMPUS_SLUG_BY_ID = {
  1: 'university-of-botswana',
  2: 'biust',
  3: 'botho-university',
  4: 'limkokwing',
  5: 'ba-isago',
  6: 'abm-university',
  7: 'guc',
  8: 'botswana-university-of-agriculture-and-natural-resources',
  9: 'botswana-accountancy-college',
  10: 'boitekanelo-college',
}

export function primaryCampusIdFromListing(listing) {
  if (!listing) return null
  if (listing.nearest_university_id != null && Number.isFinite(Number(listing.nearest_university_id))) {
    return Number(listing.nearest_university_id)
  }
  if (Array.isArray(listing.campus_ids) && listing.campus_ids.length) {
    const id = Number(listing.campus_ids[0])
    return Number.isFinite(id) ? id : null
  }
  return null
}

/** Map a seed/web campus id or slug onto the live universities table id. */
export function resolveLiveCampusId(listingOrCampusId) {
  if (listingOrCampusId == null) return null

  if (typeof listingOrCampusId === 'object') {
    const listing = listingOrCampusId
    const slug = listing?.nearest_university?.slug
    if (slug) {
      const live = getUniversities().find((u) => u.slug === slug)
      if (live) return Number(live.id)
    }
    const raw = primaryCampusIdFromListing(listing)
    if (raw == null) return null
    return resolveLiveCampusId(raw)
  }

  const rawId = Number(listingOrCampusId)
  if (!Number.isFinite(rawId)) return null
  if (getUniversityById(rawId)) return rawId

  const slug = SEED_CAMPUS_SLUG_BY_ID[rawId]
  if (slug) {
    const live = getUniversities().find((u) => u.slug === slug)
    if (live) return Number(live.id)
  }
  return rawId
}

export function indexWebRentalsByWhatsapp(webCatalog = []) {
  const map = new Map()
  for (const row of webCatalog || []) {
    const wa = row?.whatsapp_number != null ? String(row.whatsapp_number).replace(/\D/g, '') : ''
    if (!wa) continue
    const prev = map.get(wa)
    const prevPhotos = Array.isArray(prev?.listing_photos) ? prev.listing_photos.length : 0
    const nextPhotos = Array.isArray(row.listing_photos) ? row.listing_photos.length : 0
    if (!prev || nextPhotos > prevPhotos) map.set(wa, row)
  }
  return map
}

/**
 * External DB rows often have null nearest_university_id. Fill campus fields from
 * the matching web/catalog listing (same WhatsApp) so filters and badges stay true.
 */
export function enrichListingCampusFromWeb(listing, webByWhatsapp) {
  if (!listing) return listing
  if (listing.nearest_university_id != null) {
    return {
      ...listing,
      nearest_university_id: resolveLiveCampusId(listing) ?? Number(listing.nearest_university_id),
    }
  }

  const wa = listing.whatsapp_number != null ? String(listing.whatsapp_number).replace(/\D/g, '') : ''
  const web = wa && webByWhatsapp ? webByWhatsapp.get(wa) : null
  if (!web) return listing

  const liveId = resolveLiveCampusId(web)
  if (liveId == null) return listing

  return {
    ...listing,
    nearest_university_id: liveId,
    nearest_university: web.nearest_university || getUniversityById(liveId) || listing.nearest_university,
    campus_ids: web.campus_ids || listing.campus_ids || [liveId],
    distance_to_campus: listing.distance_to_campus ?? web.distance_to_campus ?? null,
  }
}

export function enrichListingsCampusFromWeb(listings, webCatalog) {
  const webByWa = indexWebRentalsByWhatsapp(webCatalog)
  return (listings || []).map((row) => enrichListingCampusFromWeb(row, webByWa))
}
