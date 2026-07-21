import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { X } from 'lucide-react'
import { useCookieConsent } from '../../context/CookieConsentContext'
import { useTranslation } from '../../hooks/useTranslation'
import { useLocale } from '../../context/LocaleContext'
import Button from '../ui/Button'

function Toggle({ id, label, description, checked, disabled, onChange }) {
  return (
    <div className="flex items-start justify-between gap-4 rounded-xl border border-border bg-background p-4">
      <div>
        <label htmlFor={id} className="font-semibold text-primary">
          {label}
        </label>
        <p className="mt-1 text-sm text-muted">{description}</p>
      </div>
      <button
        id={id}
        type="button"
        role="switch"
        aria-checked={checked}
        disabled={disabled}
        onClick={() => !disabled && onChange(!checked)}
        className={`relative mt-0.5 h-7 w-12 shrink-0 rounded-full transition-colors ${
          checked ? 'bg-accent' : 'bg-border'
        } ${disabled ? 'cursor-not-allowed opacity-60' : 'cursor-pointer'}`}
      >
        <span
          className={`absolute top-0.5 left-0.5 h-6 w-6 rounded-full bg-white shadow transition-transform ${
            checked ? 'translate-x-5' : 'translate-x-0'
          }`}
        />
      </button>
    </div>
  )
}

export default function CookiePreferencesModal() {
  const { showPreferences, consent, savePreferences, closePreferences, acceptAll } = useCookieConsent()
  const { t } = useTranslation()
  const { prefs } = useLocale()
  const [functional, setFunctional] = useState(false)
  const [analytics, setAnalytics] = useState(false)

  useEffect(() => {
    if (showPreferences) {
      setFunctional(consent.functional)
      setAnalytics(consent.analytics)
    }
  }, [showPreferences, consent.functional, consent.analytics])

  return (
    <AnimatePresence>
      {showPreferences && (
        <div className="fixed inset-0 z-[70] flex items-end justify-center p-4 sm:items-center">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-primary/50 backdrop-blur-sm"
            onClick={closePreferences}
          />
          <motion.div
            role="dialog"
            aria-labelledby="cookie-prefs-title"
            initial={prefs.reduceMotion ? false : { opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            exit={prefs.reduceMotion ? false : { opacity: 0, y: 40 }}
            className="relative max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-surface p-6 shadow-xl"
          >
            <div className="mb-4 flex items-start justify-between gap-3">
              <h2 id="cookie-prefs-title" className="font-display text-xl font-semibold text-primary">
                {t('cookies.prefsTitle')}
              </h2>
              <button
                type="button"
                onClick={closePreferences}
                className="rounded-lg p-1.5 text-muted hover:bg-background hover:text-primary"
                aria-label={t('cookies.close')}
              >
                <X size={20} />
              </button>
            </div>

            <p className="mb-5 text-sm text-muted">
              {t('cookies.prefsDesc')}{' '}
              <Link to="/privacy" className="font-semibold text-accent hover:underline">
                {t('cookies.privacyLink')}
              </Link>
            </p>

            <div className="space-y-3">
              <Toggle
                id="cookie-essential"
                label={t('cookies.essentialTitle')}
                description={t('cookies.essentialDesc')}
                checked
                disabled
                onChange={() => {}}
              />
              <Toggle
                id="cookie-functional"
                label={t('cookies.functionalTitle')}
                description={t('cookies.functionalDesc')}
                checked={functional}
                onChange={setFunctional}
              />
              <Toggle
                id="cookie-analytics"
                label={t('cookies.analyticsTitle')}
                description={t('cookies.analyticsDesc')}
                checked={analytics}
                onChange={setAnalytics}
              />
            </div>

            <div className="mt-6 flex flex-col gap-2 sm:flex-row">
              <Button
                type="button"
                variant="accent"
                className="flex-1"
                onClick={() => savePreferences({ functional, analytics })}
              >
                {t('cookies.savePrefs')}
              </Button>
              <Button type="button" variant="outline" className="flex-1" onClick={acceptAll}>
                {t('cookies.acceptAll')}
              </Button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}
