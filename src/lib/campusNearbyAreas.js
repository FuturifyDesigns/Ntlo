import { parseGoogleAddressResult } from './geocodeAddress'

const AREA_TYPES = new Set([
  'neighborhood',
  'sublocality',
  'sublocality_level_1',
  'sublocality_level_2',
  'administrative_area_level_2',
  'administrative_area_level_3',
  'locality',
  'route',
])

const SKIP_NAMES = new Set(['botswana', 'gaborone', 'south-east', 'south east'])

function addAreaName(set, name) {
  const trimmed = (name || '').trim()
  if (!trimmed || trimmed.length < 3) return
  if (SKIP_NAMES.has(trimmed.toLowerCase())) return
  set.add(trimmed)
}

function extractAreasFromResult(result, areas) {
  if (!result) return
  const parsed = parseGoogleAddressResult(result)
  addAreaName(areas, parsed.area)
  addAreaName(areas, parsed.city)

  for (const component of result.address_components || []) {
    if (component.types?.some((t) => AREA_TYPES.has(t))) {
      addAreaName(areas, component.long_name)
    }
  }
}

function reverseGeocodeAt(geocoder, lat, lng) {
  return new Promise((resolve) => {
    geocoder.geocode({ location: { lat, lng } }, (results, status) => {
      if (status !== 'OK' || !results?.length) {
        resolve([])
        return
      }
      resolve(results)
    })
  })
}

/** Pull neighbourhood / suburb names around a campus pin from Google Maps. */
export async function fetchCampusNearbyAreas(geocoder, lat, lng) {
  if (!geocoder || !Number.isFinite(lat) || !Number.isFinite(lng)) return []

  const areas = new Set()
  const mainResults = await reverseGeocodeAt(geocoder, lat, lng)
  for (const result of mainResults) {
    extractAreasFromResult(result, areas)
  }

  // Sample nearby points (~1.5 km) to capture surrounding suburbs Google lists separately.
  const offsets = [
    [0.014, 0],
    [-0.014, 0],
    [0, 0.014],
    [0, -0.014],
    [0.01, 0.01],
    [-0.01, -0.01],
  ]

  for (const [dLat, dLng] of offsets) {
    const sampleResults = await reverseGeocodeAt(geocoder, lat + dLat, lng + dLng)
    for (const result of sampleResults.slice(0, 2)) {
      extractAreasFromResult(result, areas)
    }
  }

  return [...areas].slice(0, 8)
}
