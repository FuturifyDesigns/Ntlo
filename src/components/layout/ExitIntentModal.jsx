import { Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Heart, Search, X } from 'lucide-react'
import { useExitIntent } from '../../hooks/useExitIntent'
import { useCookieConsent } from '../../context/CookieConsentContext'
import { useTranslation } from '../../hooks/useTranslation'
import { useLocale } from '../../context/LocaleContext'
import Button from '../ui/Button'

export default function ExitIntentModal() {
  const { hasDecided, showBanner } = useCookieConsent()
  const { open, stay, confirmLeave } = useExitIntent({
    enabled: hasDecided && !showBanner,
  })
  const { t } = useTranslation()
  const { prefs } = useLocale()

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[65] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-primary/60 backdrop-blur-sm"
            onClick={stay}
          />
          <motion.div
            role="dialog"
            aria-labelledby="exit-intent-title"
            aria-describedby="exit-intent-desc"
            initial={prefs.reduceMotion ? false : { opacity: 0, scale: 0.94, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={prefs.reduceMotion ? false : { opacity: 0, scale: 0.96, y: 8 }}
            transition={{ duration: prefs.reduceMotion ? 0 : 0.4, ease: [0.22, 1, 0.36, 1] }}
            className="relative w-full max-w-md overflow-hidden rounded-2xl bg-surface shadow-2xl"
          >
            <div className="h-1 bg-gradient-to-r from-transparent via-accent to-transparent" />
            <div className="p-6 sm:p-7">
              <button
                type="button"
                onClick={stay}
                className="absolute right-4 top-4 rounded-lg p-1.5 text-muted hover:bg-background hover:text-primary"
                aria-label={t('cookies.close')}
              >
                <X size={18} />
              </button>

              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-accent/15">
                <Heart className="h-7 w-7 text-accent" />
              </div>

              <h2 id="exit-intent-title" className="text-center font-display text-2xl font-bold text-primary">
                {t('exit.title')}
              </h2>
              <p id="exit-intent-desc" className="mt-3 text-center text-sm leading-relaxed text-muted sm:text-base">
                {t('exit.desc')}
              </p>

              <ul className="mt-4 space-y-2 rounded-xl bg-background p-4 text-sm text-muted">
                <li className="flex items-start gap-2">
                  <Search className="mt-0.5 h-4 w-4 shrink-0 text-accent" />
                  {t('exit.point1')}
                </li>
                <li className="flex items-start gap-2">
                  <span className="mt-0.5 text-accent">✓</span>
                  {t('exit.point2')}
                </li>
                <li className="flex items-start gap-2">
                  <span className="mt-0.5 text-accent">✓</span>
                  {t('exit.point3')}
                </li>
              </ul>

              <div className="mt-6 flex flex-col gap-2.5">
                <Button as={Link} to="/listings" variant="accent" className="w-full" onClick={stay}>
                  {t('exit.stay')}
                </Button>
                <Button type="button" variant="outline" className="w-full" onClick={confirmLeave}>
                  {t('exit.leave')}
                </Button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}
