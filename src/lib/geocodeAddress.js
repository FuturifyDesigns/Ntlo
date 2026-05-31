import { getCachedGeocode, setCachedGeocode } from './geocodeCache'
import { normalizeUniversityName } from './universityNames'
import { searchPlacesCampus } from './googleGeocoder'

const CAMPUS_TYPES = new Set([
  'university',
  'school',
  'primary_school',
  'secondary_school',
  'establishment',
])

const LOCATION_PRECISION = {
  ROOFTOP: 4,
  RANGE_INTERPOLATED: 3,
  GEOMETRIC_CENTER: 2,
  APPROXIMATE: 1,
}

function pickBestGoogleResult(results) {
  if (!results?.length) return null
  let best = results[0]
  let bestScore = -1

  for (const result of results) {
    const precision = LOCATION_PRECISION[result.geometry?.location_type] ?? 0
    const campusBoost = result.types?.some((t) => CAMPUS_TYPES.has(t)) ? 2 : 0
    const score = precision + campusBoost
    if (score > bestScore) {
      best = result
      bestScore = score
    }
  }

  return best
}

/** Build geocode query strings from listing address fields — many variants for obscure names. */
export function buildAddressQueries({ address, area, city, universityCity, country = 'Botswana' }) {
  const cityPart = (city || universityCity || '').trim()
  const addr = address?.trim() || ''
  const areaPart = area?.trim() || ''
  const parts = [addr, areaPart].filter(Boolean)
  const locationLine = parts.join(', ')

  if (!locationLine && !cityPart) return []

  const queries = []

  if (locationLine && cityPart) {
    queries.push(`${locationLine}, ${cityPart}, ${country}`)
    queries.push(`${locationLine}, ${cityPart}`)
    if (areaPart && addr) {
      queries.push(`${areaPart}, ${addr}, ${cityPart}, ${country}`)
    }
  }
  if (locationLine) queries.push(`${locationLine}, ${country}`)
  if (areaPart && cityPart) {
    queries.push(`${areaPart}, ${cityPart}, ${country}`)
    queries.push(`${areaPart}, ${cityPart}`)
    // Plot/block style addresses in Botswana
    if (/^plot\s/i.test(areaPart) || /^block\s/i.test(areaPart)) {
      queries.push(`${areaPart.replace(/^(plot|block)\s+/i, '')}, ${cityPart}, ${country}`)
    }
  }
  if (addr && cityPart && !areaPart) {
    queries.push(`${addr}, ${cityPart}, ${country}`)
  }
  if (cityPart) queries.push(`${cityPart}, ${country}`)

  // Strip parenthetical notes and retry
  const cleaned = locationLine.replace(/\([^)]*\)/g, '').replace(/\s+/g, ' ').trim()
  if (cleaned && cleaned !== locationLine && cityPart) {
    queries.push(`${cleaned}, ${cityPart}, ${country}`)
  }

  return [...new Set(queries.filter(Boolean))]
}

/** Major Botswana towns — used when the submitted city is slightly off (e.g. Gaborone vs Sebele). */
const BOTSWANA_CAMPUS_CITIES = [
  'Gaborone', 'Sebele', 'Francistown', 'Palapye', 'Maun', 'Kanye', 'Lobatse',
  'Serowe', 'Mahalapye', 'Molepolole', 'Selibe Phikwe', 'Kasane', 'Oodi',
]

const ACRONYM_STOP = new Set(['of', 'the', 'and', 'a', 'in', 'for', 'at', 'to'])

/** Extra search phrases for campuses that Google lists under a nearby town or alias. */
const KNOWN_CAMPUS_ALIASES = {
  'botswana university of agriculture and natural resources': [
    'BUAN Botswana',
    'Botswana University of Agriculture & Natural Resources',
    'Botswana University of Agriculture and Natural Resources Sebele',
  ],
}

export function buildCampusAcronym(name) {
  const words = normalizeUniversityName(name).split(/\s+/).filter(Boolean)
  const significant = words.filter((w) => !ACRONYM_STOP.has(w.toLowerCase()))
  if (significant.length < 3) return null
  const acronym = significant.map((w) => w[0]).join('').toUpperCase()
  return acronym.length >= 3 ? acronym : null
}

