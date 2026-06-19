import { BILLING_LIVE } from './subscriptions'
import { getListingOccupancy } from './listingOccupancy'
import { TRUST_LEVEL } from './tierBenefits'

/** Student-facing risk band derived from verification signals. */
export const TRUST_RISK = {
  low: 'low',
  moderate: 'moderate',
  higher: 'higher',
}

export function isListingTrusted(listing) {
  return Boolean(listing?.is_verified)
}

export function isLandlordVerified(listing, landlordProfile) {
  return Boolean(
    listing?.landlord_verified
    || landlordProfile?.is_verified
    || listing?.landlord?.is_verified
  )
}

export function isListingPublished(listing) {
  return listing?.verification_status === 'approved'
}

/**
 * Composite trust profile for badges, advisor scoring, and risk labels.
 * Publish approval (verification_status) is separate from the Trusted home flag (is_verified).
 */
export function getListingTrustProfile(listing, landlordProfile) {
  const published = isListingPublished(listing)
  const listingTrusted = isListingTrusted(listing)
  const landlordVerified = isLandlordVerified(listing, landlordProfile)

  let trustScore = published ? 42 : 15
  if (landlordVerified) trustScore += 28
  if (listingTrusted) trustScore += 30
  trustScore = Math.min(100, trustScore)

  let risk = TRUST_RISK.higher
  if (listingTrusted && landlordVerified) {
    risk = TRUST_RISK.low
  } else if (listingTrusted || landlordVerified) {
    risk = TRUST_RISK.moderate
  } else if (published) {
    risk = TRUST_RISK.moderate
  }

  let primaryBadge = null
  if (BILLING_LIVE) {
    const tier = landlordProfile?.subscription_tier || listing?.landlord?.subscription_tier
    if (tier === 'premium') primaryBadge = TRUST_LEVEL.featured
    else if (tier === 'standard') primaryBadge = TRUST_LEVEL.standard
  }

  if (!primaryBadge) {
    if (listingTrusted) primaryBadge = TRUST_LEVEL.trustedHome
    else if (landlordVerified) primaryBadge = TRUST_LEVEL.verifiedLandlord
    else if (published) primaryBadge = TRUST_LEVEL.listed
  }

  const secondaryBadge = listingTrusted && landlordVerified && primaryBadge !== TRUST_LEVEL.verifiedLandlord
    ? TRUST_LEVEL.verifiedLandlord
    : null

  return {
    published,
    listingTrusted,
    landlordVerified,
    trustScore,
    risk,
    primaryBadge,
    secondaryBadge,
    showRisk: published && getListingOccupancy(listing) !== 'unavailable',
  }
}

export function trustRiskLabelKey(risk) {
  if (risk === TRUST_RISK.low) return 'trust.riskLow'
  if (risk === TRUST_RISK.moderate) return 'trust.riskModerate'
  return 'trust.riskHigher'
}

export function trustRiskStyle(risk) {
  if (risk === TRUST_RISK.low) {
    return 'bg-success/12 text-success border-success/30'
  }
  if (risk === TRUST_RISK.moderate) {
    return 'bg-amber-500/12 text-amber-800 border-amber-500/30 dark:text-amber-200'
  }
  return 'bg-error/10 text-error border-error/30'
}
