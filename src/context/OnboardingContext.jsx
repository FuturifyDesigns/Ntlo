import {
  createContext, useCallback, useContext, useEffect, useMemo, useRef, useState,
} from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import {
  completeOnboarding,
  completeOnboardingPage,
} from '../lib/onboarding'
import {
  getOnboardingPageKey,
  markSessionPageDone,
  getOnboardingActionPage,
  getRemainingOnboardingPages,
  getTourNavigatePath,
  getProfileOnboardingProgress,
  saveLocalOnboardingProgress,
  shouldBlockAutoStart,
  isOnboardingFullyComplete,
  allRequiredPagesDone,
  isOnboardingEligible,
  mergeOnboardingProgress,
  syncSessionPagesIntoProgress,
  getMarketListingCountFromState,
} from '../lib/onboardingRoutes'
import { ONBOARDING_STEPS_BY_PAGE } from '../lib/onboardingSteps'
import { mergePageState, resolveOnboardingSteps } from '../lib/onboardingAdapt'
import OnboardingTour from '../components/onboarding/OnboardingTour'
import OnboardingHelpButton from '../components/onboarding/OnboardingHelpButton'

const OnboardingContext = createContext(null)

export function OnboardingProvider({ children }) {
  const { user, profile, profileLoading, refreshProfile, patchProfile } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()
  const [tourOpen, setTourOpen] = useState(false)
  const [forced, setForced] = useState(false)
  const [replayPageKey, setReplayPageKey] = useState(null)
  const [pendingTourKey, setPendingTourKey] = useState(null)
  const [pageStateVersion, setPageStateVersion] = useState(0)
  const completingRef = useRef(false)
  const pageHandlersRef = useRef({})
  const pageStateRef = useRef({})
  const activeTourRef = useRef({ open: false, forced: false, pageKey: null })
  const finalizePageRef = useRef(null)

  const pageKey = profile?.role
    ? (replayPageKey || getOnboardingPageKey(location.pathname, profile.role))
    : null

  activeTourRef.current = { open: tourOpen, forced, pageKey }

  const baseSteps = pageKey ? ONBOARDING_STEPS_BY_PAGE[pageKey] : null

  const steps = useMemo(() => {
    if (!pageKey || !baseSteps) return []
    const state = pageStateRef.current[pageKey] || {}
    return resolveOnboardingSteps(baseSteps, state, {
      ignoreReady: Boolean(replayPageKey),
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pageKey, baseSteps, pageStateVersion, replayPageKey])

  const tourSteps = useMemo(() => {
    if (steps.length > 0) return steps
    if (!tourOpen || !pageKey || !baseSteps?.length) return []
    return resolveOnboardingSteps(
      baseSteps,
      pageStateRef.current[pageKey] || {},
      { ignoreReady: true }
    )
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [steps, tourOpen, pageKey, baseSteps, pageStateVersion, replayPageKey])

  const completionOptions = useMemo(() => ({
    marketListingCount: pageStateRef.current.student_dashboard?.marketListingCount
      ?? pageStateRef.current.student_browse?.listingCount
      ?? 0,
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }), [pageStateVersion])

  const onboardingActive = isOnboardingEligible(profile, user, location.pathname)

  useEffect(() => {
    if (!profile?.id || profileLoading) return
    const finishOptions = {
      marketListingCount: getMarketListingCountFromState(pageStateRef.current),
    }
    const synced = syncSessionPagesIntoProgress(profile, finishOptions)
    const current = getProfileOnboardingProgress(profile)
    const changed = Object.keys(synced).some((key) => synced[key] !== current[key])
    if (!changed) return

    saveLocalOnboardingProgress(profile.id, synced)
    patchProfile?.({ onboarding_progress: synced })

    if (allRequiredPagesDone({ ...profile, onboarding_progress: synced }, finishOptions)) {
      completeOnboarding()
        .then(() => patchProfile?.({
          onboarding_progress: synced,
          onboarding_completed_at: profile.onboarding_completed_at || new Date().toISOString(),
        }))
        .catch(() => patchProfile?.({
          onboarding_progress: synced,
          onboarding_completed_at: new Date().toISOString(),
        }))
    }
  }, [profile, profileLoading, pageStateVersion, patchProfile])

  const actionOnboardingPage = useMemo(
    () => (onboardingActive && !tourOpen
      ? getOnboardingActionPage(profile, location.pathname, profile.role, completionOptions)
      : null),
    [onboardingActive, profile, location.pathname, completionOptions, tourOpen]
  )

  const remainingOnboardingPages = useMemo(
    () => (onboardingActive
      ? getRemainingOnboardingPages(profile, completionOptions)
      : []),
    [onboardingActive, profile, completionOptions]
  )

  const registerPageState = useCallback((key, partial) => {
    if (!key) return
    pageStateRef.current[key] = mergePageState(pageStateRef.current[key], partial)
    setPageStateVersion((v) => v + 1)
  }, [])

  const clearPageState = useCallback((key) => {
    if (!key) return
    delete pageStateRef.current[key]
    setPageStateVersion((v) => v + 1)
  }, [])

  const registerPageHandler = useCallback((key, handler) => {
    pageHandlersRef.current[key] = handler
    return () => {
      if (pageHandlersRef.current[key] === handler) {
        delete pageHandlersRef.current[key]
      }
    }
  }, [])

  const beginTour = useCallback((targetKey, { isForced = false } = {}) => {
    if (!targetKey || !ONBOARDING_STEPS_BY_PAGE[targetKey]) return
    setReplayPageKey(targetKey)
    setForced(isForced)
    setTourOpen(true)
  }, [])

  const openReplay = useCallback((key) => {
    const target = key || getOnboardingPageKey(location.pathname, profile?.role)
    beginTour(target, { isForced: false })
  }, [location.pathname, profile?.role, beginTour])

  const startPageTour = useCallback((targetKey) => {
    if (!isOnboardingEligible(profile, user, location.pathname)) return
    if (!targetKey || !ONBOARDING_STEPS_BY_PAGE[targetKey]) return
    const currentKey = profile?.role
      ? getOnboardingPageKey(location.pathname, profile.role)
      : null

    if (currentKey === targetKey) {
      beginTour(targetKey, { isForced: false })
      return
    }

    if (targetKey === 'student_listing' && currentKey === 'student_browse') {
      const samplePath = pageStateRef.current.student_browse?.sampleListingPath
      if (samplePath) {
        setPendingTourKey(targetKey)
        navigate(samplePath)
        return
      }
    }

    const path = getTourNavigatePath(
      targetKey,
      pageStateRef.current[targetKey] || pageStateRef.current.student_browse || {}
    )
    if (!path) return

    if (path === location.pathname && targetKey !== 'student_listing') {
      beginTour(targetKey, { isForced: false })
      return
    }

    setPendingTourKey(targetKey)
    navigate(path)
  }, [profile, user, location.pathname, navigate, beginTour])

  useEffect(() => {
    const { open, forced: wasForced, pageKey: closingKey } = activeTourRef.current
    if (open && wasForced && closingKey) {
      finalizePageRef.current?.(true)
    }
    setTourOpen(false)
    setForced(false)
    setReplayPageKey(null)
  }, [location.pathname])

  useEffect(() => {
    if (!onboardingActive || profileLoading || !profile?.id || !pageKey || !baseSteps?.length) {
      return undefined
    }
    if (replayPageKey || pendingTourKey) return undefined
    if (isOnboardingFullyComplete(profile, completionOptions)) return undefined
    if (shouldBlockAutoStart(profile, profile.id, pageKey, completionOptions)) return undefined

    const liveState = pageStateRef.current[pageKey]
    if (!liveState || liveState.ready === false) return undefined

    setForced(true)
    const timer = window.setTimeout(() => setTourOpen(true), 600)
    return () => clearTimeout(timer)
  }, [onboardingActive, profile, profileLoading, pageKey, baseSteps, replayPageKey, pendingTourKey, pageStateVersion, location.pathname, completionOptions])

  useEffect(() => {
    if (!pendingTourKey || !profile?.role) return undefined
    const currentKey = getOnboardingPageKey(location.pathname, profile.role)
    const onTargetPage = currentKey === pendingTourKey
      || (pendingTourKey === 'student_listing' && currentKey === 'student_listing')

    if (!onTargetPage) return undefined

    const liveState = pageStateRef.current[pendingTourKey]
    if (!liveState || liveState.ready === false) return undefined

    const timer = window.setTimeout(() => {
      setPendingTourKey(null)
      beginTour(pendingTourKey, { isForced: true })
    }, 500)
    return () => clearTimeout(timer)
  }, [pendingTourKey, profile, location.pathname, pageStateVersion, beginTour])

  const handleStepEnter = useCallback((step) => {
    if (!pageKey) return
    pageHandlersRef.current[pageKey]?.(step)
  }, [pageKey])

  const finalizePage = useCallback(async (markForced) => {
    if (!profile?.id || !pageKey || completingRef.current) return
    completingRef.current = true
    try {
      markSessionPageDone(profile.id, pageKey)

      const finishOptions = {
        marketListingCount: getMarketListingCountFromState(pageStateRef.current),
      }

      let progress = syncSessionPagesIntoProgress(profile, finishOptions)
      try {
        const serverProgress = await completeOnboardingPage(pageKey)
        progress = mergeOnboardingProgress(progress, serverProgress, pageKey)
      } catch {
        progress = mergeOnboardingProgress(progress, null, pageKey)
      }

      saveLocalOnboardingProgress(profile.id, progress)

      if (
        pageKey === 'student_browse'
        && finishOptions.marketListingCount === 0
        && !progress.student_listing
      ) {
        try {
          const listingProgress = await completeOnboardingPage('student_listing')
          progress = mergeOnboardingProgress(progress, listingProgress, 'student_listing')
        } catch {
          progress = mergeOnboardingProgress(progress, null, 'student_listing')
        }
        saveLocalOnboardingProgress(profile.id, progress)
      }

      const mergedProfile = {
        ...profile,
        onboarding_progress: progress,
      }

      if (allRequiredPagesDone(mergedProfile, finishOptions)) {
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
        const refreshed = await refreshProfile?.()
        if (refreshed) {
          const merged = {
            ...(refreshed.onboarding_progress || {}),
            ...progress,
          }
          saveLocalOnboardingProgress(profile.id, merged)
          patchProfile?.({
            onboarding_progress: merged,
            ...(mergedProfile.onboarding_completed_at
              ? { onboarding_completed_at: mergedProfile.onboarding_completed_at }
              : {}),
          })
        }
      } catch {
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

  finalizePageRef.current = finalizePage

  const handleClose = useCallback(() => {
    setTourOpen(false)
    setForced(false)
    setReplayPageKey(null)
    setPendingTourKey(null)
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
      startPageTour,
      registerPageHandler,
      registerPageState,
      clearPageState,
      currentPageKey: pageKey,
      tourOpen,
      completionOptions,
      actionOnboardingPage,
      remainingOnboardingPages,
    }),
    [openReplay, startPageTour, registerPageHandler, registerPageState, clearPageState, pageKey, tourOpen, completionOptions, actionOnboardingPage, remainingOnboardingPages]
  )

  return (
    <OnboardingContext.Provider value={value}>
      {children}
      {onboardingActive && tourOpen && tourSteps.length > 0 && (
        <OnboardingTour
          steps={tourSteps}
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

export function useOnboardingPageState(pageKey, state) {
  const { registerPageState, clearPageState } = useOnboarding()

  useEffect(() => {
    if (!pageKey) return undefined
    registerPageState(pageKey, state)
  }, [registerPageState, pageKey, state])

  useEffect(() => {
    if (!pageKey) return undefined
    return () => clearPageState(pageKey)
  }, [clearPageState, pageKey])
}

export function OnboardingReplayButton({ className = '' }) {
  const { openReplay } = useOnboarding()
  return <OnboardingHelpButton onClick={() => openReplay()} className={className} />
}
