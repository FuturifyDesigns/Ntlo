import { APIProvider } from '@vis.gl/react-google-maps'
import { GOOGLE_MAPS_API_KEY, MAPS_ENABLED } from '../../lib/googleMaps'

export default function GoogleMapsProvider({ children }) {
  if (!MAPS_ENABLED) return children

  return (
    <APIProvider apiKey={GOOGLE_MAPS_API_KEY} libraries={['maps', 'marker', 'geocoding', 'places']}>
      {children}
    </APIProvider>
  )
}

export function MapUnavailable({ message, height = '400px', className = '' }) {
  return (
    <div
      className={`flex items-center justify-center rounded-xl border border-border bg-background px-4 text-center text-sm text-muted ${className}`}
      style={{ height }}
    >
      {message}
    </div>
  )
}