function campusNameVariants(name) {
  const base = normalizeUniversityName(name?.trim() || '')
  if (!base) return []

  const variants = new Set([base])

  const noParens = base.replace(/\([^)]*\)/g, '').replace(/\s+/g, ' ').trim()
  if (noParens) variants.add(noParens)

  if (/\band\b/i.test(base)) {
    variants.add(base.replace(/\band\b/gi, '&'))
  }
  if (base.includes('&')) {
    variants.add(base.replace(/&/g, 'and'))
  }

  const acronym = buildCampusAcronym(base)
  if (acronym) variants.add(acronym)

  const aliasKey = base.toLowerCase()
  for (const alias of KNOWN_CAMPUS_ALIASES[aliasKey] || []) {
    variants.add(alias)
  }

  return [...variants]
}

/** Build geocode query strings — many variants so obscure / mis-typed campuses still resolve. */
export function buildUniversityCampusQueries({ name, city, country = 'Botswana' }) {
  const cityPart = normalizeUniversityName(city?.trim() || '')
  const names = campusNameVariants(name)
  if (!names.length) return []

  const queries = new Set()

  for (const campusName of names) {
    if (cityPart) {
      queries.add(`${campusName}, ${cityPart}, ${country}`)
      queries.add(`${campusName}, ${cityPart}`)
    }
    queries.add(`${campusName}, ${country}`)
    queries.add(`${campusName} ${country}`)

    if (!/\b(university|college|institute|polytechnic|campus|school)\b/i.test(campusName)) {
      if (cityPart) {
        queries.add(`${campusName} university, ${cityPart}, ${country}`)
        queries.add(`${campusName} college, ${cityPart}, ${country}`)
      }
      queries.add(`${campusName} university, ${country}`)
      queries.add(`${campusName} college, ${country}`)
    }
  }

  // Submitted city may be wrong — try other Botswana towns (Sebele for BUAN, Palapye for BIUST, etc.)
  const primary = names[0]
  const altCities = BOTSWANA_CAMPUS_CITIES.filter(
    (c) => !cityPart || c.toLowerCase() !== cityPart.toLowerCase()
  )
  for (const altCity of altCities) {
    queries.add(`${primary}, ${altCity}, ${country}`)
  }

  return [...queries]
}

/** Shorter queries for Places text search (more tolerant of wording). */
export function buildUniversityPlacesQueries({ name, city, country = 'Botswana' }) {
  const cityPart = normalizeUniversityName(city?.trim() || '')
  const names = campusNameVariants(name)
  if (!names.length) return []

  const queries = new Set()
  for (const campusName of names) {
    queries.add(campusName)
    if (cityPart) queries.add(`${campusName} ${cityPart}`)
    queries.add(`${campusName} university`)
  }

  if (cityPart) queries.add(`${names[0]} ${cityPart} ${country}`)
  queries.add(`${names[0]} ${country}`)

  return [...queries]
}

/** Google Maps JS Geocoder (works in browser — no CORS). */
export function geocodeWithGoogle(geocoder, query, { preferCampus = false } = {}) {
  if (!geocoder || !query?.trim()) return Promise.resolve(null)

  const cached = getCachedGeocode(query)
  if (cached) return Promise.resolve(cached)

  return new Promise((resolve) => {
    geocoder.geocode(
      { address: query.trim(), componentRestrictions: { country: 'BW' } },
      (results, status) => {
        if (status !== 'OK' || !results?.length) {
          resolve(null)
          return
        }
        const campusResults = results.filter((r) =>
          r.types?.some((t) => CAMPUS_TYPES.has(t))
        )
        const picked = preferCampus
          ? pickBestGoogleResult(campusResults.length ? campusResults : results)
          : pickBestGoogleResult(results)
        if (!picked?.geometry?.location) {
          resolve(null)
          return
        }
        const loc = picked.geometry.location
        const result = {
          lat: loc.lat(),
          lng: loc.lng(),
          formatted: picked.formatted_address,
          source: 'google',
        }
        setCachedGeocode(query, result)
        resolve(result)
      }
    )
  })
}

