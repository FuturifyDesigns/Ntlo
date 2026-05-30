import { getUniversityById } from './universities'

export const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || ''
export const MAPS_ENABLED = Boolean(GOOGLE_MAPS_API_KEY)

/** Gaborone / UB area when no campus filter is active */
export const DEFAULT_MAP_CENTER = { lat: -24.6576, lng: 25.9398 }
export const DEFAULT_MAP_ZOOM = 13
export const CAMPUS_MAP_ZOOM = 15
export const SINGLE_LISTING_ZOOM = 16

export function toLatLng(lat, lng) {
  const latitude = Number(lat)
  const longitude = Number(lng)
  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) return null
  return { lat: latitude, lng: longitude }
}

export function hasValidCoords(lat, lng) {
  return toLatLng(lat, lng) !== null
}

function resolveCampusCoords(listing) {
  const fromApp = getUniversityById(listing?.nearest_university_id)
  const uni = fromApp || listing?.nearest_university
  return toLatLng(uni?.lat, uni?.lng)
}

/** Exact pin, or approximate campus area when listing has no lat/lng */
export function getListingPosition(listing) {
  const exact = toLatLng(listing?.lat, listing?.lng)
  if (exact) return { ...exact, approximate: false }

  const campus = resolveCampusCoords(listing)
  if (campus) return { ...campus, approximate: true }

  return null
}
