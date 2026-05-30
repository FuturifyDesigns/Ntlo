import { GOOGLE_MAPS_API_KEY } from './googleMaps'

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

/** Resolve campus coordinates from name + city (Google Geocoding API). */
export async function geocodeCampus({ name, city, country = 'Botswana' }) {
  const queries = [
    `${name}, ${city}, ${country}`,
    `${name} university, ${city}, ${country}`,
    `${name} campus, ${city}, ${country}`,
  ]

  for (const query of queries) {
    const coords = await geocodeQuery(query)
    if (coords) return coords
  }

  return geocodeQuery(`${city}, ${country}`)
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

export function makeUniversityShortName(name) {
  const words = name.trim().split(/\s+/).filter(Boolean)
  if (!words.length) return 'Uni'

  const acronym = words
    .filter((w) => /^[A-Z]/.test(w) || w.length <= 3)
    .map((w) => w[0])
    .join('')
    .toUpperCase()

  if (acronym.length >= 2 && acronym.length <= 8) return acronym
  return words[0].slice(0, 12)
}
