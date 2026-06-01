/** Route → onboarding page key and required pages per role. */

export const REQUIRED_ONBOARDING_PAGES = {
  student: ['student_dashboard', 'student_browse', 'student_listing'],
  landlord: ['landlord_dashboard', 'landlord_browse'],
}

export const ONBOARDING_PAGE_META = {
  student_dashboard: {
    path: '/student',
    actionKey: 'onboarding.continueDashboard',
    descriptionKey: 'onboarding.continueDashboardDesc',
  },
  student_browse: {
    path: '/listings',
    actionKey: 'onboarding.continueBrowse',
    descriptionKey: 'onboarding.continueBrowseDesc',
  },
  student_listing: {
    path: '/listings',
    actionKey: 'onboarding.continueListing',
    descriptionKey: 'onboarding.continueListingDesc',
  },
  landlord_dashboard: {
    path: '/landlord',
    actionKey: 'onboarding.continueLandlordDashboard',
    descriptionKey: 'onboarding.continueLandlordDashboardDesc',
  },
  landlord_browse: {
    path: '/listings',
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

export function isPageOnboardingDone(profile, pageKey) {
  if (!profile || !pageKey) return true
  if (profile.onboarding_completed_at) return true
  const progress = profile.onboarding_progress || {}
  return Boolean(progress[pageKey])
}

export function allRequiredPagesDone(profile, options = {}) {
  if (!profile?.role) return false
  if (profile.onboarding_completed_at) return true
  const required = getEffectiveRequiredPages(profile.role, options)
  const progress = profile.onboarding_progress || {}
  return required.every((key) => Boolean(progress[key]))
}

export function getNextOnboardingPage(profile, options = {}) {
  if (!profile?.role || profile.onboarding_completed_at) return null
  const required = getEffectiveRequiredPages(profile.role, options)
  const progress = profile.onboarding_progress || {}
  const nextKey = required.find((key) => !progress[key])
  if (!nextKey) return null
  return { pageKey: nextKey, ...ONBOARDING_PAGE_META[nextKey] }
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
