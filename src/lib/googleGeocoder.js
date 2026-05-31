import { GOOGLE_MAPS_API_KEY, MAPS_ENABLED } from './googleMaps'

/** Rough centre of Botswana — bias Places search to the whole country. */
export const BOTSWANA_MAP_CENTER = { lat: -22.3285, lng: 24.6849 }
export const BOTSWANA_BIAS_RADIUS_M = 650_000

export function waitForGoogleMaps(timeoutMs = 15000) {
  return new Promise((resolve) => {
    if (typeof window === 'undefined') {
      resolve(null)
      return
    }

    if (window.google?.maps?.importLibrary) {
      resolve(window.google.maps)
      return
    }

    const started = Date.now()
    const tick = () => {
      if (window.google?.maps?.importLibrary) {
        resolve(window.google.maps)
        return
      }
      if (Date.now() - started > timeoutMs) {
        resolve(null)
        return
      }
      setTimeout(tick, 50)
    }
    tick()
  })
}

export async function getGoogleGeocoder() {
  if (!MAPS_ENABLED || !GOOGLE_MAPS_API_KEY) return null

  const maps = await waitForGoogleMaps()
  if (!maps) return null

  try {
    const { Geocoder } = await maps.importLibrary('geocoding')
    return new Geocoder()
  } catch {
    return maps.Geocoder ? new maps.Geocoder() : null
  }
}

/** Fuzzy campus lookup via Places text search (handles wording differences). */
export async function searchPlacesCampus(textQuery) {
  if (!textQuery?.trim() || !MAPS_ENABLED) return null

  const maps = await waitForGoogleMaps()
  if (!maps) return null

  try {
    const { Place } = await maps.importLibrary('places')
    const query = /\bbotswana\b/i.test(textQuery) ? textQuery.trim() : `${textQuery.trim()}, Botswana`

    const { places } = await Place.searchByText({
      textQuery: query,
      fields: ['location', 'displayName', 'formattedAddress', 'types'],
      locationBias: { center: BOTSWANA_MAP_CENTER, radius: BOTSWANA_BIAS_RADIUS_M },
    })

    if (!places?.length) return null

    const campusTypes = new Set(['university', 'school', 'primary_school', 'secondary_school'])
    const campus = places.find((p) => p.types?.some((t) => campusTypes.has(t))) || places[0]
    const loc = campus.location
    if (!loc) return null

    const lat = typeof loc.lat === 'function' ? loc.lat() : loc.lat
    const lng = typeof loc.lng === 'function' ? loc.lng() : loc.lng
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null

    return {
      lat,
      lng,
      formatted: campus.formattedAddress || campus.displayName,
      source: 'places',
    }
  } catch {
    return null
  }
}
