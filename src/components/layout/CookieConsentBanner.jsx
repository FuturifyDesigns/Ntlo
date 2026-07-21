import { Cookie } from 'lucide-react'
import { Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useCookieConsent } from '../../context/CookieConsentContext'
import { useTranslation } from '../../hooks/useTranslation'
import { useLocale } from '../../context/LocaleContext'
import Button from '../ui/Button'

export default function CookieConsentBanner() {
  const { showBanner, acceptAll, rejectOptional, openPreferences } = useCookieConsent()
  const { t } = useTranslation()
  const { prefs } = useLocale()

  return (
    <AnimatePresence>
      {showBanner && (
        <motion.div
          role="dialog"
          aria-labelledby="cookie-banner-title"
          aria-describedby="cookie-banner-desc"
          initial={prefs.reduceMotion ? false : { opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          exit={prefs.reduceMotion ? false : { opacity: 0, y: 24 }}
          transition={{ duration: prefs.reduceMotion ? 0 : 0.35, ease: [0.22, 1, 0.36, 1] }}
          className="fixed inset-x-0 bottom-0 z-[60] border-t border-border bg-surface p-4 shadow-[0_-12px_40px_rgba(26,26,46,0.12)] sm:p-5 md:bottom-4 md:mx-4 md:rounded-2xl md:border"
        >
          <div className="mx-auto flex max-w-5xl flex-col gap-4 sm:flex-row sm:items-start sm:gap-6">
            <div className="flex shrink-0 items-center justify-center sm:pt-1">
              <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-accent/15 text-accent">
                <Cookie className="h-5 w-5" />
              </span>
            </div>
            <div className="min-w-0 flex-1">
              <h2 id="cookie-banner-title" className="font-display text-lg font-semibold text-primary">
                {t('cookies.bannerTitle')}
              </h2>
              <p id="cookie-banner-desc" className="mt-1.5 text-sm leading-relaxed text-muted">
                {t('cookies.bannerDesc')}{' '}
                <Link to="/privacy" className="font-semibold text-accent hover:underline">
                  {t('cookies.privacyLink')}
                </Link>
              </p>
            </div>
            <div className="flex shrink-0 flex-col gap-2 sm:w-auto sm:min-w-[220px]">
              <Button type="button" variant="accent" className="w-full" onClick={acceptAll}>
                {t('cookies.acceptAll')}
              </Button>
              <Button type="button" variant="outline" className="w-full" onClick={rejectOptional}>
                {t('cookies.rejectOptional')}
              </Button>
              <button
                type="button"
                onClick={openPreferences}
                className="text-center text-sm font-medium text-accent hover:underline"
              >
                {t('cookies.manage')}
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
