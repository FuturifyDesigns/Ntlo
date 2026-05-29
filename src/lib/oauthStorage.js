const KEYS = [
  'ntlo_oauth_pending',
  'ntlo_oauth_started_at',
  'ntlo_oauth_role',
  'ntlo_oauth_from',
]

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
  return !profile?.phone?.trim()
}
