import { GOOGLE_MAPS_API_KEY } from './googleMaps'

async function geocodeQuery(query) {
  if (!GOOGLE_MAPS_API_KEY || !query?.trim()) return null

  const url = new URL('https://maps.googleapis.com/maps/api/geocode/json')
  url.searchParams.set('address', query.trim())
  url.searchParams.set('components', 'country:BW')
  url.searchParams.set('key', GOOGLE_MAPS_API_KEY)

  const res = await fetch(url.toString())
  if (!res.ok) return null

  const data = await res.json()
  if (data.status !== 'OK' || !data.results?.length) return null

  const result = data.results[0]
  if (!result?.geometry?.location) return null

  return {
    lat: result.geometry.location.lat,
    lng: result.geometry.location.lng,
    formatted: result.formatted_address,
    source: 'geocode',
  }
}

/** Geocode a street address in Botswana for listing pins. */
export async function geocodeAddress({ address, area, city, country = 'Botswana' }) {
  const street = [address, area].filter(Boolean).join(', ')
  const cityPart = city?.trim()
  if (!street && !cityPart) return null

  const queries = [
    street && cityPart ? `${street}, ${cityPart}, ${country}` : null,
    street ? `${street}, ${country}` : null,
    cityPart ? `${cityPart}, ${country}` : null,
  ].filter(Boolean)

  for (const query of queries) {
    const coords = await geocodeQuery(query)
    if (coords) return coords
  }

  return null
}

/** Reverse geocode coordinates to a human-readable address hint. */
export async function reverseGeocode(lat, lng) {
  if (!GOOGLE_MAPS_API_KEY) return null
  const latitude = Number(lat)
  const longitude = Number(lng)
  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) return null

  const url = new URL('https://maps.googleapis.com/maps/api/geocode/json')
  url.searchParams.set('latlng', `${latitude},${longitude}`)
  url.searchParams.set('key', GOOGLE_MAPS_API_KEY)

  const res = await fetch(url.toString())
  if (!res.ok) return null

  const data = await res.json()
  if (data.status !== 'OK' || !data.results?.length) return null

  return { formatted: data.results[0].formatted_address }
}
