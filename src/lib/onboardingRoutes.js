/** Route → onboarding page key and required pages per role. */

export const REQUIRED_ONBOARDING_PAGES = {
  student: ['student_dashboard', 'student_browse', 'student_listing'],
  landlord: ['landlord_dashboard', 'landlord_browse'],
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

export function allRequiredPagesDone(profile) {
  if (!profile?.role) return false
  if (profile.onboarding_completed_at) return true
  const required = REQUIRED_ONBOARDING_PAGES[profile.role] || []
  const progress = profile.onboarding_progress || {}
  return required.every((key) => Boolean(progress[key]))
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
