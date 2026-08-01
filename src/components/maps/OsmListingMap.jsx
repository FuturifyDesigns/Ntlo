import { useEffect, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { MapContainer, TileLayer, Marker, Popup, CircleMarker, useMap } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import {
  CAMPUS_MAP_ZOOM,
  DEFAULT_MAP_CENTER,
  DEFAULT_MAP_ZOOM,
  SINGLE_LISTING_ZOOM,
  getListingPosition,
  getMapListingPosition,
} from '../../lib/googleMaps'
import { formatPrice } from '../../lib/utils'
import { useTranslation } from '../../hooks/useTranslation'

/** Vite-safe pin (avoids broken Leaflet default icon URLs). */
const listingIcon = L.divIcon({
  className: 'ntlo-leaflet-pin',
  html: '<span class="ntlo-leaflet-pin__dot"></span>',
  iconSize: [22, 22],
  iconAnchor: [11, 11],
  popupAnchor: [0, -12],
})

const campusIcon = L.divIcon({
  className: 'ntlo-leaflet-pin ntlo-leaflet-pin--campus',
  html: '<span class="ntlo-leaflet-pin__dot ntlo-leaflet-pin__dot--campus"></span>',
  iconSize: [18, 18],
  iconAnchor: [9, 9],
})

function InvalidateAndFit({ plotted, viewport }) {
  const map = useMap()

  useEffect(() => {
    // Map view often mounts after Grid → need size refresh or tiles stay blank.
    const t = window.setTimeout(() => map.invalidateSize(), 50)
    return () => window.clearTimeout(t)
  }, [map])

  useEffect(() => {
    map.invalidateSize()

    if (viewport?.center) {
      map.setView([viewport.center.lat, viewport.center.lng], viewport.zoom ?? CAMPUS_MAP_ZOOM)
      return
    }

    if (!plotted.length) {
      map.setView([DEFAULT_MAP_CENTER.lat, DEFAULT_MAP_CENTER.lng], DEFAULT_MAP_ZOOM)
      return
    }

    if (plotted.length === 1) {
      map.setView(
        [plotted[0].position.lat, plotted[0].position.lng],
        SINGLE_LISTING_ZOOM
      )
      return
    }

    const bounds = L.latLngBounds(
      plotted.map(({ position }) => [position.lat, position.lng])
    )
    map.fitBounds(bounds, { padding: [48, 48], maxZoom: 15 })
  }, [map, plotted, viewport?.id, viewport?.center?.lat, viewport?.center?.lng, viewport?.zoom])

  return null
}

function PinPopup({ listing, approximate, t }) {
  return (
    <div className="max-w-[220px] space-y-1.5 p-0.5 font-sans">
      <p className="font-semibold text-primary">{listing.title}</p>
      <p className="text-sm font-mono font-semibold text-accent">
        {formatPrice(listing.price)}{t('listings.perMo')}
      </p>
      <p className="text-xs text-muted">
        {[listing.area, listing.city].filter(Boolean).join(', ')}
      </p>
      {approximate && (
        <p className="text-xs text-muted">{t('listings.mapApproxPin')}</p>
      )}
      <Link
        to={`/listings/${listing.id}`}
        className="inline-block text-sm font-semibold text-accent hover:underline"
      >
        {t('listings.viewListing')} →
      </Link>
    </div>
  )
}

/**
 * Browse / multi-listing map using OpenStreetMap tiles.
 * Google Maps was rendering a solid blue canvas on ntlo.online (tiles/CSP/Map ID);
 * OSM is already allowlisted and does not need a Map ID.
 */
export default function OsmListingMap({
  listings = [],
  viewport = null,
  height = '400px',
  className = '',
  emptyHint = 'No listing locations yet — showing default map area.',
  interactive = false,
}) {
  const { t } = useTranslation()

  const campusCenter = viewport?.center ?? null
  const campusLocked = Boolean(campusCenter)

  const plotted = useMemo(
    () =>
      listings
        .map((listing) => {
          const position = getMapListingPosition(listing, {
            campusId: campusLocked ? viewport?.id : undefined,
            campusCenter: campusLocked ? campusCenter : undefined,
          })
          if (!position) return null
          return { listing, position }
        })
        .filter(Boolean),
    [listings, campusLocked, campusCenter, viewport?.id]
  )

  const initialCenter = campusCenter
    || (plotted[0]
      ? { lat: plotted[0].position.lat, lng: plotted[0].position.lng }
      : DEFAULT_MAP_CENTER)
  const initialZoom = viewport?.zoom
    ?? (plotted.length === 1 ? SINGLE_LISTING_ZOOM : DEFAULT_MAP_ZOOM)

  const hiddenPinCount = campusLocked ? listings.length - plotted.length : 0
  const showEmpty = plotted.length === 0 && !campusLocked

  return (
    <div className={`space-y-2 ${className}`}>
      <div className="relative overflow-hidden rounded-xl border border-border" style={{ height }}>
        {showEmpty && emptyHint && (
          <div className="absolute inset-x-0 top-0 z-[1000] border-b border-border bg-surface/95 px-4 py-2 text-center text-sm text-muted">
            {emptyHint}
          </div>
        )}
        {campusLocked && (
          <div className="absolute inset-x-0 top-0 z-[1000] space-y-0.5 border-b border-border bg-primary/90 px-4 py-2 text-center text-sm font-medium text-white">
            <p>{t('listings.mapCampusFocus', { campus: viewport.label || t('listings.mapCampusDefault') })}</p>
            <p className="text-xs font-normal text-white/80">{t('listings.mapCampusPinNote')}</p>
            {hiddenPinCount > 0 && (
              <p className="text-xs font-normal text-white/80">
                {t('listings.mapHiddenPins', { count: hiddenPinCount })}
              </p>
            )}
          </div>
        )}
        <MapContainer
          center={[initialCenter.lat, initialCenter.lng]}
          zoom={initialZoom}
          className="h-full w-full"
          scrollWheelZoom={false}
          style={{ height: '100%', width: '100%' }}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <InvalidateAndFit plotted={plotted} viewport={viewport} />
          {campusCenter && (
            <Marker
              position={[campusCenter.lat, campusCenter.lng]}
              icon={campusIcon}
              title={viewport.label || 'Campus'}
              zIndexOffset={2000}
            />
          )}
          {plotted.map(({ listing, position }) => (
            <Marker
              key={listing.id}
              position={[position.lat, position.lng]}
              icon={listingIcon}
            >
              {interactive ? (
                <Popup>
                  <PinPopup listing={listing} approximate={position.approximate} t={t} />
                </Popup>
              ) : null}
            </Marker>
          ))}
        </MapContainer>
      </div>
      <p className="text-xs leading-relaxed text-muted">{t('listings.mapAreaDisclaimer')}</p>
    </div>
  )
}

export function OsmSingleListingMap({ listing, lat, lng, title, height = '280px' }) {
  const { t } = useTranslation()
  const coords = useMemo(() => {
    const exactLat = lat ?? listing?.lat
    const exactLng = lng ?? listing?.lng
    const fromExact = Number.isFinite(Number(exactLat)) && Number.isFinite(Number(exactLng))
      ? { lat: Number(exactLat), lng: Number(exactLng), approximate: false }
      : null
    return fromExact || getListingPosition(listing)
  }, [listing, lat, lng])

  if (!coords) {
    return (
      <div className="space-y-2">
        <div
          className="flex items-center justify-center rounded-xl border border-border bg-background px-4 text-center text-sm text-muted"
          style={{ height }}
        >
          {t('listings.mapSingleUnavailable')}
        </div>
        <p className="text-xs leading-relaxed text-muted">{t('listings.mapAreaDisclaimer')}</p>
      </div>
    )
  }

  return (
    <div className="space-y-2">
      {coords.approximate && (
        <p className="text-xs text-muted">{t('listings.mapSingleApprox')}</p>
      )}
      <div className="overflow-hidden rounded-xl border border-border" style={{ height }}>
        <MapContainer
          center={[coords.lat, coords.lng]}
          zoom={SINGLE_LISTING_ZOOM}
          className="h-full w-full"
          scrollWheelZoom={false}
          style={{ height: '100%', width: '100%' }}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <InvalidateAndFit
            plotted={[{ position: coords }]}
            viewport={null}
          />
          <CircleMarker
            center={[coords.lat, coords.lng]}
            radius={9}
            pathOptions={{ color: '#fff', weight: 2, fillColor: '#c45c26', fillOpacity: 1 }}
          >
            <Popup>
              <p className="font-semibold text-primary">{title || listing?.title || 'Listing'}</p>
            </Popup>
          </CircleMarker>
        </MapContainer>
      </div>
      <p className="text-xs leading-relaxed text-muted">{t('listings.mapAreaDisclaimer')}</p>
    </div>
  )
}
