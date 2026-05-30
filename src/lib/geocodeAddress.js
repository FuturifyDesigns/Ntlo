/** Build geocode query strings from listing address fields. */
export function buildAddressQueries({ address, area, city, universityCity, country = 'Botswana' }) {
  const cityPart = (city || universityCity || '').trim()
  const parts = [address, area].map((s) => s?.trim()).filter(Boolean)
  const locationLine = parts.join(', ')

  if (!locationLine && !cityPart) return []

  const queries = []
  if (locationLine && cityPart) {
    queries.push(`${locationLine}, ${cityPart}, ${country}`)
    queries.push(`${locationLine}, ${cityPart}`)
  }
  if (locationLine) queries.push(`${locationLine}, ${country}`)
  if (area?.trim() && cityPart) queries.push(`${area.trim()}, ${cityPart}, ${country}`)
  if (cityPart) queries.push(`${cityPart}, ${country}`)

  return [...new Set(queries)]
}

/** Google Maps JS Geocoder (works in browser — no CORS). */
export function geocodeWithGoogle(geocoder, query) {
  if (!geocoder || !query?.trim()) return Promise.resolve(null)

  return new Promise((resolve) => {
    geocoder.geocode(
      { address: query.trim(), componentRestrictions: { country: 'BW' } },
      (results, status) => {
        if (status !== 'OK' || !results?.[0]?.geometry?.location) {
          resolve(null)
          return
        }
        const loc = results[0].geometry.location
        resolve({
          lat: loc.lat(),
          lng: loc.lng(),
          formatted: results[0].formatted_address,
          source: 'google',
        })
      }
    )
  })
}

/** OpenStreetMap fallback when Google returns no match. */
export async function geocodeWithNominatim(query) {
  if (!query?.trim()) return null

  try {
    const url = new URL('https://nominatim.openstreetmap.org/search')
    url.searchParams.set('q', query.trim())
    url.searchParams.set('format', 'json')
    url.searchParams.set('limit', '1')
    url.searchParams.set('countrycodes', 'bw')

    const res = await fetch(url.toString(), {
      headers: { 'Accept-Language': 'en', 'User-Agent': 'Ntlo/1.0 (https://ntlo.online)' },
    })
    if (!res.ok) return null

    const data = await res.json()
    if (!data?.[0]) return null

    return {
      lat: Number(data[0].lat),
      lng: Number(data[0].lon),
      formatted: data[0].display_name,
      source: 'nominatim',
    }
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

/** @deprecated Browser fetch to Geocoding REST API is blocked by CORS — use resolveAddressCoords */
export async function geocodeAddress(fields) {
  return resolveAddressCoords({ geocoder: null, ...fields })
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
      resolve({ formatted: results[0].formatted_address })
    })
  })
}
