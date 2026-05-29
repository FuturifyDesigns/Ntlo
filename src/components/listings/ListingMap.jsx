import { useEffect } from 'react'
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet'
import L from 'leaflet'
import { formatPrice } from '../../lib/utils'

const markerIcon = new L.Icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
})

export default function ListingMap({ listings = [], center, zoom = 13, height = '400px' }) {
  useEffect(() => {
    delete L.Icon.Default.prototype._getIconUrl
    L.Icon.Default.mergeOptions({
      iconUrl: markerIcon.options.iconUrl,
      iconRetinaUrl: markerIcon.options.iconRetinaUrl,
      shadowUrl: markerIcon.options.shadowUrl,
    })
  }, [])

  const validListings = listings.filter((l) => l.lat && l.lng)
  const mapCenter = center || (validListings[0] ? [validListings[0].lat, validListings[0].lng] : [-24.6556, 25.909])

  if (!validListings.length && !center) {
    return (
      <div
        className="flex items-center justify-center rounded-xl border border-border bg-background text-sm text-muted"
        style={{ height }}
      >
        Map unavailable — location not set
      </div>
    )
  }

  return (
    <div className="overflow-hidden rounded-xl border border-border" style={{ height }}>
      <MapContainer center={mapCenter} zoom={zoom} style={{ height: '100%', width: '100%' }} scrollWheelZoom={false}>
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {validListings.map((listing) => (
          <Marker key={listing.id} position={[listing.lat, listing.lng]} icon={markerIcon}>
            <Popup>
              <div className="text-sm">
                <p className="font-semibold">{listing.title}</p>
                <p className="font-mono">{formatPrice(listing.price)}/mo</p>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  )
}

export function SingleListingMap({ lat, lng, height = '280px' }) {
  if (!lat || !lng) {
    return (
      <div
        className="flex items-center justify-center rounded-xl border border-border bg-background text-sm text-muted"
        style={{ height }}
      >
        Approximate area — exact location shared on contact
      </div>
    )
  }

  return (
    <div className="overflow-hidden rounded-xl border border-border" style={{ height }}>
      <MapContainer center={[lat, lng]} zoom={15} style={{ height: '100%', width: '100%' }} scrollWheelZoom={false}>
        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
        <Marker position={[lat, lng]} icon={markerIcon} />
      </MapContainer>
    </div>
  )
}
