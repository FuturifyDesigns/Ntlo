import {
  createContext, useCallback, useContext, useEffect, useMemo, useRef, useState,
} from 'react'
import { useLocation } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import {
  completeOnboarding, completeOnboardingPage, allRequiredPagesDone,
} from '../lib/onboarding'
import {
  getOnboardingPageKey,
  isPageOnboardingDone,
  markSessionPageDone,
  sessionPageDone,
} from '../lib/onboardingRoutes'
import { ONBOARDING_STEPS_BY_PAGE } from '../lib/onboardingSteps'
import OnboardingTour from '../components/onboarding/OnboardingTour'
import OnboardingHelpButton from '../components/onboarding/OnboardingHelpButton'

const OnboardingContext = createContext(null)

export function OnboardingProvider({ children }) {
  const { profile, profileLoading, refreshProfile, patchProfile } = useAuth()
  const location = useLocation()
  const [tourOpen, setTourOpen] = useState(false)
  const [forced, setForced] = useState(false)
  const [replayPageKey, setReplayPageKey] = useState(null)
  const completingRef = useRef(false)
  const pageHandlersRef = useRef({})

  const pageKey = profile?.role
    ? (replayPageKey || getOnboardingPageKey(location.pathname, profile.role))
    : null

  const steps = pageKey ? ONBOARDING_STEPS_BY_PAGE[pageKey] : null

  const registerPageHandler = useCallback((key, handler) => {
    pageHandlersRef.current[key] = handler
    return () => {
      if (pageHandlersRef.current[key] === handler) {
        delete pageHandlersRef.current[key]
      }
    }
  }, [])

  const openReplay = useCallback((key) => {
    const target = key || getOnboardingPageKey(location.pathname, profile?.role)
    if (!target || !ONBOARDING_STEPS_BY_PAGE[target]) return
    setReplayPageKey(target)
    setForced(false)
    setTourOpen(true)
  }, [location.pathname, profile?.role])

  useEffect(() => {
    if (profileLoading || !profile?.id || !pageKey || !steps?.length) return undefined
    if (replayPageKey) return undefined
    if (isPageOnboardingDone(profile, pageKey)) return undefined
    if (sessionPageDone(profile.id, pageKey)) return undefined

    setForced(true)
    const timer = window.setTimeout(() => setTourOpen(true), 500)
    return () => clearTimeout(timer)
  }, [profile, profileLoading, pageKey, steps, replayPageKey])

  useEffect(() => {
    if (!tourOpen) setReplayPageKey(null)
  }, [tourOpen])

  const handleStepEnter = useCallback((step) => {
    if (!pageKey) return
    pageHandlersRef.current[pageKey]?.(step)
  }, [pageKey])

  const finalizePage = useCallback(async (markForced) => {
    if (!profile?.id || !pageKey || completingRef.current) return
    completingRef.current = true
    try {
      markSessionPageDone(profile.id, pageKey)

      let progress = profile.onboarding_progress || {}
      try {
        progress = await completeOnboardingPage(pageKey)
      } catch {
        progress = { ...progress, [pageKey]: new Date().toISOString() }
      }

      const mergedProfile = {
        ...profile,
        onboarding_progress: progress,
      }

      if (markForced && allRequiredPagesDone(mergedProfile)) {
        try {
          await completeOnboarding()
          mergedProfile.onboarding_completed_at = new Date().toISOString()
        } catch {
          mergedProfile.onboarding_completed_at = new Date().toISOString()
        }
      }

      patchProfile?.({
        onboarding_progress: progress,
        ...(mergedProfile.onboarding_completed_at
          ? { onboarding_completed_at: mergedProfile.onboarding_completed_at }
          : {}),
      })

      try {
        await refreshProfile?.()
      } finally {
        // Keep local progress if DB migration is not applied yet.
        patchProfile?.({
          onboarding_progress: progress,
          ...(mergedProfile.onboarding_completed_at
            ? { onboarding_completed_at: mergedProfile.onboarding_completed_at }
            : {}),
        })
      }
    } finally {
      completingRef.current = false
    }
  }, [profile, pageKey, refreshProfile, patchProfile])

  const handleClose = useCallback(() => {
    setTourOpen(false)
    setForced(false)
    setReplayPageKey(null)
  }, [])

  const handleComplete = useCallback(async () => {
    if (forced) {
      await finalizePage(true)
    }
    handleClose()
  }, [finalizePage, forced, handleClose])

  const value = useMemo(
    () => ({
      openReplay,
      registerPageHandler,
      currentPageKey: pageKey,
      tourOpen,
    }),
    [openReplay, registerPageHandler, pageKey, tourOpen]
  )

  return (
    <OnboardingContext.Provider value={value}>
      {children}
      {steps && (
        <OnboardingTour
          steps={steps}
          open={tourOpen}
          forced={forced}
          onClose={handleClose}
          onComplete={handleComplete}
          onStepEnter={handleStepEnter}
        />
      )}
    </OnboardingContext.Provider>
  )
}

export function useOnboarding() {
  const ctx = useContext(OnboardingContext)
  if (!ctx) throw new Error('useOnboarding must be used within OnboardingProvider')
  return ctx
}

export function OnboardingReplayButton({ className = '' }) {
  const { openReplay } = useOnboarding()
  return <OnboardingHelpButton onClick={() => openReplay()} className={className} />
}
