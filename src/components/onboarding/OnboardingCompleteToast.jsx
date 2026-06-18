import { useEffect } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { CircleHelp, PartyPopper, X } from 'lucide-react'
import { useTranslation } from '../../hooks/useTranslation'
import { useLocale } from '../../context/LocaleContext'
import { useOnboarding } from '../../context/OnboardingContext'

export default function OnboardingCompleteToast() {
  const { t } = useTranslation()
  const { prefs } = useLocale()
  const { completionNotice, dismissCompletionNotice } = useOnboarding()

  useEffect(() => {
    if (!completionNotice) return undefined
    const timer = window.setTimeout(dismissCompletionNotice, 7000)
    return () => clearTimeout(timer)
  }, [completionNotice, dismissCompletionNotice])

  const title = completionNotice?.allComplete
    ? t('onboarding.tourCompleteAllTitle')
    : t('onboarding.tourCompleteTitle')
  const body = completionNotice?.allComplete
    ? t('onboarding.tourCompleteAllBody')
    : t('onboarding.tourCompleteBody')

  return (
    <AnimatePresence>
      {completionNotice && (
        <motion.div
          role="status"
          aria-live="polite"
          initial={prefs.reduceMotion ? false : { opacity: 0, y: 16, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={prefs.reduceMotion ? false : { opacity: 0, y: 8, scale: 0.98 }}
          transition={{ duration: prefs.reduceMotion ? 0 : 0.35, ease: [0.22, 1, 0.36, 1] }}
          className="fixed bottom-20 left-1/2 z-[5100] w-[min(92vw,440px)] -translate-x-1/2 md:bottom-8"
        >
          <div className="rounded-2xl border border-accent/35 bg-surface p-4 shadow-2xl">
            <div className="flex items-start gap-3">
              <span className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-accent/15 text-accent">
                {completionNotice.allComplete
                  ? <PartyPopper className="h-5 w-5" />
                  : <CircleHelp className="h-5 w-5" />}
              </span>
              <div className="min-w-0 flex-1">
                <p className="font-display text-base font-semibold text-primary">{title}</p>
                <p className="mt-1 text-sm leading-relaxed text-muted">{body}</p>
                <p className="mt-2 inline-flex items-center gap-1.5 rounded-lg border border-accent/25 bg-accent/5 px-2.5 py-1.5 text-xs font-medium text-accent">
                  <CircleHelp size={14} />
                  {t('onboarding.tourCompleteHint')}
                </p>
              </div>
              <button
                type="button"
                onClick={dismissCompletionNotice}
                className="shrink-0 rounded-lg p-1.5 text-muted hover:bg-background hover:text-primary"
                aria-label={t('onboarding.close')}
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
