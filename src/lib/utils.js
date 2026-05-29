export function formatPrice(amount) {
  if (amount == null) return 'P—'
  return `P${Number(amount).toLocaleString('en-BW')}`
}

export function getWhatsAppLink(phone, listingTitle) {
  const message = encodeURIComponent(
    `Hi! I saw your listing "${listingTitle}" on Ntlo and I'm interested. Is it still available?`
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

export function getCoverPhoto(listing) {
  if (listing?.cover_photo?.length) return listing.cover_photo[0]?.url
  if (listing?.listing_photos?.length) {
    const cover = listing.listing_photos.find((p) => p.is_cover)
    return cover?.url || listing.listing_photos[0]?.url
  }
  return null
}

export function getNearestUniversity(listing) {
  if (listing?.nearest_university) return listing.nearest_university
  if (listing?.universities) return listing.universities
  if (listing?.custom_university_name) {
    return { short_name: listing.custom_university_name, name: listing.custom_university_name }
  }
  return null
}
