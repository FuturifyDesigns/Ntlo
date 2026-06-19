/** Route → onboarding page key and required pages per role. */

export const ONBOARDING_AUTH_PATHS = new Set([
  '/login',
  '/register',
  '/forgot-password',
  '/check-email',
  '/complete-profile',
])

/** App pages where onboarding UI should wait (e.g. landlord must finish verify first). */
export const ONBOARDING_DEFERRED_PATHS = new Set([
  '/landlord/verify',
])

/** Onboarding UI only for signed-in students/landlords on app pages (not auth screens). */
export function isOnboardingEligible(profile, user, pathname) {
  if (!user?.id || !profile?.id) return false
  if (!['student', 'landlord'].includes(profile.role)) return false
  if (ONBOARDING_AUTH_PATHS.has(pathname)) return false
  if (ONBOARDING_DEFERRED_PATHS.has(pathname)) return false
  return true
}

export const REQUIRED_ONBOARDING_PAGES = {
  student: ['student_dashboard', 'student_browse', 'student_listing'],
  landlord: ['landlord_dashboard', 'landlord_browse'],
}

export const ONBOARDING_PAGE_META = {
  student_dashboard: {
    path: '/student',
    pageLabelKey: 'onboarding.pageLabels.dashboard',
    actionKey: 'onboarding.continueDashboard',
    descriptionKey: 'onboarding.continueDashboardDesc',
  },
  student_browse: {
    path: '/listings',
    pageLabelKey: 'onboarding.pageLabels.browse',
    actionKey: 'onboarding.continueBrowse',
    descriptionKey: 'onboarding.continueBrowseDesc',
  },
  student_listing: {
    path: '/listings',
    highlightNav: false,
    pageLabelKey: 'onboarding.pageLabels.listing',
    actionKey: 'onboarding.continueListing',
    descriptionKey: 'onboarding.continueListingDesc',
  },
  landlord_dashboard: {
    path: '/landlord',
    pageLabelKey: 'onboarding.pageLabels.landlordDashboard',
    actionKey: 'onboarding.continueLandlordDashboard',
    descriptionKey: 'onboarding.continueLandlordDashboardDesc',
  },
  landlord_browse: {
    path: '/listings',
    pageLabelKey: 'onboarding.pageLabels.browse',
    actionKey: 'onboarding.continueLandlordBrowse',
    descriptionKey: 'onboarding.continueLandlordBrowseDesc',
  },
}

export function getEffectiveRequiredPages(role, { marketListingCount } = {}) {
  const base = REQUIRED_ONBOARDING_PAGES[role] || []
  if (role === 'student' && (marketListingCount ?? 0) === 0) {
    return base.filter((key) => key !== 'student_listing')
  }
  return base
}

export function getOnboardingPageKey(pathname, role) {
  if (role === 'student') {
    if (pathname === '/student') return 'student_dashboard'
    if (pathname === '/listings') return 'student_browse'
    if (/^\/listings\/[^/]+$/.test(pathname)) return 'student_listing'
  }
  if (role === 'landlord') {
    if (pathname === '/landlord') return 'landlord_dashboard'
    if (pathname === '/listings') return 'landlord_browse'
  }
  return null
}

/** Only ISO timestamps / RPC strings count as done (ignore truthy garbage in JSON). */
export function isPageProgressDone(value) {
  if (typeof value !== 'string' || value.length < 8) return false
  return !Number.isNaN(Date.parse(value))
}

export function getProfileOnboardingProgress(profile) {
  if (!profile?.id) return {}
  let progress = profile.onboarding_progress || {}
  try {
    const raw = localStorage.getItem(`ntlo_ob_progress_${profile.id}`)
    if (raw) progress = { ...progress, ...JSON.parse(raw) }
  } catch {
    // ignore
  }
  const cleaned = {}
  for (const [key, val] of Object.entries(progress)) {
    if (isPageProgressDone(val)) cleaned[key] = val
  }
  return cleaned
}

/** Merge server RPC result without dropping pages only stored locally. */
export function mergeOnboardingProgress(existing, serverProgress, pageKey) {
  const merged = { ...existing, ...(serverProgress || {}) }
  if (pageKey && !merged[pageKey]) {
    merged[pageKey] = new Date().toISOString()
  }
  return merged
}

