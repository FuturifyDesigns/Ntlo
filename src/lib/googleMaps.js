import { getUniversityById } from './universities'
import { calculateDistance } from './utils'

export const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || ''
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
  const fromApp = getUniversityById(preferredCampusId ?? listing?.nearest_university_id)
  const uni = fromApp || listing?.nearest_university
  return toLatLng(uni?.lat, uni?.lng)
}

function isWithinCampusRadius(position, campusCenter, maxKm = CAMPUS_PIN_MAX_KM) {
  if (!campusCenter) return true
  const km = calculateDistance(position.lat, position.lng, campusCenter.lat, campusCenter.lng)
  return km <= maxKm
}

/** Exact pin, or approximate campus area when listing has no lat/lng */
export function getListingPosition(listing) {
  const exact = toLatLng(listing?.lat, listing?.lng)
  if (exact) return { ...exact, approximate: false }

  const campus = resolveCampusCoords(listing)
  if (campus) return { ...campus, approximate: true }

  return null
}

/**
 * Pin for browse map — when a campus filter is active, only plot exact coords
 * near that campus so pins stay consistent with the filtered university.
 */
export function getMapListingPosition(listing, { campusId, campusCenter } = {}) {
  const exact = toLatLng(listing?.lat, listing?.lng)

  if (campusCenter) {
    if (exact) {
      if (!isWithinCampusRadius(exact, campusCenter)) return null
      return { ...exact, approximate: false }
    }
    return null
  }

  if (exact) return { ...exact, approximate: false }

  const campus = resolveCampusCoords(listing, campusId)
  if (campus) return { ...campus, approximate: true }

  return null
}
