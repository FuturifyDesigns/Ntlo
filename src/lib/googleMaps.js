import { getUniversityById } from './universities'
import { calculateDistance } from './utils'

export const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || ''

/**
 * Cloud Map ID for AdvancedMarker / vector styling.
 * Only use a real ID from Google Cloud → Map Management.
 * Never fall back to DEMO_MAP_ID — that often renders a solid blue map.
 */
const rawMapId = String(import.meta.env.VITE_GOOGLE_MAPS_MAP_ID || '').trim()
export const GOOGLE_MAPS_MAP_ID =
  rawMapId && rawMapId !== 'DEMO_MAP_ID' ? rawMapId : ''
export const hasGoogleMapsMapId = Boolean(GOOGLE_MAPS_MAP_ID)
export const MAPS_ENABLED = Boolean(GOOGLE_MAPS_API_KEY)

/** Gaborone / UB area when no campus filter is active */
export const DEFAULT_MAP_CENTER = { lat: -24.6576, lng: 25.9398 }
export const DEFAULT_MAP_ZOOM = 13
export const CAMPUS_MAP_ZOOM = 15
export const SINGLE_LISTING_ZOOM = 16

/** Max km a listing pin may be from the filtered campus (drops bad/outlier coords). */
export const CAMPUS_PIN_MAX_KM = 35

export function toLatLng(lat, lng) {
  const latitude = Number(lat)
  const longitude = Number(lng)
  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) return null
  return { lat: latitude, lng: longitude }
}

export function hasValidCoords(lat, lng) {
  return toLatLng(lat, lng) !== null
}

function resolveCampusCoords(listing, preferredCampusId) {
  const preferred = preferredCampusId ?? listing?.nearest_university_id
  const fromApp = getUniversityById(preferred)
  if (fromApp) {
    const coords = toLatLng(fromApp.lat, fromApp.lng)
    if (coords) return coords
  }

  // Multi-campus web listings: try each campus id until one has coords
  const campusIds = Array.isArray(listing?.campus_ids) ? listing.campus_ids : []
  for (const id of campusIds) {
    const uni = getUniversityById(id)
    const coords = toLatLng(uni?.lat, uni?.lng)
    if (coords) return coords
  }

  const embedded = listing?.nearest_university
  const fromEmbedded = toLatLng(embedded?.lat, embedded?.lng)
  if (fromEmbedded) return fromEmbedded

  return null
}

function isWithinCampusRadius(position, campusCenter, maxKm = CAMPUS_PIN_MAX_KM) {
  if (!campusCenter) return true
  const km = calculateDistance(position.lat, position.lng, campusCenter.lat, campusCenter.lng)
  return km <= maxKm
}

/** Stable hash from listing id — spreads approximate pins without stacking. */
function listingJitterSeed(listing) {
  const raw = String(listing?.id || listing?.whatsapp_number || listing?.title || 'pin')
  let hash = 0
  for (let i = 0; i < raw.length; i += 1) {
    hash = ((hash << 5) - hash + raw.charCodeAt(i)) | 0
  }
  return Math.abs(hash)
}

/**
 * Approximate pin near campus using distance_to_campus when available,
 * with a deterministic angle so many web listings don't share one pixel.
 */
export function approximateCampusPosition(campus, listing) {
  if (!campus) return null
  const seed = listingJitterSeed(listing)
  const angle = ((seed % 360) * Math.PI) / 180
  const reportedKm = Number(listing?.distance_to_campus)
  const radiusKm = Number.isFinite(reportedKm) && reportedKm > 0
    ? Math.min(Math.max(reportedKm * 0.85, 0.35), 12)
    : 0.6 + (seed % 40) / 40 // 0.6–1.6 km ring when unknown

  const latOffset = (radiusKm / 111.32) * Math.cos(angle)
  const lngDenom = 111.32 * Math.cos((campus.lat * Math.PI) / 180)
  const lngOffset = lngDenom === 0 ? 0 : (radiusKm / lngDenom) * Math.sin(angle)

  return {
    lat: campus.lat + latOffset,
    lng: campus.lng + lngOffset,
    approximate: true,
  }
}

/** Exact pin, or approximate campus area when listing has no lat/lng */
export function getListingPosition(listing) {
  const exact = toLatLng(listing?.lat, listing?.lng)
  if (exact) return { ...exact, approximate: false }

  const campus = resolveCampusCoords(listing)
  if (campus) return approximateCampusPosition(campus, listing)

  return null
}

/**
 * Pin for browse map.
 * Exact coords preferred; when missing, place an approximate pin near the
 * relevant campus so web/external listings still appear on the map.
 */
export function getMapListingPosition(listing, { campusId, campusCenter } = {}) {
  const exact = toLatLng(listing?.lat, listing?.lng)

  if (campusCenter) {
    if (exact) {
      if (!isWithinCampusRadius(exact, campusCenter)) return null
      return { ...exact, approximate: false }
    }

    // No exact coords — still show near the filtered campus when this listing belongs there
    const belongs =
      campusId == null
      || Number(listing?.nearest_university_id) === Number(campusId)
      || (Array.isArray(listing?.campus_ids) && listing.campus_ids.map(Number).includes(Number(campusId)))

    if (!belongs && campusId != null) return null
    return approximateCampusPosition(campusCenter, listing)
  }

  if (exact) return { ...exact, approximate: false }

  const campus = resolveCampusCoords(listing, campusId)
  if (campus) return approximateCampusPosition(campus, listing)

  return null
}
