import { isLandlordVerified } from './housing'
import { BILLING_LIVE } from './subscriptions'

/** Visual badge levels on listings (subscription tier when billing is live). */
export const TRUST_LEVEL = {
  listed: 'listed',
  standard: 'standard',
  featured: 'featured',
}

const TIER_RANK = { free: 0, early_access: 0, basic: 1, standard: 2, premium: 3 }

const TIER_TO_BADGE = {
  basic: TRUST_LEVEL.listed,
  early_access: TRUST_LEVEL.listed,
  free: TRUST_LEVEL.listed,
  standard: TRUST_LEVEL.standard,
  premium: TRUST_LEVEL.featured,
}

export const LANDLORD_TIER_BENEFITS = {
  basic: {
    id: 'basic',
    rank: 1,
    price: 0,
    trustBadge: TRUST_LEVEL.listed,
    maxListings: 2,
    maxPhotos: 3,
    featureKeys: [
      'tierBenefit.listings2',
      'tierBenefit.photos3',
      'tierBenefit.listedBadge',
      'tierBenefit.whatsapp',
      'tierBenefit.allUniversities',
    ],
    prioritySearch: false,
    featuredBoost: false,
  },
  standard: {
    id: 'standard',
    rank: 2,
    price: 79,
    trustBadge: TRUST_LEVEL.standard,
    maxListings: 8,
    maxPhotos: 8,
    featureKeys: [
      'tierBenefit.listings8',
      'tierBenefit.photos8',
      'tierBenefit.standardBadge',
      'tierBenefit.prioritySearch',
      'tierBenefit.whatsapp',
      'tierBenefit.allUniversities',
    ],
    prioritySearch: true,
    featuredBoost: false,
  },
  premium: {
    id: 'premium',
    rank: 3,
    price: 149,
    trustBadge: TRUST_LEVEL.featured,
    maxListings: null,
    maxPhotos: 10,
    featureKeys: [
      'tierBenefit.listingsUnlimited',
      'tierBenefit.photos10',
      'tierBenefit.featuredBadge',
      'tierBenefit.featuredBoost',
      'tierBenefit.topPlacement',
      'tierBenefit.prioritySearch',
      'tierBenefit.whatsapp',
    ],
    prioritySearch: true,
    featuredBoost: true,
  },
}

export const TIER_BENEFIT_ORDER = ['basic', 'standard', 'premium']

export function getTierBenefits(tierId) {
  return LANDLORD_TIER_BENEFITS[tierId] || LANDLORD_TIER_BENEFITS.basic
}

export function tierRank(tierId) {
  return TIER_RANK[tierId] ?? 0
}

export function tierMeetsRequirement(profileTier, requiredTier) {
  return tierRank(profileTier) >= tierRank(requiredTier)
}

/**
 * Badge on a listing card/detail.
 * - Early access: admin-approved identity → trusted home; otherwise Listed on Ntlo.
 * - Billing live (future): badge follows landlord subscription_tier (see BILLING_GO_LIVE.md).
 */
export function resolveListingTrustBadge(listing, landlordProfile) {
  if (BILLING_LIVE && landlordProfile?.subscription_tier) {
    return TIER_TO_BADGE[landlordProfile.subscription_tier] || TRUST_LEVEL.listed
  }

  if (listing?.is_verified && listing?.verification_status !== 'rejected') {
    return TRUST_LEVEL.featured
  }
  if (isLandlordVerified(listing)) return TRUST_LEVEL.standard
  if (listing?.available) return TRUST_LEVEL.listed
  return null
}

export function trustBadgeLabelKey(level) {
  if (level === TRUST_LEVEL.featured) return 'trust.featuredTier'
  if (level === TRUST_LEVEL.standard) return 'trust.standardTier'
  if (level === TRUST_LEVEL.listed) return 'trust.listedOnNtlo'
  return null
}
