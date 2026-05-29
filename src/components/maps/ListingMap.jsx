import { useMemo } from 'react'
import { Map, Marker } from '@vis.gl/react-google-maps'
import {
  DEFAULT_MAP_CENTER,
  DEFAULT_MAP_ZOOM,
  MAPS_ENABLED,
  SINGLE_LISTING_ZOOM,
  toLatLng,
} from '../../lib/googleMaps'
import { MapUnavailable } from './GoogleMapsProvider'

export default function ListingMap({ listings = [], center, zoom = DEFAULT_MAP_ZOOM, height = '400px', className = '' }) {
  const validListings = useMemo(
    () => listings.filter((listing) => toLatLng(listing.lat, listing.lng)),
    [listings]
  )

  const mapCenter = useMemo(() => {
    if (center) return center
    if (validListings[0]) return toLatLng(validListings[0].lat, validListings[0].lng)
    return DEFAULT_MAP_CENTER
  }, [center, validListings])

  if (!MAPS_ENABLED) {
    return (
      <MapUnavailable
        height={height}
        className={className}
        message="Add VITE_GOOGLE_MAPS_API_KEY to enable maps."
      />
    )
  }

  if (!validListings.length && !center) {
    return (
      <MapUnavailable
        height={height}
        className={className}
        message="Map unavailable — location not set"
      />
    )
  }

  return (
    <div className={`overflow-hidden rounded-xl border border-border ${className}`} style={{ height }}>
      <Map
        defaultCenter={mapCenter}
        defaultZoom={zoom}
        gestureHandling="cooperative"
        style={{ width: '100%', height: '100%' }}
      >
        {validListings.map((listing) => {
          const position = toLatLng(listing.lat, listing.lng)
          if (!position) return null
          return <Marker key={listing.id} position={position} title={listing.title} />
        })}
      </Map>
    </div>
  )
}

export function SingleListingMap({ lat, lng, height = '280px', title }) {
  const position = toLatLng(lat, lng)

  if (!MAPS_ENABLED) {
    return (
      <MapUnavailable
        height={height}
        message="Add VITE_GOOGLE_MAPS_API_KEY to enable maps."
      />
    )
  }

  if (!position) {
    return (
      <MapUnavailable
        height={height}
        message="Approximate area — exact location shared on contact"
      />
    )
  }

  return (
    <div className="overflow-hidden rounded-xl border border-border" style={{ height }}>
      <Map
        defaultCenter={position}
        defaultZoom={SINGLE_LISTING_ZOOM}
        gestureHandling="cooperative"
        style={{ width: '100%', height: '100%' }}
      >
        <Marker position={position} title={title || 'Listing location'} />
      </Map>
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
