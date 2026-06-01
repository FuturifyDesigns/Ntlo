import { Link } from 'react-router-dom'
import { ArrowRight, Sparkles } from 'lucide-react'
import { useAuth } from '../../hooks/useAuth'
import { useTranslation } from '../../hooks/useTranslation'
import { useOnboarding } from '../../context/OnboardingContext'
import { getNextOnboardingPage } from '../../lib/onboardingRoutes'

export default function OnboardingContinueBanner() {
  const { profile } = useAuth()
  const { t } = useTranslation()
  const { tourOpen, completionOptions } = useOnboarding()

  const next = getNextOnboardingPage(profile, completionOptions)
  if (!next || tourOpen) return null

  return (
    <div className="border-b border-accent/30 bg-accent/5 px-4 py-3">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3">
        <div className="flex min-w-0 items-start gap-2">
          <Sparkles size={18} className="mt-0.5 shrink-0 text-accent" />
          <div>
            <p className="text-sm font-semibold text-primary">{t('onboarding.continueTitle')}</p>
            <p className="text-sm text-muted">{t(next.descriptionKey)}</p>
          </div>
        </div>
        <Link
          to={next.path}
          className="inline-flex shrink-0 items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white transition-opacity hover:opacity-90"
        >
          {t(next.actionKey)}
          <ArrowRight size={14} />
        </Link>
      </div>
    </div>
  )
}
