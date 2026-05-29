import { useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { CheckCircle2, Cookie, Info, X } from 'lucide-react'
import { useCookieConsent } from '../../context/CookieConsentContext'
import { useTranslation } from '../../hooks/useTranslation'
import { useLocale } from '../../context/LocaleContext'

const icons = {
  accepted_all: CheckCircle2,
  essential_only: Info,
  saved_custom: Cookie,
}

export default function CookieFeedbackToast() {
  const { feedback, clearFeedback } = useCookieConsent()
  const { t } = useTranslation()
  const { prefs } = useLocale()

  useEffect(() => {
    if (!feedback) return undefined
    const timer = setTimeout(clearFeedback, 4500)
    return () => clearTimeout(timer)
  }, [feedback, clearFeedback])

  const Icon = feedback ? icons[feedback.type] || Cookie : Cookie
  const message = feedback ? t(`cookies.feedback.${feedback.type}`) : ''

  return (
    <AnimatePresence>
      {feedback && (
        <motion.div
          role="status"
          aria-live="polite"
          initial={prefs.reduceMotion ? false : { opacity: 0, y: 16, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={prefs.reduceMotion ? false : { opacity: 0, y: 8, scale: 0.98 }}
          transition={{ duration: prefs.reduceMotion ? 0 : 0.35, ease: [0.22, 1, 0.36, 1] }}
          className="fixed bottom-20 left-1/2 z-[75] w-[min(92vw,420px)] -translate-x-1/2 md:bottom-8"
        >
          <div className="flex items-start gap-3 rounded-2xl border border-accent/30 bg-primary px-4 py-3.5 shadow-xl">
            <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-accent/15 text-accent">
              <Icon className="h-5 w-5" />
            </span>
            <p className="flex-1 pt-1.5 text-sm leading-snug text-white">{message}</p>
            <button
              type="button"
              onClick={clearFeedback}
              className="shrink-0 rounded-lg p-1.5 text-white/50 hover:bg-white/10 hover:text-white"
              aria-label={t('cookies.close')}
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