/** OpenStreetMap fallback when Google returns no match. */
export async function geocodeWithNominatim(query) {
  if (!query?.trim()) return null

  const cached = getCachedGeocode(`osm:${query}`)
  if (cached) return cached

  try {
    const url = new URL('https://nominatim.openstreetmap.org/search')
    url.searchParams.set('q', query.trim())
    url.searchParams.set('format', 'json')
    url.searchParams.set('limit', '3')
    url.searchParams.set('countrycodes', 'bw')

    const res = await fetch(url.toString(), {
      headers: { 'Accept-Language': 'en', 'User-Agent': 'Ntlo/1.0 (https://ntlo.online)' },
    })
    if (!res.ok) return null

    const data = await res.json()
    if (!data?.[0]) return null

    const best = data[0]
    const result = {
      lat: Number(best.lat),
      lng: Number(best.lon),
      formatted: best.display_name,
      source: 'nominatim',
    }
    setCachedGeocode(`osm:${query}`, result)
    return result
  } catch {
    return null
  }
}

/** Try Google Geocoder then Nominatim for each query variant. */
export async function resolveAddressCoords({ geocoder, address, area, city, universityCity }) {
  const queries = buildAddressQueries({ address, area, city, universityCity })

  for (const query of queries) {
    const google = geocoder ? await geocodeWithGoogle(geocoder, query) : null
    if (google) return google
  }

  for (const query of queries) {
    const osm = await geocodeWithNominatim(query)
    if (osm) return osm
  }

  return null
}

/** Geocode a university / campus name — tries many query variants, Places search, then OSM. */
export async function resolveUniversityCampusCoords({ geocoder, name, city, country = 'Botswana' }) {
  const queries = buildUniversityCampusQueries({ name, city, country })

  for (const query of queries) {
    const google = geocoder ? await geocodeWithGoogle(geocoder, query, { preferCampus: true }) : null
    if (google) return google
  }

  const placesQueries = buildUniversityPlacesQueries({ name, city, country })
  for (const query of placesQueries) {
    const place = await searchPlacesCampus(query)
    if (place) return place
  }

  for (const query of queries) {
    const osm = await geocodeWithNominatim(query)
    if (osm) return osm
  }

  return null
}

/** @deprecated Browser fetch to Geocoding REST API is blocked by CORS — use resolveAddressCoords */
export async function geocodeAddress(fields) {
  return resolveAddressCoords({ geocoder: null, ...fields })
}

/** Extract street, area, and city from a Google Geocoder result. */
export function parseGoogleAddressResult(result) {
  if (!result?.address_components) {
    return { address: '', area: '', city: '', formatted: result?.formatted_address || '' }
  }

  const components = result.address_components
  const get = (type) => components.find((c) => c.types.includes(type))?.long_name || ''

  const streetNumber = get('street_number')
  const route = get('route')
  const address = [streetNumber, route].filter(Boolean).join(' ').trim()

  const area = get('sublocality')
    || get('sublocality_level_1')
    || get('neighborhood')
    || get('administrative_area_level_2')
    || get('administrative_area_level_3')
    || ''

  const city = get('locality')
    || get('administrative_area_level_1')
    || ''

  return {
    address,
    area,
    city,
    formatted: result.formatted_address || '',
  }
}

export async function reverseGeocodeWithGoogle(geocoder, lat, lng) {
  if (!geocoder) return null
  const latitude = Number(lat)
  const longitude = Number(lng)
  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) return null

  return new Promise((resolve) => {
    geocoder.geocode({ location: { lat: latitude, lng: longitude } }, (results, status) => {
      if (status !== 'OK' || !results?.[0]) {
        resolve(null)
        return
      }
      const parsed = parseGoogleAddressResult(results[0])
      resolve({
        lat: latitude,
        lng: longitude,
        ...parsed,
      })
    })
  })
}
