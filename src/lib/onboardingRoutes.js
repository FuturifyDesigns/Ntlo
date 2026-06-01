/** Route → onboarding page key and required pages per role. */

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

export function getProfileOnboardingProgress(profile) {
  if (!profile?.id) return {}
  let progress = profile.onboarding_progress || {}
  try {
    const raw = localStorage.getItem(`ntlo_ob_progress_${profile.id}`)
    if (raw) progress = { ...JSON.parse(raw), ...progress }
  } catch {
    // ignore
  }
  return progress
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
  return Boolean(getProfileOnboardingProgress(profile)[pageKey])
}

export function allRequiredPagesDone(profile, options = {}) {
  if (!profile?.role) return false
  const required = getEffectiveRequiredPages(profile.role, options)
  const progress = getProfileOnboardingProgress(profile)
  return required.every((key) => Boolean(progress[key]))
}

export function getRemainingOnboardingPages(profile, options = {}) {
  if (!profile?.role) return []
  const required = getEffectiveRequiredPages(profile.role, options)
  const progress = getProfileOnboardingProgress(profile)
  return required
    .filter((key) => !progress[key])
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
  if (pageKey === 'student_listing' && pageState.sampleListingPath) {
    return pageState.sampleListingPath
  }
  return ONBOARDING_PAGE_META[pageKey]?.path || null
}

export function clearSessionPageDone(userId, pageKey) {
  if (!userId || !pageKey) return
  try {
    sessionStorage.removeItem(`ntlo_ob_page_${userId}_${pageKey}`)
  } catch {
    // ignore
  }
}

export function shouldBlockAutoStart(profile, userId, pageKey) {
  if (!profile || !pageKey) return true
  if (getProfileOnboardingProgress(profile)[pageKey]) return true
  if (sessionPageDone(userId, pageKey)) {
    clearSessionPageDone(userId, pageKey)
  }
  return false
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
