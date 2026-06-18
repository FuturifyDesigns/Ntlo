import { useLocation } from 'react-router-dom'
import { ArrowRight, Sparkles } from 'lucide-react'
import { useAuth } from '../../hooks/useAuth'
import { useTranslation } from '../../hooks/useTranslation'
import { useOnboarding } from '../../context/OnboardingContext'
import {
  getOnboardingActionPage,
  getRemainingOnboardingPages,
  isOnboardingEligible,
} from '../../lib/onboardingRoutes'
import { getAdaptiveDescriptionKey } from '../../lib/onboardingState'

export default function OnboardingContinueBanner() {
  const { t } = useTranslation()
  const { user, profile, loading: authLoading } = useAuth()
  const location = useLocation()
  const {
    tourOpen,
    completionOptions,
    startPageTour,
    actionOnboardingPage,
    remainingOnboardingPages,
    onboardingProfile,
    onboardingPageStateRef,
  } = useOnboarding()

  if (authLoading || !isOnboardingEligible(profile, user, location.pathname)) return null
  if (tourOpen || !onboardingProfile?.role) return null

  const remaining = remainingOnboardingPages.length > 0
    ? remainingOnboardingPages
    : getRemainingOnboardingPages(onboardingProfile, completionOptions)
  if (remaining.length === 0) return null

  const action = actionOnboardingPage || getOnboardingActionPage(
    onboardingProfile,
    location.pathname,
    onboardingProfile.role,
    completionOptions,
  )
  if (!action) return null

  const descriptionKey = getAdaptiveDescriptionKey(action.pageKey, onboardingPageStateRef)
    || action.descriptionKey

  return (
    <div className="relative z-30 border-b border-accent/40 bg-accent/10 px-4 py-3.5">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3">
        <div className="flex min-w-0 items-start gap-2.5">
          <Sparkles size={18} className="mt-0.5 shrink-0 text-accent" />
          <div className="space-y-1">
            <p className="text-sm font-bold text-primary">{t('onboarding.continueTitle')}</p>
            <p className="text-sm text-muted">
              {t('onboarding.continueRemaining')}{' '}
              {remaining.map((page, index) => (
                <span key={page.pageKey}>
                  {index > 0 && ', '}
                  <button
                    type="button"
                    onClick={() => startPageTour(page.pageKey)}
                    className="font-bold text-primary underline decoration-accent decoration-2 underline-offset-2 hover:text-accent"
                  >
                    {t(page.pageLabelKey)}
                  </button>
                </span>
              ))}
            </p>
            <p className="text-xs text-muted">{t(descriptionKey)}</p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => startPageTour(action.pageKey)}
          className="inline-flex shrink-0 items-center gap-1.5 rounded-lg bg-primary px-4 py-2.5 text-sm font-bold text-white shadow-sm transition-opacity hover:opacity-90"
        >
          {t(action.actionKey)}
          <ArrowRight size={14} />
        </button>
      </div>
    </div>
  )
}
