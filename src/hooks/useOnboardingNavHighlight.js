import { useLocation } from 'react-router-dom'
import { useAuth } from './useAuth'
import { useOnboarding } from '../context/OnboardingContext'
import { isOnboardingEligible } from '../lib/onboardingRoutes'

/** Returns true when a nav link should be highlighted as the next onboarding destination. */
export function useOnboardingNavHighlight(path) {
  const location = useLocation()
  const { user, profile } = useAuth()
  const { actionOnboardingPage, tourOpen, remainingOnboardingPages } = useOnboarding()

  if (!isOnboardingEligible(profile, user, location.pathname)) return false
  if (tourOpen || !actionOnboardingPage || remainingOnboardingPages.length === 0) {
    return false
  }

  if (actionOnboardingPage.highlightNav === false) return false
  if (path !== actionOnboardingPage.path) return false

  return true
}

export function onboardingNavClass(isHighlighted, { active = false, darkNav = false } = {}) {
  if (!isHighlighted) return ''

  if (darkNav) {
    return '!font-bold text-white ring-2 ring-accent/70 ring-offset-2 ring-offset-black'
  }

  return active
    ? '!font-bold text-primary ring-2 ring-accent/60 ring-offset-2 ring-offset-surface'
    : '!font-bold text-primary ring-2 ring-accent/50 ring-offset-2 ring-offset-surface animate-pulse'
}
