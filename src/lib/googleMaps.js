export const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || ''
export const MAPS_ENABLED = Boolean(GOOGLE_MAPS_API_KEY)

/** Gaborone / UB area */
export const DEFAULT_MAP_CENTER = { lat: -24.6556, lng: 25.909 }
export const DEFAULT_MAP_ZOOM = 13
export const SINGLE_LISTING_ZOOM = 15

export function toLatLng(lat, lng) {
  const latitude = Number(lat)
  const longitude = Number(lng)
  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) return null
  return { lat: latitude, lng: longitude }
}

export function hasValidCoords(lat, lng) {
  return toLatLng(lat, lng) !== null
}
