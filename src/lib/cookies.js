const STORAGE_KEY = 'ntlo_cookie_consent'
const COOKIE_NAME = 'ntlo_consent'
const CONSENT_VERSION = 1

export const defaultConsent = {
  version: CONSENT_VERSION,
  essential: true,
  functional: false,
  analytics: false,
  decidedAt: null,
}

function cookiePath() {
  const base = import.meta.env.BASE_URL || '/'
  return base.endsWith('/') ? base.slice(0, -1) || '/' : base
}

export function readConsent() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored) {
      const parsed = JSON.parse(stored)
      if (parsed?.version === CONSENT_VERSION && parsed.decidedAt) return parsed
    }
  } catch {
    // fall through to cookie
  }

  const match = document.cookie
    .split('; ')
    .find((row) => row.startsWith(`${COOKIE_NAME}=`))

  if (!match) return null

  try {
    const parsed = JSON.parse(decodeURIComponent(match.split('=').slice(1).join('=')))
    if (parsed?.version === CONSENT_VERSION && parsed.decidedAt) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(parsed))
      return parsed
    }
  } catch {
    return null
  }

  return null
}

export function writeConsent(consent) {
  const payload = {
    ...defaultConsent,
    ...consent,
    essential: true,
    version: CONSENT_VERSION,
    decidedAt: new Date().toISOString(),
  }

  localStorage.setItem(STORAGE_KEY, JSON.stringify(payload))

  const value = encodeURIComponent(JSON.stringify(payload))
  document.cookie = `${COOKIE_NAME}=${value}; path=${cookiePath()}; max-age=31536000; SameSite=Lax`

  window.dispatchEvent(new CustomEvent('ntlo:consent-change', { detail: payload }))
  return payload
}

export function hasConsentDecision() {
  return Boolean(readConsent()?.decidedAt)
}

export function isFunctionalAllowed() {
  const c = readConsent()
  return Boolean(c?.functional)
}

export function isAnalyticsAllowed() {
  const c = readConsent()
  return Boolean(c?.analytics)
}

export function clearNonEssentialStorage() {
  localStorage.removeItem('ntlo_analytics_queue')
}
