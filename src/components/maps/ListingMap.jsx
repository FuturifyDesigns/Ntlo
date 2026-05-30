import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  AdvancedMarker,
  InfoWindow,
  Map,
  useAdvancedMarkerRef,
  useMap,
} from '@vis.gl/react-google-maps'
import {
  CAMPUS_MAP_ZOOM,
  DEFAULT_MAP_CENTER,
  DEFAULT_MAP_ZOOM,
  GOOGLE_MAPS_MAP_ID,
  MAPS_ENABLED,
  SINGLE_LISTING_ZOOM,
  getListingPosition,
  getMapListingPosition,
  toLatLng,
} from '../../lib/googleMaps'
import { formatPrice } from '../../lib/utils'
import { useTranslation } from '../../hooks/useTranslation'
import { MapUnavailable } from './GoogleMapsProvider'

/** Keep campus centered when filter changes; do not re-center when listings load or user pans. */
function CampusViewportLock({ viewport }) {
  const map = useMap()
  const viewportKey = viewport?.id ?? null

  useEffect(() => {
    if (!map || !viewport?.center) return
    map.panTo(viewport.center)
    map.setZoom(viewport.zoom ?? CAMPUS_MAP_ZOOM)
  }, [map, viewportKey, viewport?.center?.lat, viewport?.center?.lng, viewport?.zoom])

  return null
}

/** Fit map to listing pins when no campus filter is active. */
function ListingsBoundsFit({ plotted, disabled }) {
  const map = useMap()

  useEffect(() => {
    if (!map || disabled) return

    if (!plotted.length) {
      map.panTo(DEFAULT_MAP_CENTER)
      map.setZoom(DEFAULT_MAP_ZOOM)
      return
    }

    if (plotted.length === 1) {
      map.panTo(plotted[0].position)
      map.setZoom(SINGLE_LISTING_ZOOM)
      return
    }

    const bounds = new google.maps.LatLngBounds()
    plotted.forEach(({ position }) => bounds.extend(position))
    map.fitBounds(bounds, 48)
  }, [map, disabled, plotted])

  return null
}

function CampusMarker({ position, label }) {
  return (
    <AdvancedMarker position={position} title={label} zIndex={2000} anchorPoint={['50%', '50%']}>
      <div
        className="h-[22px] w-[22px] rounded-full border-[3px] border-white shadow-md"
        style={{ backgroundColor: '#c45c26' }}
        aria-hidden
      />
    </AdvancedMarker>
  )
}

