import { getListingOccupancy } from './listingOccupancy'
import { getListingTrustProfile } from './listingTrust'

/** Visual badge levels on listings. Identity verification is separate from subscription tiers. */
export const TRUST_LEVEL = {
  free: 'free',
  listed: 'listed',
  standard: 'standard',
  featured: 'featured',
  trustedHome: 'trusted_home',
  verifiedLandlord: 'verified_landlord',
}

const TIER_RANK = { free: 0, early_access: 0, basic: 1, standard: 2, premium: 3 }

const TIER_TO_BADGE = {
  basic: TRUST_LEVEL.listed,
  early_access: TRUST_LEVEL.free,
  free: TRUST_LEVEL.free,
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
 * Primary trust badge on listing cards/detail.
 */
export function resolveListingTrustBadge(listing, landlordProfile) {
  if (!listing || getListingOccupancy(listing) === 'unavailable') return null
  return getListingTrustProfile(listing, landlordProfile).primaryBadge
}

/** Secondary badge when both listing and landlord are verified. */
export function resolveSecondaryTrustBadge(listing, landlordProfile) {
  if (!listing || getListingOccupancy(listing) === 'unavailable') return null
  return getListingTrustProfile(listing, landlordProfile).secondaryBadge
}

export function trustBadgeLabelKey(level) {
  if (level === TRUST_LEVEL.trustedHome) return 'trust.trustedHome'
  if (level === TRUST_LEVEL.verifiedLandlord) return 'trust.verifiedLandlord'
  if (level === TRUST_LEVEL.free) return 'trust.earlyAccessFree'
  if (level === TRUST_LEVEL.featured) return 'trust.featuredTier'
  if (level === TRUST_LEVEL.standard) return 'trust.standardTier'
  if (level === TRUST_LEVEL.listed) return 'trust.listedOnNtlo'
  return null
}

export function shouldShowListingTrustBadge() {
  return true
}
