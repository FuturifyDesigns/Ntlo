import { calculateDistance } from './utils'
import { CAMPUS_MAP_ZOOM, SINGLE_LISTING_ZOOM } from './googleMaps'

/** Max km between campus and pin before we focus the pin instead of fitBounds. */
export const CAMPUS_PIN_FOCUS_MAX_KM = 5

/**
 * Move the map to show campus and/or listing pin without zooming out too far.
 * Prefers zooming in on the pin; uses fitBounds only when targets are close together.
 */
export function applyMapCameraFocus(map, { campus, pin, campusZoom, pinZoom, maxFitKm = CAMPUS_PIN_FOCUS_MAX_KM }) {
  if (!map) return

  const pinZ = pinZoom ?? SINGLE_LISTING_ZOOM
  const campusZ = campusZoom ?? CAMPUS_MAP_ZOOM

  if (pin && campus) {
    const km = calculateDistance(pin.lat, pin.lng, campus.lat, campus.lng)
    if (km <= maxFitKm) {
      const bounds = new google.maps.LatLngBounds()
      bounds.extend(campus)
      bounds.extend(pin)
      map.fitBounds(bounds, 56)
      google.maps.event.addListenerOnce(map, 'idle', () => {
        const z = map.getZoom()
        if (z < campusZ) map.setZoom(campusZ)
        if (z > 17) map.setZoom(17)
      })
      return
    }
    map.panTo(pin)
    map.setZoom(pinZ)
    return
  }

  if (pin) {
    map.panTo(pin)
    map.setZoom(pinZ)
    return
  }

  if (campus) {
    map.panTo(campus)
    map.setZoom(campusZ)
  }
}
