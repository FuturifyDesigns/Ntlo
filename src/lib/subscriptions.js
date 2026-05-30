/** Set to true when ready to enforce billing and accept receipt uploads. */
export const BILLING_LIVE = import.meta.env.VITE_BILLING_ENABLED === 'true'

export const LANDLORD_TIERS = [
  {
    id: 'basic',
    price: 0,
    featured: false,
    maxListings: 2,
    maxPhotos: 3,
    features: ['tierBasicListings', 'tierBasicPhotos', 'tierBasicBadge', 'tierBasicExtras'],
    whyKey: 'whyBasic',
  },
  {
    id: 'standard',
    price: 79,
    featured: true,
    maxListings: 8,
    maxPhotos: 8,
    features: ['tierStandardListings', 'tierStandardPhotos', 'tierStandardBadge', 'tierStandardExtras'],
    whyKey: 'whyStandard',
  },
  {
    id: 'premium',
    price: 149,
    featured: false,
    maxListings: null,
    maxPhotos: 10,
    features: ['tierPremiumListings', 'tierPremiumPhotos', 'tierPremiumBadge', 'tierPremiumExtras'],
    whyKey: 'whyPremium',
  },
]

/** Per-tier card styling for pricing / billing UI */
export const TIER_CARD_STYLES = {
  basic: {
    card: 'border-2 border-dashed border-success/35 bg-surface',
    selected: 'border-success ring-2 ring-success/30 shadow-lg shadow-success/10',
    hover: 'hover:border-success/55 hover:shadow-md',
    check: 'text-success',
    freePrice: 'text-success',
    ctaSelected: 'bg-success text-white',
    topBar: 'h-0.5 bg-success/40',
  },
  standard: {
    card: 'border-2 border-accent bg-gradient-to-b from-accent/12 to-surface shadow-lg shadow-accent/10',
    selected: 'border-accent ring-2 ring-accent/45 shadow-xl shadow-accent/20',
    hover: 'hover:border-accent hover:shadow-xl',
    check: 'text-accent',
    freePrice: 'text-accent',
    ctaSelected: 'bg-accent text-primary',
    topBar: 'h-1 bg-gradient-to-r from-transparent via-accent to-transparent',
  },
  premium: {
    card: 'border-2 border-primary/45 bg-gradient-to-b from-primary/[0.06] to-surface',
    selected: 'border-primary ring-2 ring-primary/25 shadow-lg shadow-primary/10',
    hover: 'hover:border-primary/65 hover:shadow-md',
    check: 'text-primary',
    freePrice: 'text-primary',
    ctaSelected: 'bg-primary text-white',
    topBar: 'h-0.5 bg-gradient-to-r from-primary/20 via-primary to-primary/20',
  },
}

export function getTierCardStyle(id) {
  return TIER_CARD_STYLES[id] || TIER_CARD_STYLES.basic
}

/** FNB bank details — update before enabling billing. */
export const FNB_PAYMENT = {
  bank: 'First National Bank (FNB)',
  accountName: 'Ntlo',
  accountNumber: '0000000000',
  branchCode: '280667',
  accountType: 'Cheque',
  referenceHint: 'Your full name + phone number',
}

export function tierNameKey(id) {
  return `pricing.tier${id.charAt(0).toUpperCase() + id.slice(1)}Name`
}

export function tierPrice(id) {
  return LANDLORD_TIERS.find((t) => t.id === id)?.price ?? 0
}

export function formatTierLabel(id, t) {
  if (!id || id === 'early_access' || id === 'free') return t('billing.earlyAccessTier')
  return t(tierNameKey(id))
}

export function subscriptionStatusLabel(status, t) {
  const key = `billing.status.${status || 'early_access'}`
  const label = t(key)
  return label.includes('billing.status.') ? status : label
}

/** Days until subscription_period_end; null if none. */
export function daysUntilRenewal(periodEnd) {
  if (!periodEnd) return null
  const ms = new Date(periodEnd).getTime() - Date.now()
  return Math.ceil(ms / 86400000)
}

export function isSubscriptionActive(profile) {
  if (!profile) return false
  if (profile.subscription_status === 'early_access') return true
  if (profile.subscription_status !== 'active') return false
  if (!profile.subscription_period_end) return true
  return new Date(profile.subscription_period_end) > new Date()
}

export function needsRenewalSoon(profile, withinDays = 7) {
  const days = daysUntilRenewal(profile?.subscription_period_end)
  return days != null && days >= 0 && days <= withinDays
}
