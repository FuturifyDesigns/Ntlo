import { analyzeListing, compareListings, coachLandlordListing, buildListingInsightSummary } from './listingAdvisor'

export function getListingAdvisorResult(listing, context, t) {
  const analysis = analyzeListing(listing, context)
  const insightText = buildListingInsightSummary(listing, analysis, t)
  return { analysis, insightText }
}

export function getCompareResult(listings, context) {
  return compareListings(listings, context)
}

export function getLandlordCoachResult(form, options) {
  return coachLandlordListing(form, options)
}

export function getScoreColor(score) {
  if (score >= 85) return 'text-success'
  if (score >= 70) return 'text-accent'
  if (score >= 55) return 'text-amber-600'
  return 'text-error'
}

export function getScoreRingColor(score) {
  if (score >= 85) return 'stroke-success'
  if (score >= 70) return 'stroke-accent'
  if (score >= 55) return 'stroke-amber-500'
  return 'stroke-error'
}
