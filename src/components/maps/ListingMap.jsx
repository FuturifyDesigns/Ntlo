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
import { geocodeWithGoogle, resolveAddressCoords, resolveUniversityCampusCoords, reverseGeocodeWithGoogle } from '../../lib/geocodeAddress'
import { applyMapCameraFocus } from '../../lib/mapCamera'
import { calculateDistance, formatPrice } from '../../lib/utils'
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

/** One-shot camera move — skipped after the user pans/zooms the map themselves. */
function MapCameraController({ command, disabledRef, programmaticRef }) {
  const map = useMap()

  useEffect(() => {
    if (!map || !command || disabledRef?.current) return

    programmaticRef.current = true
    applyMapCameraFocus(map, {
      campus: command.campus,
      pin: command.pin,
      campusZoom: command.campusZoom,
      pinZoom: command.pinZoom,
    })

    const idle = map.addListener('idle', () => {
      programmaticRef.current = false
      google.maps.event.removeListener(idle)
    })
  }, [map, command?.id, disabledRef, programmaticRef])

  return null
}

/** After the user pans or zooms, stop programmatic camera moves until address/uni changes. */
function MapUserInteractionGuard({ disabledRef, programmaticRef }) {
  const map = useMap()

  useEffect(() => {
    if (!map) return undefined

    const markUser = () => {
      if (!programmaticRef.current) {
        disabledRef.current = true
      }
    }

    const drag = map.addListener('dragstart', markUser)
    const zoom = map.addListener('zoom_changed', markUser)

    return () => {
      google.maps.event.removeListener(drag)
      google.maps.event.removeListener(zoom)
    }
  }, [map, disabledRef, programmaticRef])

  return null
}

function CampusReferenceMarker({ position, label }) {
  return (
    <AdvancedMarker position={position} title={label} zIndex={100} anchorPoint={['50%', '10px']}>
      <div className="flex flex-col items-center gap-0.5">
        <div
          className="h-5 w-5 rounded-full border-2 border-white shadow-md"
          style={{ backgroundColor: '#c45c26' }}
        />
        <span className="max-w-[120px] truncate rounded bg-primary/90 px-1.5 py-0.5 text-[9px] font-semibold text-white">
          {label}
        </span>
      </div>
    </AdvancedMarker>
  )
}

function ListingPinMarker() {
  return (
    <div className="flex flex-col items-center">
      <div
        className="h-6 w-6 rounded-full border-[3px] border-white shadow-lg"
        style={{ backgroundColor: '#dc2626' }}
      />
      <div
        className="mt-[-2px] h-0 w-0 border-x-[6px] border-t-[8px] border-x-transparent border-t-[#dc2626]"
        aria-hidden
      />
    </div>
  )
}

/** Dashed geodesic line between campus and listing pin — updates as coords change. */
function CampusDistanceLine({ campus, pin }) {
  const map = useMap()
  const polylineRef = useRef(null)

  useEffect(() => {
    if (!map) return undefined

    const line = new google.maps.Polyline({
      strokeColor: '#c45c26',
      strokeOpacity: 0,
      strokeWeight: 3,
      geodesic: true,
      zIndex: 50,
      icons: [
        {
          icon: {
            path: 'M 0,-1 0,1',
            strokeOpacity: 0.9,
            strokeWeight: 3,
            scale: 3,
          },
          offset: '0',
          repeat: '14px',
        },
      ],
    })
    polylineRef.current = line

    return () => {
      line.setMap(null)
      polylineRef.current = null
    }
  }, [map])

  useEffect(() => {
    const line = polylineRef.current
    if (!line || !map) return

    if (!campus?.lat || !pin?.lat) {
      line.setMap(null)
      return
    }

    line.setPath([
      { lat: campus.lat, lng: campus.lng },
      { lat: pin.lat, lng: pin.lng },
    ])
    line.setMap(map)
  }, [map, campus?.lat, campus?.lng, pin?.lat, pin?.lng])

  return null
}

function CampusDistanceLabel({ campus, pin, distanceKm, label }) {
  if (!campus?.lat || !pin?.lat || distanceKm == null) return null

  const midpoint = {
    lat: (campus.lat + pin.lat) / 2,
    lng: (campus.lng + pin.lng) / 2,
  }

  return (
    <AdvancedMarker position={midpoint} zIndex={150} anchorPoint={['50%', '50%']}>
      <div className="whitespace-nowrap rounded-full border-2 border-white bg-primary px-2.5 py-1 text-[10px] font-bold text-white shadow-md">
        {label}
      </div>
    </AdvancedMarker>
  )
}