function ListingPin({ listing, position, interactive, selected, onSelect, onClear, t }) {
  const [markerRef, marker] = useAdvancedMarkerRef()

  return (
    <>
      <AdvancedMarker
        ref={markerRef}
        position={{ lat: position.lat, lng: position.lng }}
        title={listing.title}
        zIndex={selected ? 200 : 100}
        onClick={interactive ? () => onSelect(listing.id) : undefined}
      />
      {interactive && selected && (
        <InfoWindow anchor={marker} onCloseClick={onClear}>
          <div className="max-w-[220px] space-y-2 p-1">
            <p className="font-semibold text-primary">{listing.title}</p>
            <p className="text-sm font-mono font-semibold text-accent">
              {formatPrice(listing.price)}{t('listings.perMo')}
            </p>
            <p className="text-xs text-muted">
              {[listing.area, listing.city].filter(Boolean).join(', ')}
            </p>
            {position.approximate && (
              <p className="text-xs text-muted">{t('listings.mapApproxPin')}</p>
            )}
            <Link
              to={`/listings/${listing.id}`}
              className="inline-block text-sm font-semibold text-accent hover:underline"
            >
              {t('listings.viewListing')} →
            </Link>
          </div>
        </InfoWindow>
      )}
    </>
  )
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

  const campusCenter = viewport?.center ?? null
  const campusLocked = Boolean(campusCenter)

  const plotted = useMemo(
    () =>
      listings
        .map((listing) => {
          const position = campusLocked
            ? getMapListingPosition(listing, {
                campusId: viewport?.id,
                campusCenter,
              })
            : getListingPosition(listing)
          if (!position) return null
          return { listing, position }
        })
        .filter(Boolean),
    [listings, campusLocked, campusCenter, viewport?.id]
  )

  const campusMarkerPosition = useMemo(
    () => (campusCenter ? { lat: campusCenter.lat, lng: campusCenter.lng } : null),
    [campusCenter?.lat, campusCenter?.lng]
  )

  const initialCenter = campusCenter
    || (plotted[0] ? { lat: plotted[0].position.lat, lng: plotted[0].position.lng } : DEFAULT_MAP_CENTER)

  const initialZoom = viewport?.zoom
    ?? (plotted.length === 1 ? SINGLE_LISTING_ZOOM : DEFAULT_MAP_ZOOM)

  useEffect(() => {
    setSelectedId(null)
  }, [listings, viewport?.id])

  const hiddenPinCount = campusLocked ? listings.length - plotted.length : 0

  return (
    <div className={`space-y-2 ${className}`}>
      <div className="relative overflow-hidden rounded-xl border border-border" style={{ height }}>
      {emptyHint && plotted.length === 0 && !campusLocked && (
        <div className="absolute inset-x-0 top-0 z-10 border-b border-border bg-surface/95 px-4 py-2 text-center text-sm text-muted">
          {emptyHint}
        </div>
      )}
      {campusLocked && (
        <div className="absolute inset-x-0 top-0 z-10 space-y-0.5 border-b border-border bg-primary/90 px-4 py-2 text-center text-sm font-medium text-white">
          <p>{t('listings.mapCampusFocus', { campus: viewport.label || t('listings.mapCampusDefault') })}</p>
          <p className="text-xs font-normal text-white/80">{t('listings.mapCampusPinNote')}</p>
          {hiddenPinCount > 0 && (
            <p className="text-xs font-normal text-white/80">
              {t('listings.mapHiddenPins', { count: hiddenPinCount })}
            </p>
          )}
        </div>
      )}
      <Map
        mapId={GOOGLE_MAPS_MAP_ID}
        defaultCenter={initialCenter}
        defaultZoom={initialZoom}
        gestureHandling="cooperative"
        style={{ width: '100%', height: '100%' }}
        onClick={() => setSelectedId(null)}
      >
        {campusLocked ? (
          <CampusViewportLock viewport={viewport} />
        ) : (
          <ListingsBoundsFit plotted={plotted} disabled={false} />
        )}
        {campusMarkerPosition && (
          <CampusMarker
            position={campusMarkerPosition}
            label={viewport.label || 'Campus'}
          />
        )}
        {plotted.map(({ listing, position }) => (
          <ListingPin
            key={listing.id}
            listing={listing}
            position={position}
            interactive={interactive}
            selected={selectedId === listing.id}
            onSelect={setSelectedId}
            onClear={() => setSelectedId(null)}
            t={t}
          />
        ))}
      </Map>
      </div>
      <p className="text-xs leading-relaxed text-muted">{t('listings.mapAreaDisclaimer')}</p>
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

  const campusCenter = viewport?.center ?? null
  const hasAnyPosition = listings.some((listing) =>
    campusCenter
      ? getMapListingPosition(listing, { campusId: viewport?.id, campusCenter })
      : getListingPosition(listing)
  )

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
  const { t } = useTranslation()
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
      <div className="space-y-2">
        <MapUnavailable
          height={height}
          message={t('listings.mapSingleUnavailable')}
        />
        <p className="text-xs leading-relaxed text-muted">{t('listings.mapAreaDisclaimer')}</p>
      </div>
    )
  }

  return (
    <div className="space-y-2">
      {approximate && (
        <p className="text-xs text-muted">{t('listings.mapSingleApprox')}</p>
      )}
      <div className="overflow-hidden rounded-xl border border-border" style={{ height }}>
        <Map
          mapId={GOOGLE_MAPS_MAP_ID}
          defaultCenter={coords}
          defaultZoom={SINGLE_LISTING_ZOOM}
          gestureHandling="cooperative"
          style={{ width: '100%', height: '100%' }}
        >
          <AdvancedMarker position={coords} title={title || listing?.title || 'Listing location'} />
        </Map>
      </div>
      <p className="text-xs leading-relaxed text-muted">{t('listings.mapAreaDisclaimer')}</p>
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
          mapId={GOOGLE_MAPS_MAP_ID}
          defaultCenter={center}
          defaultZoom={position ? SINGLE_LISTING_ZOOM : DEFAULT_MAP_ZOOM}
          gestureHandling="greedy"
          onClick={handleClick}
          style={{ width: '100%', height: '100%' }}
        >
          {position && <AdvancedMarker position={position} />}
        </Map>
      </div>
      <p className="text-xs text-muted">Click the map to drop a pin for your listing location.</p>
    </div>
  )
}
