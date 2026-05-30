import { useEffect, useMemo, useState, useCallback, useRef } from 'react'
import { Link } from 'react-router-dom'
import {
  AdvancedMarker,
  InfoWindow,
  Map,
  useAdvancedMarkerRef,
  useMap,
  useMapsLibrary,
} from '@vis.gl/react-google-maps'
import { MapPin, Navigation, Loader2, AlertCircle } from 'lucide-react'
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
import { geocodeWithGoogle, resolveAddressCoords } from '../../lib/geocodeAddress'
import { formatPrice } from '../../lib/utils'
import { useTranslation } from '../../hooks/useTranslation'
import Button from '../ui/Button'
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

export function LocationPicker({
  lat,
  lng,
  onChange,
  address = '',
  area = '',
  city = '',
  universityCity = '',
  height = '320px',
  hint,
}) {
  const { t } = useTranslation()
  const geocodingLib = useMapsLibrary('geocoding')
  const geocoder = useMemo(
    () => (geocodingLib ? new geocodingLib.Geocoder() : null),
    [geocodingLib]
  )

  const position = toLatLng(lat, lng)
  const [mapCenter, setMapCenter] = useState(() => position || DEFAULT_MAP_CENTER)
  const [mapZoom, setMapZoom] = useState(() => (position ? SINGLE_LISTING_ZOOM : DEFAULT_MAP_ZOOM))
  const [geoBusy, setGeoBusy] = useState(false)
  const [geocodeBusy, setGeocodeBusy] = useState(false)
  const [geoError, setGeoError] = useState('')
  const [geocodeHint, setGeocodeHint] = useState('')
  const skipGeocodeRef = useRef(false)
  const geocodeTimerRef = useRef(null)
  const onChangeRef = useRef(onChange)
  onChangeRef.current = onChange

  useEffect(() => {
    if (position) {
      setMapCenter(position)
      setMapZoom(SINGLE_LISTING_ZOOM)
    }
  }, [position?.lat, position?.lng])

  const handleMapClick = useCallback((event) => {
    if (!event.detail.latLng) return
    skipGeocodeRef.current = true
    onChange({
      lat: event.detail.latLng.lat,
      lng: event.detail.latLng.lng,
    })
    setGeocodeHint('')
  }, [onChange])

  const handleDragEnd = useCallback((event) => {
    const ll = event.detail?.latLng || event.latLng
    if (!ll) return
    skipGeocodeRef.current = true
    const coords = typeof ll.lat === 'function'
      ? { lat: ll.lat(), lng: ll.lng() }
      : { lat: ll.lat, lng: ll.lng }
    onChange(coords)
    setGeocodeHint('')
  }, [onChange])

  const useCurrentLocation = useCallback(async () => {
    if (!navigator.geolocation) {
      setGeoError(t('listingForm.geoUnsupported'))
      return
    }
    setGeoBusy(true)
    setGeoError('')
    try {
      if (navigator.permissions) {
        const perm = await navigator.permissions.query({ name: 'geolocation' })
        if (perm.state === 'denied') {
          setGeoError(t('listingForm.geoPolicyBlocked'))
          setGeoBusy(false)
          return
        }
      }
    } catch {
      /* Permissions API unavailable — try geolocation anyway */
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        skipGeocodeRef.current = true
        onChange({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
        })
        setGeocodeHint(t('listingForm.pinFromGps'))
        setGeoBusy(false)
      },
      (err) => {
        setGeoError(
          err.code === 1
            ? t('listingForm.geoDenied')
            : err.message?.includes('permissions policy')
              ? t('listingForm.geoPolicyBlocked')
              : t('listingForm.geoFailed')
        )
        setGeoBusy(false)
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 60000 }
    )
  }, [onChange, t])

  useEffect(() => {
    if (skipGeocodeRef.current) {
      skipGeocodeRef.current = false
      return undefined
    }

    const hasText = Boolean(
      (address?.trim() || area?.trim()) && city?.trim()
    )
    const cityOnly = Boolean(city?.trim() && !address?.trim() && !area?.trim())

    if (!hasText && !cityOnly) return undefined

    if (geocodeTimerRef.current) clearTimeout(geocodeTimerRef.current)
    geocodeTimerRef.current = setTimeout(async () => {
      setGeocodeBusy(true)
      setGeocodeHint(t('listingForm.geocodeSearching'))

      const result = await resolveAddressCoords({
        geocoder,
        address,
        area,
        city,
        universityCity,
      })

      setGeocodeBusy(false)

      if (result) {
        onChangeRef.current({ lat: result.lat, lng: result.lng })
        setMapCenter({ lat: result.lat, lng: result.lng })
        setMapZoom(SINGLE_LISTING_ZOOM)
        setGeocodeHint(t('listingForm.pinFromAddress'))
        setGeoError('')
      } else if (hasText && (address?.trim().length >= 3 || area?.trim().length >= 2)) {
        setGeocodeHint(t('listingForm.geocodeMiss'))
      } else if (cityOnly && geocoder) {
        const cityResult = await geocodeWithGoogle(geocoder, `${city.trim()}, Botswana`)
        if (cityResult) {
          setMapCenter({ lat: cityResult.lat, lng: cityResult.lng })
          setMapZoom(DEFAULT_MAP_ZOOM)
          setGeocodeHint('')
        }
      } else {
        setGeocodeHint('')
      }
    }, 600)

    return () => {
      if (geocodeTimerRef.current) clearTimeout(geocodeTimerRef.current)
    }
  }, [address, area, city, universityCity, geocoder, t])

  if (!MAPS_ENABLED) {
    return (
      <MapUnavailable
        height={height}
        message="Add VITE_GOOGLE_MAPS_API_KEY to pick a location on the map."
      />
    )
  }

  return (
    <div className="space-y-3">
      {hint && <p className="text-sm text-muted">{hint}</p>}

      <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={useCurrentLocation}
          disabled={geoBusy}
          className="w-full sm:w-auto"
        >
          {geoBusy ? <Loader2 size={16} className="animate-spin" /> : <Navigation size={16} />}
          {t('listingForm.useMyLocation')}
        </Button>
        {geocodeBusy && (
          <span className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-background px-3 py-2 text-xs font-medium text-muted">
            <Loader2 size={14} className="animate-spin" />
            {t('listingForm.geocodeSearching')}
          </span>
        )}
        {position && !geocodeBusy && (
          <span className="inline-flex items-center gap-1.5 rounded-lg border border-success/30 bg-success/5 px-3 py-2 text-xs font-medium text-success">
            <MapPin size={14} />
            {t('listingForm.pinSet')}
          </span>
        )}
      </div>

      {geoError && (
        <p className="flex items-start gap-2 text-sm text-error">
          <AlertCircle size={16} className="mt-0.5 shrink-0" />
          {geoError}
        </p>
      )}
      {geocodeHint && !geoError && (
        <p className="text-xs text-muted">{geocodeHint}</p>
      )}

      <div className="overflow-hidden rounded-xl border border-border" style={{ height }}>
        <Map
          mapId={GOOGLE_MAPS_MAP_ID}
          center={mapCenter}
          zoom={mapZoom}
          gestureHandling="greedy"
          onClick={handleMapClick}
          style={{ width: '100%', height: '100%' }}
        >
          <LocationPickerViewport center={mapCenter} zoom={mapZoom} />
          {position && (
            <AdvancedMarker
              position={position}
              draggable
              onDragEnd={handleDragEnd}
            />
          )}
        </Map>
      </div>

      <p className="text-xs leading-relaxed text-muted">{t('listingForm.mapHelp')}</p>
    </div>
  )
}

function LocationPickerViewport({ center, zoom }) {
  const map = useMap()

  useEffect(() => {
    if (!map || !center) return
    map.panTo(center)
    if (zoom) map.setZoom(zoom)
  }, [map, center?.lat, center?.lng, zoom])

  return null
}
