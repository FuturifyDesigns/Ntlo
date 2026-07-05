import { calculateDistance } from './utils'
import { CAMPUS_MAP_ZOOM, SINGLE_LISTING_ZOOM } from './googleMaps'

/** When campus and pin are this close, avoid zooming out past campusZoom after fitBounds. */
export const CAMPUS_PIN_FOCUS_MAX_KM = 5

/**
 * Move the map to show campus and/or listing pin.
 * When both exist, fitBounds so the distance line between them is visible.
 */
export function applyMapCameraFocus(map, { campus, pin, campusZoom, pinZoom, maxFitKm = CAMPUS_PIN_FOCUS_MAX_KM }) {
  if (!map) return

  const pinZ = pinZoom ?? SINGLE_LISTING_ZOOM
  const campusZ = campusZoom ?? CAMPUS_MAP_ZOOM

  if (pin && campus) {
    const bounds = new google.maps.LatLngBounds()
    bounds.extend(campus)
    bounds.extend(pin)
    map.fitBounds(bounds, 72)
    google.maps.event.addListenerOnce(map, 'idle', () => {
      const z = map.getZoom()
      if (z > 17) map.setZoom(17)
      const km = calculateDistance(pin.lat, pin.lng, campus.lat, campus.lng)
      if (km <= maxFitKm && z < campusZ) map.setZoom(campusZ)
    })
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
