import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import {
  clearFunctionalStorage,
  clearNonEssentialStorage,
  defaultConsent,
  hasConsentDecision,
  readConsent,
  writeConsent,
} from '../lib/cookies'
import { initAnalytics } from '../lib/analytics'

const CookieConsentContext = createContext(null)

function buildFeedback(type, prefs) {
  if (type === 'saved_custom' && prefs) {
    const parts = []
    if (prefs.functional) parts.push('functional')
    if (prefs.analytics) parts.push('analytics')
    return { type: 'saved_custom', params: { enabled: parts.join(', ') || 'essential only' } }
  }
  return { type }
}

export function CookieConsentProvider({ children }) {
  const [consent, setConsent] = useState(() => readConsent())
  const [showBanner, setShowBanner] = useState(() => !hasConsentDecision())
  const [showPreferences, setShowPreferences] = useState(false)
  const [feedback, setFeedback] = useState(null)

  const clearFeedback = useCallback(() => setFeedback(null), [])

  const applyConsent = useCallback((next, feedbackType, feedbackPrefs) => {
    const saved = writeConsent(next)
    setConsent(saved)
    setShowBanner(false)
    setShowPreferences(false)

    if (!saved.analytics) clearNonEssentialStorage()
    if (!saved.functional) clearFunctionalStorage()
    if (saved.analytics) initAnalytics()

    if (feedbackType) {
      setFeedback(buildFeedback(feedbackType, feedbackPrefs))
    }
  }, [])

  const acceptAll = useCallback(() => {
    applyConsent({ essential: true, functional: true, analytics: true }, 'accepted_all')
  }, [applyConsent])

  const rejectOptional = useCallback(() => {
    applyConsent({ essential: true, functional: false, analytics: false }, 'essential_only')
  }, [applyConsent])

  const savePreferences = useCallback(
    (prefs) => {
      applyConsent(
        {
          essential: true,
          functional: Boolean(prefs.functional),
          analytics: Boolean(prefs.analytics),
        },
        'saved_custom',
        prefs
      )
    },
    [applyConsent]
  )

  const openPreferences = useCallback(() => {
    setShowPreferences(true)
    setShowBanner(false)
  }, [])

  const closePreferences = useCallback(() => {
    setShowPreferences(false)
    if (!hasConsentDecision()) setShowBanner(true)
  }, [])

  useEffect(() => {
    function onConsentChange(e) {
      setConsent(e.detail)
    }
    window.addEventListener('ntlo:consent-change', onConsentChange)
    return () => window.removeEventListener('ntlo:consent-change', onConsentChange)
  }, [])

  useEffect(() => {
    if (consent?.analytics) initAnalytics()
  }, [consent?.analytics])

  const value = useMemo(
    () => ({
      consent: consent ?? defaultConsent,
      hasDecided: Boolean(consent?.decidedAt),
      showBanner,
      showPreferences,
      feedback,
      acceptAll,
      rejectOptional,
      savePreferences,
      openPreferences,
      closePreferences,
      clearFeedback,
    }),
    [
      consent,
      showBanner,
      showPreferences,
      feedback,
      acceptAll,
      rejectOptional,
      savePreferences,
      openPreferences,
      closePreferences,
      clearFeedback,
    ]
  )

  return (
    <CookieConsentContext.Provider value={value}>
      {children}
    </CookieConsentContext.Provider>
  )
}

export function useCookieConsent() {
  const ctx = useContext(CookieConsentContext)
  if (!ctx) throw new Error('useCookieConsent must be used within CookieConsentProvider')
  return ctx
}
