import {
  GOOGLE_MAPS_CAMPUS_NAMES,
  getGeocodeCampusName,
  normalizeUniversityName,
} from './universityNames'
import { getGoogleGeocoder } from './googleGeocoder'
import { resolveUniversityCampusCoords } from './geocodeAddress'

export function hasValidCampusCoords(lat, lng) {
  const latitude = Number(lat)
  const longitude = Number(lng)
  return Number.isFinite(latitude) && Number.isFinite(longitude) && !(latitude === 0 && longitude === 0)
}

export function slugifyUniversity(name) {
  return name
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80)
}

/** Store the full official name (same as Google Maps listing). */
export function makeUniversityShortName(name) {
  return normalizeUniversityName(name)
}

/** Resolve campus coordinates via Google Maps (Geocoder + Places) across Botswana. */
export async function geocodeCampus({ name, city, slug, country = 'Botswana' }) {
  const campusName = slug && GOOGLE_MAPS_CAMPUS_NAMES[slug]
    ? GOOGLE_MAPS_CAMPUS_NAMES[slug]
    : normalizeUniversityName(name)

  const cityPart = normalizeUniversityName(city)
  const geocoder = await getGoogleGeocoder()

  return resolveUniversityCampusCoords({
    geocoder,
    name: campusName,
    city: cityPart,
    country,
  })
}

export { getGeocodeCampusName, normalizeUniversityName }
