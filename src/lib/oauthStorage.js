const KEYS = [
  'ntlo_oauth_pending',
  'ntlo_oauth_started_at',
  'ntlo_oauth_role',
  'ntlo_oauth_from',
  'ntlo_oauth_new_signup',
  'ntlo_google_redirecting',
]

export const GOOGLE_REDIRECT_KEY = 'ntlo_google_redirecting'

export function clearOAuthStorage() {
  KEYS.forEach((key) => sessionStorage.removeItem(key))
}

export function markOAuthPending() {
  sessionStorage.setItem('ntlo_oauth_pending', '1')
  sessionStorage.setItem('ntlo_oauth_started_at', String(Date.now()))
}

export function isOAuthPendingStale(maxAgeMs = 60_000) {
  const pending = sessionStorage.getItem('ntlo_oauth_pending')
  if (!pending) return false
  const startedAt = Number(sessionStorage.getItem('ntlo_oauth_started_at') || 0)
  return !startedAt || Date.now() - startedAt > maxAgeMs
}

export function setOAuthIntent({ from, role } = {}) {
  if (from) sessionStorage.setItem('ntlo_oauth_from', from)
  if (role === 'student' || role === 'landlord') {
    sessionStorage.setItem('ntlo_oauth_role', role)
  } else {
    sessionStorage.removeItem('ntlo_oauth_role')
  }
}

export function consumeOAuthIntent() {
  const from = sessionStorage.getItem('ntlo_oauth_from')
  const role = sessionStorage.getItem('ntlo_oauth_role')
  sessionStorage.removeItem('ntlo_oauth_from')
  sessionStorage.removeItem('ntlo_oauth_role')
  return { from, role }
}

export function profileNeedsSetup(profile) {
  if (!profile?.phone?.trim()) return true
  if (profile?.role === 'student' && !profile?.gender) return true
  return false
}

/** Google / social accounts are verified by the provider — no email link step. */
export function isSocialAuthUser(user) {
  if (!user) return false
  const providers = (user.identities || []).map((i) => i.provider).filter(Boolean)
  if (providers.some((p) => p !== 'email')) return true
  const provider = user.app_metadata?.provider
  return Boolean(provider && provider !== 'email')
}

export function isEmailVerifiedForAccess(user) {
  if (!user) return false
  if (user.email_confirmed_at || user.confirmed_at) return true
  return isSocialAuthUser(user)
}

export function isNewOAuthUser(user) {
  if (!user?.created_at) return false
  const created = new Date(user.created_at).getTime()
  const lastSignIn = user.last_sign_in_at ? new Date(user.last_sign_in_at).getTime() : created
  return Math.abs(lastSignIn - created) < 60_000
}

export const OAUTH_NEW_SIGNUP_KEY = 'ntlo_oauth_new_signup'

export function markOAuthNewSignup() {
  sessionStorage.setItem(OAUTH_NEW_SIGNUP_KEY, '1')
}

export function hasOAuthNewSignupPending() {
  return sessionStorage.getItem(OAUTH_NEW_SIGNUP_KEY) === '1'
}

export function consumeOAuthNewSignup() {
  const value = sessionStorage.getItem(OAUTH_NEW_SIGNUP_KEY)
  sessionStorage.removeItem(OAUTH_NEW_SIGNUP_KEY)
  return value === '1'
}
