import { GOOGLE_MAPS_API_KEY } from './googleMaps'
import {
  GOOGLE_MAPS_CAMPUS_NAMES,
  getGeocodeCampusName,
  normalizeUniversityName,
} from './universityNames'

const CAMPUS_TYPES = new Set([
  'university',
  'school',
  'primary_school',
  'secondary_school',
  'establishment',
])

function pickCampusResult(results) {
  if (!results?.length) return null
  const campus = results.find((r) => r.types?.some((t) => CAMPUS_TYPES.has(t)))
  return campus || results[0]
}

async function geocodeQuery(query) {
  if (!GOOGLE_MAPS_API_KEY) return null

  const url = new URL('https://maps.googleapis.com/maps/api/geocode/json')
  url.searchParams.set('address', query)
  url.searchParams.set('components', 'country:BW')
  url.searchParams.set('key', GOOGLE_MAPS_API_KEY)

  const res = await fetch(url.toString())
  if (!res.ok) return null

  const data = await res.json()
  if (data.status !== 'OK' || !data.results?.length) return null

  const result = pickCampusResult(data.results)
  if (!result?.geometry?.location) return null

  return {
    lat: result.geometry.location.lat,
    lng: result.geometry.location.lng,
    source: 'geocode',
  }
}

/** Resolve campus coordinates using Google Maps–style full names. */
export async function geocodeCampus({ name, city, slug, country = 'Botswana' }) {
  const campusName = slug && GOOGLE_MAPS_CAMPUS_NAMES[slug]
    ? GOOGLE_MAPS_CAMPUS_NAMES[slug]
    : normalizeUniversityName(name)

  const cityPart = normalizeUniversityName(city)
  const queries = [
    `${campusName}, ${cityPart}, ${country}`,
    `${campusName}, ${country}`,
  ]

  if (!/\b(university|college|institute)\b/i.test(campusName)) {
    queries.push(`${campusName} university, ${cityPart}, ${country}`)
  }

  for (const query of queries) {
    const coords = await geocodeQuery(query)
    if (coords) return coords
  }

  return geocodeQuery(`${cityPart}, ${country}`)
}

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

export { getGeocodeCampusName, normalizeUniversityName }