export function LocationPicker({
  lat,
  lng,
  onChange,
  address = '',
  area = '',
  city = '',
  universityId = '',
  universityReady = false,
  campusCoords = null,
  campusLabel = '',
  campusZoom = CAMPUS_MAP_ZOOM,
  customUniversityName = '',
  customUniversityCity = '',
  universityCity = '',
  height = '320px',
  hint,
  universityHint,
}) {
  const { t } = useTranslation()
  const geocodingLib = useMapsLibrary('geocoding')
  const geocoder = useMemo(
    () => (geocodingLib ? new geocodingLib.Geocoder() : null),
    [geocodingLib]
  )

  const position = toLatLng(lat, lng)
  const [geoBusy, setGeoBusy] = useState(false)
  const [geocodeBusy, setGeocodeBusy] = useState(false)
  const [geoError, setGeoError] = useState('')
  const [geocodeHint, setGeocodeHint] = useState('')
  const [geocodeFailed, setGeocodeFailed] = useState(false)
  const [geocodeRetryNonce, setGeocodeRetryNonce] = useState(0)
  const [pinLocked, setPinLocked] = useState(false)
  const [dragPosition, setDragPosition] = useState(null)
  const [cameraCommand, setCameraCommand] = useState(null)
  const [otherCampus, setOtherCampus] = useState(null)

  const pinPosition = dragPosition || position

  const geocodeTimerRef = useRef(null)
  const reverseTimerRef = useRef(null)
  const onChangeRef = useRef(onChange)
  const lastGeocodedKeyRef = useRef('')
  const skipForwardGeocodeRef = useRef(false)
  const lastCampusFocusKeyRef = useRef('')
  const cameraIdRef = useRef(0)
  const userMapControlRef = useRef(false)
  const programmaticCameraRef = useRef(false)
  const campusCoordsRef = useRef(campusCoords)
  const latRef = useRef(lat)
  const lngRef = useRef(lng)
  const prevAddressKeyRef = useRef(addressKey)
  campusCoordsRef.current = campusCoords
  latRef.current = lat
  lngRef.current = lng
  onChangeRef.current = onChange

  const addressKey = `${address?.trim()}|${area?.trim()}|${city?.trim()}`

  const hasArea = Boolean(area?.trim().length >= 2)
  const hasAddress = Boolean(address?.trim().length >= 3)
  const hasCity = Boolean(city?.trim())
  const hasLocationFields = hasCity && (hasArea || hasAddress)

  const activeCampus = universityReady && (universityId === 'other' ? otherCampus : campusCoords)
  const activeCampusLabel = universityId === 'other'
    ? customUniversityName
    : campusLabel

  const showCampus = Boolean(universityReady && activeCampus?.lat && activeCampusLabel)
  const showPin = Boolean(
    universityReady
    && pinPosition
    && (hasLocationFields || pinLocked || dragPosition)
  )

  const distanceKm = useMemo(() => {
    if (!showPin || !showCampus) return null
    return calculateDistance(pinPosition.lat, pinPosition.lng, activeCampus.lat, activeCampus.lng)
  }, [showPin, showCampus, pinPosition, activeCampus?.lat, activeCampus?.lng])

  const allowCamera = useCallback(() => {
    userMapControlRef.current = false
  }, [])

  const pushCamera = useCallback((payload) => {
    if (userMapControlRef.current) return
    cameraIdRef.current += 1
    setCameraCommand({
      id: cameraIdRef.current,
      campusZoom: campusZoom ?? CAMPUS_MAP_ZOOM,
      pinZoom: SINGLE_LISTING_ZOOM,
      ...payload,
    })
  }, [campusZoom])

  const retryGeocode = useCallback(() => {
    lastGeocodedKeyRef.current = ''
    setGeocodeFailed(false)
    setGeocodeHint('')
    allowCamera()
    setGeocodeRetryNonce((n) => n + 1)
  }, [allowCamera])

  // Reset geocode state when campus selection changes
  useEffect(() => {
    lastGeocodedKeyRef.current = ''
    lastCampusFocusKeyRef.current = ''
    setGeocodeFailed(false)
    setGeocodeHint('')
    allowCamera()
  }, [universityId, customUniversityName, customUniversityCity, allowCamera])

  // Hide pin when address fields are cleared; hide campus when university is removed
  useEffect(() => {
    const prevAddressKey = prevAddressKeyRef.current
    prevAddressKeyRef.current = addressKey

    if (!universityReady) {
      setDragPosition(null)
      setPinLocked(false)
      setGeocodeHint('')
      setGeocodeFailed(false)
      lastGeocodedKeyRef.current = ''
      if (geocodeTimerRef.current) clearTimeout(geocodeTimerRef.current)
      if (position) {
        onChangeRef.current({ lat: '', lng: '' })
      }
      return
    }

    if (prevAddressKey !== addressKey && !hasLocationFields) {
      setPinLocked(false)
      setDragPosition(null)
    }

    if (hasLocationFields) return
    if (pinLocked || dragPosition) return

    setGeocodeHint('')
    setGeocodeFailed(false)
    lastGeocodedKeyRef.current = ''
    if (geocodeTimerRef.current) clearTimeout(geocodeTimerRef.current)
    if (position) {
      onChangeRef.current({ lat: '', lng: '' })
      allowCamera()
      const campus = universityId === 'other' ? otherCampus : campusCoordsRef.current
      if (campus?.lat) pushCamera({ campus })
    }
  }, [
    addressKey,
    universityReady,
    hasLocationFields,
    pinLocked,
    dragPosition,
    position,
    universityId,
    otherCampus,
    allowCamera,
    pushCamera,
  ])

  // Pan map to campus once university is ready
  useEffect(() => {
    if (!universityReady) return

    const campus = universityId === 'other' ? otherCampus : campusCoords
    if (!campus?.lat) return

    const focusKey = `${universityId}|${campus.lat}|${campus.lng}`
    if (lastCampusFocusKeyRef.current === focusKey) return
    lastCampusFocusKeyRef.current = focusKey

    allowCamera()
    pushCamera({ campus })
  }, [
    universityReady,
    universityId,
    campusCoords?.lat,
    campusCoords?.lng,
    otherCampus?.lat,
    otherCampus?.lng,
    allowCamera,
    pushCamera,
  ])

  const applyCoordsFromReverse = useCallback(async (coords, hintKey) => {
    allowCamera()
    setPinLocked(true)
    setGeocodeFailed(false)
    setGeocodeHint(t(hintKey))
    onChangeRef.current({ lat: coords.lat, lng: coords.lng, source: 'map' })
    const campus = universityId === 'other' ? otherCampus : campusCoordsRef.current
    pushCamera(campus ? { campus, pin: coords } : { pin: coords })

    if (!geocoder) return

    setGeocodeBusy(true)
    const parsed = await reverseGeocodeWithGoogle(geocoder, coords.lat, coords.lng)
    setGeocodeBusy(false)

    if (parsed) {
      const key = `${parsed.address?.trim()}|${parsed.area?.trim()}|${parsed.city?.trim()}`
      skipForwardGeocodeRef.current = true
      lastGeocodedKeyRef.current = key
      setGeocodeFailed(false)
      onChangeRef.current({
        lat: coords.lat,
        lng: coords.lng,
        address: parsed.address || '',
        area: parsed.area || '',
        city: parsed.city || city?.trim() || 'Gaborone',
        source: 'reverse',
      })
      if (parsed.formatted) {
        setGeocodeHint(t('listingForm.pinFromReverse', { address: parsed.formatted }))
      }
    }
  }, [allowCamera, pushCamera, geocoder, city, t, universityId, otherCampus])

  const handleMapClick = useCallback((event) => {
    if (!universityReady || !event.detail.latLng) return
    const coords = {
      lat: event.detail.latLng.lat,
      lng: event.detail.latLng.lng,
    }
    lastGeocodedKeyRef.current = ''
    setGeocodeFailed(false)
    if (reverseTimerRef.current) clearTimeout(reverseTimerRef.current)
    reverseTimerRef.current = setTimeout(() => {
      applyCoordsFromReverse(coords, 'listingForm.pinManual')
    }, 200)
  }, [applyCoordsFromReverse, universityReady])

  const readLatLng = useCallback((ll) => {
    if (!ll) return null
    return typeof ll.lat === 'function'
      ? { lat: ll.lat(), lng: ll.lng() }
      : { lat: ll.lat, lng: ll.lng }
  }, [])

  const handleDrag = useCallback((event) => {
    if (!universityReady) return
    const coords = readLatLng(event.detail?.latLng || event.latLng)
    if (coords) setDragPosition(coords)
  }, [readLatLng, universityReady])

  const handleDragEnd = useCallback((event) => {
    if (!universityReady) return
    const coords = readLatLng(event.detail?.latLng || event.latLng)
    if (!coords) return
    setDragPosition(null)
    lastGeocodedKeyRef.current = ''
    setGeocodeFailed(false)
    if (reverseTimerRef.current) clearTimeout(reverseTimerRef.current)
    reverseTimerRef.current = setTimeout(() => {
      applyCoordsFromReverse(coords, 'listingForm.pinManual')
    }, 200)
  }, [applyCoordsFromReverse, readLatLng, universityReady])

  const useCurrentLocation = useCallback(async () => {
    if (!universityReady) return
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
      /* ignore */
    }
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        allowCamera()
        setGeoBusy(false)
        const coords = { lat: pos.coords.latitude, lng: pos.coords.longitude }
        lastGeocodedKeyRef.current = ''
        setGeocodeFailed(false)
        await applyCoordsFromReverse(coords, 'listingForm.pinFromGps')
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
  }, [applyCoordsFromReverse, allowCamera, t, universityReady])

  // Forward geocode: address fields → red pin (debounced, retries when geocoder loads)
  useEffect(() => {
    if (!universityReady) return undefined

    const canGeocode = hasLocationFields
    if (!canGeocode) return undefined

    const hasPin = Boolean(toLatLng(latRef.current, lngRef.current))
    if (addressKey === lastGeocodedKeyRef.current && hasPin) return undefined

    if (skipForwardGeocodeRef.current) {
      skipForwardGeocodeRef.current = false
      if (addressKey === lastGeocodedKeyRef.current) return undefined
    }

    allowCamera()
    setGeocodeFailed(false)

    if (geocodeTimerRef.current) clearTimeout(geocodeTimerRef.current)
    geocodeTimerRef.current = setTimeout(async () => {
      if (addressKey === lastGeocodedKeyRef.current && toLatLng(latRef.current, lngRef.current)) return

      const stillHasFields = Boolean(city?.trim())
        && (Boolean(area?.trim().length >= 2) || Boolean(address?.trim().length >= 3))
      if (!stillHasFields) return

      setGeocodeBusy(true)
      setGeocodeFailed(false)
      setGeocodeHint(t('listingForm.geocodeSearching'))

      const result = await resolveAddressCoords({
        geocoder,
        address,
        area,
        city,
        universityCity: universityCity || customUniversityCity || city,
      })

      setGeocodeBusy(false)

      if (result) {
        lastGeocodedKeyRef.current = addressKey
        setPinLocked(false)
        setGeocodeFailed(false)
        onChangeRef.current({ lat: result.lat, lng: result.lng, source: 'geocode' })
        const coords = { lat: result.lat, lng: result.lng }
        const campus = universityId === 'other' ? otherCampus : campusCoordsRef.current
        allowCamera()
        pushCamera(campus ? { campus, pin: coords } : { pin: coords })
        setGeocodeHint(t('listingForm.pinFromAddress'))
        setGeoError('')
      } else {
        setGeocodeFailed(true)
        setGeocodeHint('')
      }
    }, 450)

    return () => {
      if (geocodeTimerRef.current) clearTimeout(geocodeTimerRef.current)
    }
  }, [
    addressKey,
    geocoder,
    universityReady,
    universityId,
    hasLocationFields,
    geocodeRetryNonce,
    allowCamera,
    pushCamera,
    t,
    address,
    area,
    city,
    universityCity,
    customUniversityCity,
    otherCampus,
  ])

  // Geocode "other" university for campus reference marker
  useEffect(() => {
    if (!universityReady || universityId !== 'other' || !customUniversityName?.trim()) {
      setOtherCampus(null)
      return undefined
    }

    const timer = setTimeout(async () => {
      const uniCity = customUniversityCity?.trim() || city?.trim() || 'Botswana'
      const result = await resolveUniversityCampusCoords({
        geocoder,
        name: customUniversityName.trim(),
        city: uniCity,
      })
      if (result) {
        setOtherCampus({ lat: result.lat, lng: result.lng })
      }
    }, 700)

    return () => clearTimeout(timer)
  }, [
    universityReady,
    universityId,
    customUniversityName,
    customUniversityCity,
    city,
    geocoder,
  ])

  if (!MAPS_ENABLED) {
    return (
      <MapUnavailable
        height={height}
        message="Add VITE_GOOGLE_MAPS_API_KEY to pick a location on the map."
      />
    )
  }

  const mapCenter = activeCampus || position || DEFAULT_MAP_CENTER
  const mapZoom = activeCampus ? (campusZoom ?? CAMPUS_MAP_ZOOM) : (position ? SINGLE_LISTING_ZOOM : DEFAULT_MAP_ZOOM)

  return (
    <div className="space-y-3">
      {!universityReady && (
        <p className="rounded-lg border border-amber-500/30 bg-amber-500/5 px-3 py-2 text-sm text-amber-800">
          {t('listingForm.selectUniversityFirst')}
        </p>
      )}
      {universityReady && hint && <p className="text-sm text-muted">{hint}</p>}
      {universityReady && universityHint && (
        <p className="rounded-lg border border-border bg-background px-3 py-2 text-xs text-muted">
          {universityHint}
        </p>
      )}

      <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={useCurrentLocation}
          disabled={geoBusy || !universityReady}
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
        {showPin && (
          <span className="inline-flex items-center gap-1.5 rounded-lg border border-success/30 bg-success/5 px-3 py-2 text-xs font-medium text-success">
            <MapPin size={14} />
            {pinLocked ? t('listingForm.pinManualShort') : t('listingForm.pinSet')}
          </span>
        )}
        {distanceKm != null && (
          <span className="inline-flex items-center gap-1.5 rounded-lg border border-accent/30 bg-accent/5 px-3 py-2 text-xs font-medium text-primary">
            {t('listingForm.distanceFromCampus', { km: distanceKm.toFixed(1) })}
          </span>
        )}
      </div>

      {geoError && (
        <p className="flex items-start gap-2 text-sm text-error">
          <AlertCircle size={16} className="mt-0.5 shrink-0" />
          {geoError}
        </p>
      )}
      {geocodeFailed && universityReady && (
        <div className="rounded-lg border border-amber-500/30 bg-amber-500/5 px-3 py-3 text-sm">
          <p className="font-medium text-amber-800">{t('listingForm.geocodeMissTitle')}</p>
          <p className="mt-1 text-xs text-amber-800/90">{t('listingForm.geocodeMissActions')}</p>
          <div className="mt-3 flex flex-wrap gap-2">
            <Button type="button" size="sm" variant="outline" onClick={retryGeocode}>
              {t('listingForm.geocodeRetry')}
            </Button>
            <Button type="button" size="sm" variant="outline" onClick={useCurrentLocation} disabled={geoBusy}>
              {t('listingForm.useMyLocation')}
            </Button>
          </div>
        </div>
      )}
      {geocodeHint && !geoError && !geocodeFailed && (
        <p className="text-xs text-muted">{geocodeHint}</p>
      )}

      <div
        className={`overflow-hidden rounded-xl border border-border ${!universityReady ? 'opacity-60' : ''}`}
        style={{ height }}
      >
        <Map
          mapId={GOOGLE_MAPS_MAP_ID}
          defaultCenter={mapCenter}
          defaultZoom={mapZoom}
          gestureHandling={universityReady ? 'greedy' : 'none'}
          disableDefaultUI={false}
          onClick={universityReady ? handleMapClick : undefined}
          style={{ width: '100%', height: '100%' }}
        >
          {universityReady && (
            <>
              <MapUserInteractionGuard disabledRef={userMapControlRef} programmaticRef={programmaticCameraRef} />
              <MapCameraController command={cameraCommand} disabledRef={userMapControlRef} programmaticRef={programmaticCameraRef} />
            </>
          )}
          {showCampus && (
            <CampusReferenceMarker position={activeCampus} label={activeCampusLabel} />
          )}
          {showCampus && showPin && (
            <>
              <CampusDistanceLine campus={activeCampus} pin={pinPosition} />
              <CampusDistanceLabel
                campus={activeCampus}
                pin={pinPosition}
                distanceKm={distanceKm}
                label={t('listingForm.distanceFromCampus', { km: distanceKm?.toFixed(1) ?? '—' })}
              />
            </>
          )}
          {showPin && (
            <AdvancedMarker
              position={pinPosition}
              anchorPoint={['50%', '100%']}
              draggable
              onDrag={handleDrag}
              onDragEnd={handleDragEnd}
            >
              <ListingPinMarker />
            </AdvancedMarker>
          )}
        </Map>
      </div>

      <p className="text-xs leading-relaxed text-muted">
        {universityReady ? t('listingForm.mapHelp') : t('listingForm.mapLockedHelp')}
      </p>
    </div>
  )
}
