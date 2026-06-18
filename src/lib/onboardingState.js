/** Shared onboarding state — detects empty marketplace vs live content. */

export function getMarketListingCount(pageStateRef = {}) {
  return Math.max(
    pageStateRef.student_dashboard?.marketListingCount ?? 0,
    pageStateRef.student_browse?.listingCount ?? 0,
    pageStateRef.landlord_browse?.listingCount ?? 0,
    pageStateRef.student_listing?.hasListing ? 1 : 0,
  )
}

export function isMarketEmpty(pageStateRef = {}) {
  return getMarketListingCount(pageStateRef) === 0
}

/** Merge page-local state with global marketplace context for step variants. */
export function enrichOnboardingState(rawState = {}, pageStateRef = {}, pageKey = null) {
  const globalMarketCount = getMarketListingCount(pageStateRef)

  let listingCount = rawState.listingCount ?? rawState.marketListingCount ?? globalMarketCount
  let isLaunchMode = false

  if (pageKey === 'landlord_dashboard') {
    listingCount = rawState.listingCount ?? 0
    isLaunchMode = listingCount === 0
  } else if (pageKey === 'landlord_browse' || pageKey === 'student_browse') {
    listingCount = rawState.listingCount ?? 0
    isLaunchMode = listingCount === 0
  } else if (pageKey === 'student_listing') {
    listingCount = rawState.hasListing ? 1 : 0
    isLaunchMode = globalMarketCount === 0
  } else if (pageKey === 'student_dashboard') {
    listingCount = rawState.marketListingCount ?? globalMarketCount
    isLaunchMode = globalMarketCount === 0
  } else {
    isLaunchMode = globalMarketCount === 0
  }

  return {
    ...rawState,
    marketListingCount: globalMarketCount,
    marketEmpty: globalMarketCount === 0,
    hasMarketListings: globalMarketCount > 0,
    isLaunchMode,
    listingCount,
  }
}

export function getAdaptiveDescriptionKey(pageKey, pageStateRef = {}) {
  const globalEmpty = isMarketEmpty(pageStateRef)
  const landlordEmpty = (pageStateRef.landlord_dashboard?.listingCount ?? 0) === 0

  const useEmptyCopy = pageKey === 'landlord_dashboard' || pageKey === 'landlord_browse'
    ? landlordEmpty && (pageKey === 'landlord_dashboard' || globalEmpty)
    : globalEmpty

  const suffix = useEmptyCopy ? 'Empty' : ''
  const keys = {
    student_dashboard: `onboarding.continueDashboardDesc${suffix}`,
    student_browse: `onboarding.continueBrowseDesc${suffix}`,
    student_listing: `onboarding.continueListingDesc${suffix}`,
    landlord_dashboard: `onboarding.continueLandlordDashboardDesc${suffix}`,
    landlord_browse: `onboarding.continueLandlordBrowseDesc${suffix}`,
  }
  return keys[pageKey] || null
}
