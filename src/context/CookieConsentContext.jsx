import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import {
  clearNonEssentialStorage,
  defaultConsent,
  hasConsentDecision,
  readConsent,
  writeConsent,
} from '../lib/cookies'
import { initAnalytics } from '../lib/analytics'

const CookieConsentContext = createContext(null)

export function CookieConsentProvider({ children }) {
  const [consent, setConsent] = useState(() => readConsent())
  const [showBanner, setShowBanner] = useState(() => !hasConsentDecision())
  const [showPreferences, setShowPreferences] = useState(false)

  const applyConsent = useCallback((next) => {
    const saved = writeConsent(next)
    setConsent(saved)
    setShowBanner(false)
    setShowPreferences(false)

    if (!saved.analytics) clearNonEssentialStorage()
    if (saved.analytics) initAnalytics()
  }, [])

  const acceptAll = useCallback(() => {
    applyConsent({ essential: true, functional: true, analytics: true })
  }, [applyConsent])

  const rejectOptional = useCallback(() => {
    applyConsent({ essential: true, functional: true, analytics: false })
  }, [applyConsent])

  const savePreferences = useCallback(
    (prefs) => {
      applyConsent({
        essential: true,
        functional: Boolean(prefs.functional),
        analytics: Boolean(prefs.analytics),
      })
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
      acceptAll,
      rejectOptional,
      savePreferences,
      openPreferences,
      closePreferences,
    }),
    [
      consent,
      showBanner,
      showPreferences,
      acceptAll,
      rejectOptional,
      savePreferences,
      openPreferences,
      closePreferences,
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
