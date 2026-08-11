export function formatPrice(amount) {
  if (amount == null || amount === '' || Number.isNaN(Number(amount))) return 'POA'
  return `P${Number(amount).toLocaleString('en-BW')}`
}

/** Default image for listings with no photos. */
export const LISTING_PLACEHOLDER_IMAGE = '/images/listing-placeholder.png'

export function getWhatsAppLink(phone, listingTitle) {
  const message = encodeURIComponent(
    `Hi! I saw your listing "${listingTitle}" and I'm interested. Is it still available?`
  )
  const cleaned = String(phone).replace(/\D/g, '')
  const number = cleaned.startsWith('267') ? cleaned : `267${cleaned}`
  return `https://wa.me/${number}?text=${message}`
}

export function calculateDistance(lat1, lng1, lat2, lng2) {
  const R = 6371
  const dLat = ((lat2 - lat1) * Math.PI) / 180
  const dLng = ((lng2 - lng1) * Math.PI) / 180
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

export function formatDistance(km, shortName = 'campus') {
  if (km == null) return `Near ${shortName}`
  if (km < 1) return `${Math.round(km * 1000)}m from ${shortName}`
  return `${km.toFixed(1)} km from ${shortName}`
}

export function slugify(text) {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
}

export const ROOM_TYPES = {
  single: 'Single room',
  sharing: 'Sharing',
  self_contained: 'Self-contained',
  cottage: 'Cottage',
  house: 'House',
}

export const GENDER_PREFERENCES = {
  any: 'Open to all',
  female: 'Females only',
  male: 'Males only',
}

export const UTILITIES_OPTIONS = {
  included: 'Bills included in rent',
  partial: 'Some bills included',
  not_included: 'Tenant pays own bills',
}

export const AMENITIES = [
  { id: 'wifi', label: 'WiFi', icon: 'Wifi' },
  { id: 'water', label: 'Water included', icon: 'Droplets' },
  { id: 'security', label: 'Security guard', icon: 'Shield' },
  { id: 'furnished', label: 'Furnished', icon: 'Sofa' },
  { id: 'parking', label: 'Parking', icon: 'Car' },
  { id: 'dstv', label: 'DSTV', icon: 'Tv' },
  { id: 'borehole', label: 'Borehole water', icon: 'Waves' },
  { id: 'braai', label: 'Braai area', icon: 'Flame' },
  { id: 'laundry', label: 'Laundry', icon: 'WashingMachine' },
  { id: 'kitchen', label: 'Shared kitchen', icon: 'UtensilsCrossed' },
]

export function cn(...classes) {
  return classes.filter(Boolean).join(' ')
}

/** Returns { unit: 'now'|'minutes'|'hours'|'days', count } for relative time. */
export function relativeTimeParts(dateInput) {
  if (!dateInput) return { unit: 'now', count: 0 }
  const ms = Date.now() - new Date(dateInput).getTime()
  const mins = Math.floor(ms / 60000)
  if (mins < 1) return { unit: 'now', count: 0 }
  if (mins < 60) return { unit: 'minutes', count: mins }
  const hours = Math.floor(mins / 60)
  if (hours < 24) return { unit: 'hours', count: hours }
  return { unit: 'days', count: Math.floor(hours / 24) }
}

export function getCoverPhoto(listing) {
  const photos = getListingPhotos(listing)
  if (!photos.length) return LISTING_PLACEHOLDER_IMAGE
  const cover = photos.find((p) => p.is_cover)
  return cover?.url || photos[0]?.url || LISTING_PLACEHOLDER_IMAGE
}

export function getListingPhotos(listing) {
  const raw = listing?.listing_photos ?? listing?.cover_photo
  if (!raw) return []
  const list = Array.isArray(raw) ? raw : [raw]
  return [...list].sort((a, b) => (a.display_order || 0) - (b.display_order || 0))
}

export function getNearestUniversity(listing) {
  if (listing?.nearest_university) return listing.nearest_university
  if (listing?.universities) return listing.universities
  if (listing?.custom_university_name) {
    return { short_name: listing.custom_university_name, name: listing.custom_university_name }
  }
  return null
}