/** Pages finished this session but not yet in persisted progress. */
export function syncSessionPagesIntoProgress(profile, options = {}) {
  if (!profile?.id || !profile?.role) return getProfileOnboardingProgress(profile)
  const required = getEffectiveRequiredPages(profile.role, options)
  const progress = { ...getProfileOnboardingProgress(profile) }
  for (const key of required) {
    if (sessionPageDone(profile.id, key) && !isPageProgressDone(progress[key])) {
      progress[key] = new Date().toISOString()
    }
  }
  return progress
}

export function getMarketListingCountFromState(pageStateRef = {}) {
  return Math.max(
    pageStateRef.student_dashboard?.marketListingCount ?? 0,
    pageStateRef.student_browse?.listingCount ?? 0,
    pageStateRef.student_listing?.hasListing ? 1 : 0,
  )
}

export function saveLocalOnboardingProgress(userId, progress) {
  if (!userId) return
  try {
    localStorage.setItem(`ntlo_ob_progress_${userId}`, JSON.stringify(progress))
  } catch {
    // ignore
  }
}

export function isPageOnboardingDone(profile, pageKey) {
  if (!profile || !pageKey) return true
  return isPageProgressDone(getProfileOnboardingProgress(profile)[pageKey])
}

export function allRequiredPagesDone(profile, options = {}) {
  if (!profile?.role) return false
  const required = getEffectiveRequiredPages(profile.role, options)
  const progress = getProfileOnboardingProgress(profile)
  return required.every((key) => isPageProgressDone(progress[key]))
}

export function isOnboardingFullyComplete(profile, options = {}) {
  if (!profile?.role) return false
  // Per-page progress only — onboarding_completed_at is legacy/grandfathered and must not hide the banner.
  return allRequiredPagesDone(profile, options)
}

export function sessionPageDone(userId, pageKey) {
  if (!userId || !pageKey) return false
  try {
    return sessionStorage.getItem(`ntlo_ob_page_${userId}_${pageKey}`) === '1'
  } catch {
    return false
  }
}

export function markSessionPageDone(userId, pageKey) {
  if (!userId || !pageKey) return
  try {
    sessionStorage.setItem(`ntlo_ob_page_${userId}_${pageKey}`, '1')
  } catch {
    // ignore
  }
}

export function clearSessionPageDone(userId, pageKey) {
  if (!userId || !pageKey) return
  try {
    sessionStorage.removeItem(`ntlo_ob_page_${userId}_${pageKey}`)
  } catch {
    // ignore
  }
}

export function shouldBlockAutoStart(profile, userId, pageKey, options = {}) {
  if (!profile || !pageKey) return true
  if (isOnboardingFullyComplete(profile, options)) return true

  const progress = getProfileOnboardingProgress(profile)
  if (isPageProgressDone(progress[pageKey])) return true

  if (sessionPageDone(userId, pageKey)) {
    saveLocalOnboardingProgress(userId, {
      ...progress,
      [pageKey]: new Date().toISOString(),
    })
    return true
  }

  return false
}

export function getRemainingOnboardingPages(profile, options = {}) {
  if (!profile?.role) return []
  if (isOnboardingFullyComplete(profile, options)) return []
  const required = getEffectiveRequiredPages(profile.role, options)
  const progress = getProfileOnboardingProgress(profile)
  return required
    .filter((key) => !isPageProgressDone(progress[key]))
    .map((key) => ({ pageKey: key, ...ONBOARDING_PAGE_META[key] }))
}

export function getNextOnboardingPage(profile, options = {}) {
  const remaining = getRemainingOnboardingPages(profile, options)
  return remaining[0] || null
}

export function getOnboardingActionPage(profile, pathname, role, options = {}) {
  const remaining = getRemainingOnboardingPages(profile, options)
  if (remaining.length === 0) return null
  const currentKey = getOnboardingPageKey(pathname, role)
  return remaining.find((page) => page.pageKey === currentKey) || remaining[0]
}

export function getTourNavigatePath(pageKey, pageState = {}) {
  if (pageKey === 'student_listing') {
    return pageState.sampleListingPath
      || ONBOARDING_PAGE_META[pageKey]?.path
      || null
  }
  return ONBOARDING_PAGE_META[pageKey]?.path || null
}

/** First listing detail URL for the listing-page tour (browse, dashboard, or detail state). */
export function getSampleListingPathFromState(pageStateRef = {}) {
  return pageStateRef.student_browse?.sampleListingPath
    || pageStateRef.student_dashboard?.sampleListingPath
    || pageStateRef.student_listing?.sampleListingPath
    || null
}

