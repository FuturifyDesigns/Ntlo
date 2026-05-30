import { useMemo } from 'react'
import { Map, Marker } from '@vis.gl/react-google-maps'
import {
  DEFAULT_MAP_CENTER,
  DEFAULT_MAP_ZOOM,
  MAPS_ENABLED,
  SINGLE_LISTING_ZOOM,
  getListingPosition,
  toLatLng,
} from '../../lib/googleMaps'
import { MapUnavailable } from './GoogleMapsProvider'

function MapWithMarkers({ listings, center, zoom, height, className, emptyHint }) {
  const plotted = useMemo(
    () =>
      listings
        .map((listing) => {
          const position = getListingPosition(listing)
          if (!position) return null
          return { listing, position }
        })
        .filter(Boolean),
    [listings]
  )

  const mapCenter = useMemo(() => {
    if (center) return center
    if (plotted[0]) return { lat: plotted[0].position.lat, lng: plotted[0].position.lng }
    return DEFAULT_MAP_CENTER
  }, [center, plotted])

  const mapZoom = plotted.length === 1 ? SINGLE_LISTING_ZOOM : zoom

  return (
    <div className={`relative overflow-hidden rounded-xl border border-border ${className}`} style={{ height }}>
      {emptyHint && plotted.length === 0 && (
        <div className="absolute inset-x-0 top-0 z-10 border-b border-border bg-surface/95 px-4 py-2 text-center text-sm text-muted">
          {emptyHint}
        </div>
      )}
      <Map
        defaultCenter={mapCenter}
        defaultZoom={mapZoom}
        gestureHandling="cooperative"
        style={{ width: '100%', height: '100%' }}
      >
        {plotted.map(({ listing, position }) => (
          <Marker
            key={listing.id}
            position={{ lat: position.lat, lng: position.lng }}
            title={listing.title}
          />
        ))}
      </Map>
    </div>
  )
}

export default function ListingMap({
  listings = [],
  center,
  zoom = DEFAULT_MAP_ZOOM,
  height = '400px',
  className = '',
  emptyHint = 'No listing locations yet — showing default map area.',
}) {
  if (!MAPS_ENABLED) {
    return (
      <MapUnavailable
        height={height}
        className={className}
        message="Add VITE_GOOGLE_MAPS_API_KEY to enable maps."
      />
    )
  }

  const hasAnyPosition = listings.some((listing) => getListingPosition(listing))

  return (
    <MapWithMarkers
      listings={listings}
      center={center}
      zoom={zoom}
      height={height}
      className={className}
      emptyHint={hasAnyPosition ? null : emptyHint}
    />
  )
}

export function SingleListingMap({ lat, lng, listing, height = '280px', title }) {
  const position = listing ? getListingPosition(listing) : toLatLng(lat, lng)
  const coords = position ? { lat: position.lat, lng: position.lng } : null
  const approximate = position?.approximate

  if (!MAPS_ENABLED) {
    return (
      <MapUnavailable
        height={height}
        message="Add VITE_GOOGLE_MAPS_API_KEY to enable maps."
      />
    )
  }

  if (!coords) {
    return (
      <MapUnavailable
        height={height}
        message="Approximate area — exact location shared on contact"
      />
    )
  }

  return (
    <div className="space-y-2">
      {approximate && (
        <p className="text-xs text-muted">Pin shows campus area — exact address shared when you contact the landlord.</p>
      )}
      <div className="overflow-hidden rounded-xl border border-border" style={{ height }}>
        <Map
          defaultCenter={coords}
          defaultZoom={SINGLE_LISTING_ZOOM}
          gestureHandling="cooperative"
          style={{ width: '100%', height: '100%' }}
        >
          <Marker position={coords} title={title || listing?.title || 'Listing location'} />
        </Map>
      </div>
    </div>
  )
}

export function LocationPicker({ lat, lng, onChange, height = '320px', hint }) {
  const position = toLatLng(lat, lng)
  const center = position || DEFAULT_MAP_CENTER

  function handleClick(event) {
    if (!event.detail.latLng) return
    onChange({
      lat: event.detail.latLng.lat,
      lng: event.detail.latLng.lng,
    })
  }

  if (!MAPS_ENABLED) {
    return (
      <MapUnavailable
        height={height}
        message="Add VITE_GOOGLE_MAPS_API_KEY to pick a location on the map."
      />
    )
  }

  return (
    <div className="space-y-2">
      {hint && <p className="text-sm text-muted">{hint}</p>}
      <div className="overflow-hidden rounded-xl border border-border" style={{ height }}>
        <Map
          defaultCenter={center}
          defaultZoom={position ? SINGLE_LISTING_ZOOM : DEFAULT_MAP_ZOOM}
          gestureHandling="greedy"
          onClick={handleClick}
          style={{ width: '100%', height: '100%' }}
        >
          {position && <Marker position={position} />}
        </Map>
      </div>
      <p className="text-xs text-muted">Click the map to drop a pin for your listing location.</p>
    </div>
  )
}
