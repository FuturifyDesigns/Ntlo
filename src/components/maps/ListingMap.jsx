import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Map, Marker, InfoWindow, useMap } from '@vis.gl/react-google-maps'
import {
  CAMPUS_MAP_ZOOM,
  DEFAULT_MAP_CENTER,
  DEFAULT_MAP_ZOOM,
  MAPS_ENABLED,
  SINGLE_LISTING_ZOOM,
  getListingPosition,
  toLatLng,
} from '../../lib/googleMaps'
import { formatPrice } from '../../lib/utils'
import { useTranslation } from '../../hooks/useTranslation'
import { MapUnavailable } from './GoogleMapsProvider'

function MapViewportController({ viewport, plotted }) {
  const map = useMap()

  useEffect(() => {
    if (!map) return

    if (viewport?.center) {
      map.setCenter(viewport.center)
      map.setZoom(viewport.zoom ?? CAMPUS_MAP_ZOOM)
      return
    }

    if (!plotted.length) {
      map.setCenter(DEFAULT_MAP_CENTER)
      map.setZoom(DEFAULT_MAP_ZOOM)
      return
    }

    if (plotted.length === 1) {
      map.setCenter(plotted[0].position)
      map.setZoom(SINGLE_LISTING_ZOOM)
      return
    }

    const bounds = new google.maps.LatLngBounds()
    plotted.forEach(({ position }) => bounds.extend(position))
    map.fitBounds(bounds, 48)
  }, [map, viewport, plotted])

  return null
}

function MapWithMarkers({
  listings,
  viewport,
  height,
  className,
  emptyHint,
  interactive = false,
}) {
  const { t } = useTranslation()
  const [selectedId, setSelectedId] = useState(null)

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

  const selected = plotted.find(({ listing }) => listing.id === selectedId)

  const initialCenter = viewport?.center
    || (plotted[0] ? { lat: plotted[0].position.lat, lng: plotted[0].position.lng } : DEFAULT_MAP_CENTER)

  const initialZoom = viewport?.zoom
    ?? (plotted.length === 1 ? SINGLE_LISTING_ZOOM : DEFAULT_MAP_ZOOM)

  useEffect(() => {
    setSelectedId(null)
  }, [listings, viewport])

  return (
    <div className={`relative overflow-hidden rounded-xl border border-border ${className}`} style={{ height }}>
      {emptyHint && plotted.length === 0 && (
        <div className="absolute inset-x-0 top-0 z-10 border-b border-border bg-surface/95 px-4 py-2 text-center text-sm text-muted">
          {emptyHint}
        </div>
      )}
      {viewport?.center && (
        <div className="absolute inset-x-0 top-0 z-10 border-b border-border bg-primary/90 px-4 py-2 text-center text-sm font-medium text-white">
          {t('listings.mapCampusFocus', { campus: viewport.label || t('listings.mapCampusDefault') })}
        </div>
      )}
      <Map
        defaultCenter={initialCenter}
        defaultZoom={initialZoom}
        gestureHandling="cooperative"
        style={{ width: '100%', height: '100%' }}
        onClick={() => setSelectedId(null)}
      >
        <MapViewportController viewport={viewport} plotted={plotted} />
        {plotted.map(({ listing, position }) => (
          <Marker
            key={listing.id}
            position={{ lat: position.lat, lng: position.lng }}
            title={listing.title}
            onClick={(event) => {
              if (typeof event.stop === 'function') event.stop()
              if (interactive) setSelectedId(listing.id)
            }}
          />
        ))}
        {interactive && selected && (
          <InfoWindow
            position={{ lat: selected.position.lat, lng: selected.position.lng }}
            onCloseClick={() => setSelectedId(null)}
          >
            <div className="max-w-[220px] space-y-2 p-1">
              <p className="font-semibold text-primary">{selected.listing.title}</p>
              <p className="text-sm font-mono font-semibold text-accent">
                {formatPrice(selected.listing.price)}{t('listings.perMo')}
              </p>
              <p className="text-xs text-muted">
                {[selected.listing.area, selected.listing.city].filter(Boolean).join(', ')}
              </p>
              {selected.position.approximate && (
                <p className="text-xs text-muted">{t('listings.mapApproxPin')}</p>
              )}
              <Link
                to={`/listings/${selected.listing.id}`}
                className="inline-block text-sm font-semibold text-accent hover:underline"
              >
                {t('listings.viewListing')} →
              </Link>
            </div>
          </InfoWindow>
        )}
      </Map>
    </div>
  )
}

export default function ListingMap({
  listings = [],
  viewport = null,
  height = '400px',
  className = '',
  emptyHint = 'No listing locations yet — showing default map area.',
  interactive = false,
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
      viewport={viewport}
      height={height}
      className={className}
      emptyHint={hasAnyPosition ? null : emptyHint}
      interactive={interactive}
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
