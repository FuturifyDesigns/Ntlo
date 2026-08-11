/** Ntlo is free for students and landlords — no paid plans. */
export const BILLING_LIVE = false

/** @deprecated Kept for older imports; billing is disabled permanently. */
export const LANDLORD_TIERS = [
  {
    id: 'free',
    price: 0,
    featured: true,
    maxListings: null,
    maxPhotos: null,
    features: ['tierFreeListings', 'tierFreePhotos', 'tierFreeBadge', 'tierFreeExtras'],
    whyKey: 'whyFree',
  },
]

export const TIER_CARD_STYLES = {
  free: {
    card: 'border-2 border-success/35 bg-surface',
    selected: 'border-success ring-2 ring-success/30 shadow-lg shadow-success/10',
    hover: 'hover:border-success/55 hover:shadow-md',
    check: 'text-success',
    freePrice: 'text-success',
    ctaSelected: 'bg-success text-white',
    topBar: 'h-0.5 bg-success/40',
  },
}

export function getTierCardStyle(id) {
  return TIER_CARD_STYLES[id] || TIER_CARD_STYLES.free
}

export function tierNameKey(id) {
  if (!id || id === 'early_access' || id === 'basic' || id === 'standard' || id === 'premium') {
    return 'pricing.tierFreeName'
  }
  return `pricing.tier${id.charAt(0).toUpperCase() + id.slice(1)}Name`
}

export function tierPrice() {
  return 0
}

/** Always free — no early-access gate. */
export function isEarlyAccessMode() {
  return false
}

/** Listing/photo caps — null means unlimited. */
export function getLandlordLimits() {
  return { maxListings: null, maxPhotos: null }
}

export function getMaxPhotosPerListing() {
  return null
}

export function formatTierLabel(_id, t) {
  return t('pricing.tierFreeName')
}

export function subscriptionStatusLabel(_status, t) {
  return t('pricing.freeForever')
}

export function daysUntilRenewal() {
  return null
}

export function isSubscriptionActive() {
  return true
}

export function needsRenewalSoon() {
  return false
}
