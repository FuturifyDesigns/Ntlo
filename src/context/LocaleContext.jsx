import { createContext, useContext, useEffect, useState } from 'react'
import { isFunctionalAllowed } from '../lib/cookies'

const LocaleContext = createContext(null)

const STORAGE_KEY = 'ntlo_prefs'

const defaults = {
  lang: 'en',
  fontSize: 'medium',
  highContrast: false,
  reduceMotion: false,
  underlineLinks: false,
}

function loadPrefs() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? { ...defaults, ...JSON.parse(raw) } : defaults
  } catch {
    return defaults
  }
}

export function LocaleProvider({ children }) {
  const [prefs, setPrefs] = useState(loadPrefs)

  useEffect(() => {
    function syncStorage() {
      if (isFunctionalAllowed()) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs))
      }
    }

    syncStorage()
    window.addEventListener('ntlo:consent-change', syncStorage)
    return () => window.removeEventListener('ntlo:consent-change', syncStorage)
  }, [prefs])

  useEffect(() => {
    const root = document.documentElement
    root.lang = prefs.lang === 'tn' ? 'tn' : 'en'
    root.dataset.fontSize = prefs.fontSize
    root.dataset.highContrast = prefs.highContrast ? 'true' : 'false'
    root.dataset.reduceMotion = prefs.reduceMotion ? 'true' : 'false'
    root.dataset.underlineLinks = prefs.underlineLinks ? 'true' : 'false'
  }, [prefs])

  function update(key, value) {
    setPrefs((p) => ({ ...p, [key]: value }))
  }

  function toggleLang() {
    setPrefs((p) => ({ ...p, lang: p.lang === 'en' ? 'tn' : 'en' }))
  }

  function reset() {
    setPrefs(defaults)
  }

  return (
    <LocaleContext.Provider value={{ prefs, update, toggleLang, reset }}>
      {children}
    </LocaleContext.Provider>
  )
}

export function useLocale() {
  const ctx = useContext(LocaleContext)
  if (!ctx) throw new Error('useLocale must be used within LocaleProvider')
  return ctx
}
