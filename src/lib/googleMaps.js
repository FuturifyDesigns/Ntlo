import { getUniversityById } from './universities'
import { calculateDistance } from './utils'

export const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || ''

/**
 * Cloud Map ID is OPTIONAL and opt-in only.
 *
 * Passing any Map ID (including Google's DEMO_MAP_ID or a misconfigured Cloud
 * Console ID like the old project secret) has repeatedly produced a solid blue
 * map on ntlo.online. Default = no mapId → raster roadmap + classic Marker.
 *
 * To try Advanced Markers / cloud styles later:
 *   1. Create a working Map ID in Google Cloud → Map Management (roadmap, no broken style)
 *   2. Set secret VITE_GOOGLE_MAPS_MAP_ID
 *   3. Set var VITE_GOOGLE_MAPS_USE_CLOUD_STYLING=true
 */
const rawCloudMapId = String(import.meta.env.VITE_GOOGLE_MAPS_MAP_ID || '').trim()
const cloudStylingEnabled =
  String(import.meta.env.VITE_GOOGLE_MAPS_USE_CLOUD_STYLING || '').toLowerCase() === 'true'

export const GOOGLE_MAPS_MAP_ID =
  cloudStylingEnabled
  && rawCloudMapId
  && rawCloudMapId !== 'DEMO_MAP_ID'
    ? rawCloudMapId
    : ''

export const usesCloudMapStyling = Boolean(GOOGLE_MAPS_MAP_ID)
export const hasGoogleMapsMapId = Boolean(GOOGLE_MAPS_MAP_ID)
export const MAPS_ENABLED = Boolean(GOOGLE_MAPS_API_KEY)

/** Gaborone / UB area when no campus filter is active */
export const DEFAULT_MAP_CENTER = { lat: -24.6576, lng: 25.9398 }
export const DEFAULT_MAP_ZOOM = 13
export const CAMPUS_MAP_ZOOM = 15
export const SINGLE_LISTING_ZOOM = 16

/** Max km a listing pin may be from the filtered campus (drops bad/outlier coords). */
export const CAMPUS_PIN_MAX_KM = 35

/**
 * Botswana bounding box (plus a small margin for border towns).
 * Rows saved with 0/0 or otherwise unset coordinates land in the Atlantic
 * ("Null Island"), which renders as an all-blue ocean map.
 */
const BOTSWANA_BOUNDS = { minLat: -27.5, maxLat: -17.0, minLng: 19.5, maxLng: 30.0 }

export function toLatLng(lat, lng) {
  // Number(null) and Number('') are 0, which silently pins listings at 0,0.
  if (lat == null || lng == null || lat === '' || lng === '') return null
  const latitude = Number(lat)
  const longitude = Number(lng)
  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) return null
  if (latitude === 0 && longitude === 0) return null
  return { lat: latitude, lng: longitude }
}

/** Coordinates we are willing to drop a pin on (rejects 0/0 and far-away junk). */
export function toBotswanaLatLng(lat, lng) {
  const coords = toLatLng(lat, lng)
  if (!coords) return null
  const inBox =
    coords.lat >= BOTSWANA_BOUNDS.minLat
    && coords.lat <= BOTSWANA_BOUNDS.maxLat
    && coords.lng >= BOTSWANA_BOUNDS.minLng
    && coords.lng <= BOTSWANA_BOUNDS.maxLng
  return inBox ? coords : null
}

export function hasValidCoords(lat, lng) {
  return toLatLng(lat, lng) !== null
}

function resolveCampusCoords(listing, preferredCampusId) {
  const preferred = preferredCampusId ?? listing?.nearest_university_id
  const fromApp = getUniversityById(preferred)
  if (fromApp) {
    const coords = toBotswanaLatLng(fromApp.lat, fromApp.lng)
    if (coords) return coords
  }

  const campusIds = Array.isArray(listing?.campus_ids) ? listing.campus_ids : []
  for (const id of campusIds) {
    const uni = getUniversityById(id)
    const coords = toBotswanaLatLng(uni?.lat, uni?.lng)
    if (coords) return coords
  }

  const embedded = listing?.nearest_university
  const fromEmbedded = toBotswanaLatLng(embedded?.lat, embedded?.lng)
  if (fromEmbedded) return fromEmbedded

  return null
}

function isWithinCampusRadius(position, campusCenter, maxKm = CAMPUS_PIN_MAX_KM) {
  if (!campusCenter) return true
  const km = calculateDistance(position.lat, position.lng, campusCenter.lat, campusCenter.lng)
  return km <= maxKm
}

function listingJitterSeed(listing) {
  const raw = String(listing?.id || listing?.whatsapp_number || listing?.title || 'pin')
  let hash = 0
  for (let i = 0; i < raw.length; i += 1) {
    hash = ((hash << 5) - hash + raw.charCodeAt(i)) | 0
  }
  return Math.abs(hash)
}

export function approximateCampusPosition(campus, listing) {
  if (!campus) return null
  const seed = listingJitterSeed(listing)
  const angle = ((seed % 360) * Math.PI) / 180
  const reportedKm = Number(listing?.distance_to_campus)
  const radiusKm = Number.isFinite(reportedKm) && reportedKm > 0
    ? Math.min(Math.max(reportedKm * 0.85, 0.35), 12)
    : 0.6 + (seed % 40) / 40

  const latOffset = (radiusKm / 111.32) * Math.cos(angle)
  const lngDenom = 111.32 * Math.cos((campus.lat * Math.PI) / 180)
  const lngOffset = lngDenom === 0 ? 0 : (radiusKm / lngDenom) * Math.sin(angle)

  return {
    lat: campus.lat + latOffset,
    lng: campus.lng + lngOffset,
    approximate: true,
  }
}

export function getListingPosition(listing) {
  const exact = toBotswanaLatLng(listing?.lat, listing?.lng)
  if (exact) return { ...exact, approximate: false }

  const campus = resolveCampusCoords(listing)
  if (campus) return approximateCampusPosition(campus, listing)

  return null
}

export function getMapListingPosition(listing, { campusId, campusCenter } = {}) {
  const exact = toBotswanaLatLng(listing?.lat, listing?.lng)

  if (campusCenter) {
    if (exact) {
      if (!isWithinCampusRadius(exact, campusCenter)) return null
      return { ...exact, approximate: false }
    }

    const belongs =
      campusId == null
      || Number(listing?.nearest_university_id) === Number(campusId)

    if (!belongs && campusId != null) return null
    return approximateCampusPosition(campusCenter, listing)
  }

  if (exact) return { ...exact, approximate: false }

  const campus = resolveCampusCoords(listing, campusId)
  if (campus) return approximateCampusPosition(campus, listing)

  return null
}
