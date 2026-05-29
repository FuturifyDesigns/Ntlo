import { useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X } from 'lucide-react'
import { useReturnWelcome } from '../../context/WelcomeReturnContext'
import { useTranslation } from '../../hooks/useTranslation'
import { useLocale } from '../../context/LocaleContext'

const AUTO_DISMISS_MS = 4500

export default function WelcomeBackBanner() {
  const { showWelcome, dismissWelcome } = useReturnWelcome()
  const { t } = useTranslation()
  const { prefs } = useLocale()

  useEffect(() => {
    if (!showWelcome) return undefined
    const timer = setTimeout(dismissWelcome, AUTO_DISMISS_MS)
    return () => clearTimeout(timer)
  }, [showWelcome, dismissWelcome])

  return (
    <AnimatePresence>
      {showWelcome && (
        <motion.div
          role="status"
          aria-live="polite"
          initial={prefs.reduceMotion ? false : { opacity: 0, y: -24, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={prefs.reduceMotion ? false : { opacity: 0, y: -16, scale: 0.98 }}
          transition={{ duration: prefs.reduceMotion ? 0 : 0.45, ease: [0.22, 1, 0.36, 1] }}
          className="pointer-events-none fixed inset-x-0 top-[4.25rem] z-50 flex justify-center px-4 sm:top-[4.75rem]"
        >
          <div className="pointer-events-auto flex w-full max-w-md items-start gap-3 rounded-2xl border border-accent/25 bg-primary px-4 py-3.5 shadow-[0_16px_48px_-12px_rgba(26,26,46,0.45)] sm:max-w-lg sm:px-5 sm:py-4">
            <img
              src={`${import.meta.env.BASE_URL}favicon.png`}
              alt=""
              className="mt-0.5 h-10 w-10 shrink-0 rounded-xl object-contain sm:h-11 sm:w-11"
              width={44}
              height={44}
            />
            <div className="min-w-0 flex-1 pt-0.5">
              <p className="font-display text-base font-semibold text-white sm:text-lg">
                {t('home.welcomeBackTitle')}
              </p>
              <p className="mt-0.5 text-sm text-white/65">{t('home.welcomeBackSubtitle')}</p>
            </div>
            <button
              type="button"
              onClick={dismissWelcome}
              className="shrink-0 rounded-lg p-1.5 text-white/50 transition-colors hover:bg-white/10 hover:text-white"
              aria-label={t('home.welcomeBackDismiss')}
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
