import { useLocation } from 'react-router-dom'
import { useOnboarding } from '../context/OnboardingContext'

/** Returns true when a nav link should be highlighted as the next onboarding destination. */
export function useOnboardingNavHighlight(path) {
  const location = useLocation()
  const { actionOnboardingPage, tourOpen, remainingOnboardingPages } = useOnboarding()

  if (tourOpen || !actionOnboardingPage || remainingOnboardingPages.length === 0) {
    return false
  }

  if (path !== actionOnboardingPage.path) return false

  if (actionOnboardingPage.pageKey === 'student_listing') {
    return !/^\/listings\/[^/]+$/.test(location.pathname)
  }

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
