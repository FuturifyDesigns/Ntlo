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
  getSampleListingPathFromState,
  getProfileOnboardingProgress,
  saveLocalOnboardingProgress,
  shouldBlockAutoStart,
  isOnboardingFullyComplete,
  isPageOnboardingDone,
  allRequiredPagesDone,
  isOnboardingEligible,
  mergeOnboardingProgress,
  syncSessionPagesIntoProgress,
  getMarketListingCountFromState,
} from '../lib/onboardingRoutes'
import { ONBOARDING_STEPS_BY_PAGE } from '../lib/onboardingSteps'
import { preloadMascotImages } from '../lib/mascotAssets'
import { mergePageState, resolveOnboardingSteps } from '../lib/onboardingAdapt'
import OnboardingTour from '../components/onboarding/OnboardingTour'
import OnboardingCompleteToast from '../components/onboarding/OnboardingCompleteToast'
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
  const activeTourPageKeyRef = useRef(null)
  const finalizePageRef = useRef(null)
  const suppressAutoStartUntilRef = useRef(0)
  const pendingListingNavRef = useRef(false)
  const [progressEpoch, setProgressEpoch] = useState(0)
  const [progressOverride, setProgressOverride] = useState(null)
  const [completionNotice, setCompletionNotice] = useState(null)

  useEffect(() => {
    preloadMascotImages()
  }, [])

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

  const onboardingProfile = useMemo(() => {
    if (!profile?.id) return profile
    const mergedProgress = progressOverride || getProfileOnboardingProgress(profile)
    return { ...profile, onboarding_progress: mergedProgress }
  }, [profile, progressOverride, progressEpoch])

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
    () => (onboardingActive && !tourOpen && onboardingProfile?.role
      ? getOnboardingActionPage(
        onboardingProfile,
        location.pathname,
        onboardingProfile.role,
        completionOptions,
      )
      : null),
    [onboardingActive, onboardingProfile, location.pathname, completionOptions, tourOpen]
  )

  const remainingOnboardingPages = useMemo(
    () => (onboardingActive && onboardingProfile
      ? getRemainingOnboardingPages(onboardingProfile, completionOptions)
      : []),
    [onboardingActive, onboardingProfile, completionOptions, progressEpoch]
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
    activeTourPageKeyRef.current = targetKey
    setReplayPageKey(targetKey)
    setForced(isForced)
    setTourOpen(true)
  }, [])

  const openReplay = useCallback((key) => {
    const target = key || getOnboardingPageKey(location.pathname, profile?.role)
    if (!target) return
    const progress = getProfileOnboardingProgress(profile)
    beginTour(target, { isForced: !isPageOnboardingDone(profile, target) })
  }, [location.pathname, profile, beginTour])

  const startPageTour = useCallback((targetKey) => {
    if (!isOnboardingEligible(profile, user, location.pathname)) return
    if (!targetKey || !ONBOARDING_STEPS_BY_PAGE[targetKey]) return
    const currentKey = profile?.role
      ? getOnboardingPageKey(location.pathname, profile.role)
      : null

    if (currentKey === targetKey) {
      beginTour(targetKey, { isForced: !isPageOnboardingDone(profile, targetKey) })
      return
    }

    if (targetKey === 'student_listing') {
      const samplePath = getSampleListingPathFromState(pageStateRef.current)
      if (samplePath) {
        pendingListingNavRef.current = false
        if (location.pathname === samplePath) {
          beginTour(targetKey, { isForced: !isPageOnboardingDone(profile, targetKey) })
          return
        }
        setPendingTourKey(targetKey)
        navigate(samplePath)
        return
      }
      pendingListingNavRef.current = true
      setPendingTourKey(targetKey)
      if (location.pathname !== '/listings') {
        navigate('/listings')
      }
      return
    }

    const path = getTourNavigatePath(
      targetKey,
      pageStateRef.current[targetKey] || pageStateRef.current.student_browse || {}
    )
    if (!path) return

    if (path === location.pathname && targetKey !== 'student_listing') {
      beginTour(targetKey, { isForced: !isPageOnboardingDone(profile, targetKey) })
      return
    }

    setPendingTourKey(targetKey)
    navigate(path)
  }, [profile, user, location.pathname, navigate, beginTour])

  useEffect(() => {
    const { open, forced: wasForced, pageKey: closingKey } = activeTourRef.current
    if (open && wasForced && closingKey) {
      finalizePageRef.current?.(true, closingKey)
    }
    setTourOpen(false)
    setForced(false)
    setReplayPageKey(null)
  }, [location.pathname])

  useEffect(() => {
    if (!onboardingActive || profileLoading || !profile?.id || !pageKey || !baseSteps?.length) {
      return undefined
    }
    if (tourOpen || replayPageKey || pendingTourKey) return undefined
    if (isOnboardingFullyComplete(onboardingProfile, completionOptions)) return undefined
    if (Date.now() < suppressAutoStartUntilRef.current) return undefined
    if (shouldBlockAutoStart(onboardingProfile, profile.id, pageKey, completionOptions)) return undefined

    const liveState = pageStateRef.current[pageKey]
    if (!liveState || liveState.ready === false) return undefined

    setForced(true)
    const timer = window.setTimeout(() => beginTour(pageKey, { isForced: true }), 600)
    return () => clearTimeout(timer)
  }, [onboardingActive, onboardingProfile, profile, profileLoading, pageKey, baseSteps, tourOpen, replayPageKey, pendingTourKey, pageStateVersion, location.pathname, completionOptions, beginTour])

  useEffect(() => {
    if (!pendingTourKey || !profile?.role) return undefined

    const currentKey = getOnboardingPageKey(location.pathname, profile.role)
    const onTargetPage = currentKey === pendingTourKey
      || (pendingTourKey === 'student_listing' && currentKey === 'student_listing')

    if (!onTargetPage) return undefined

    let cancelled = false
    let attempts = 0
    const maxAttempts = 40

    const tryStart = () => {
      if (cancelled) return
      const liveState = pageStateRef.current[pendingTourKey]
      const hasState = Boolean(liveState)
      const ready = liveState?.ready !== false

      if ((hasState && ready) || attempts >= maxAttempts) {
        setPendingTourKey(null)
        beginTour(pendingTourKey, { isForced: true })
        return
      }

      attempts += 1
      window.setTimeout(tryStart, 150)
    }

    const timer = window.setTimeout(tryStart, 250)
    return () => {
      cancelled = true
      clearTimeout(timer)
    }
  }, [pendingTourKey, profile, location.pathname, pageStateVersion, beginTour])

  useEffect(() => {
    if (pendingTourKey !== 'student_listing' || !pendingListingNavRef.current) return undefined
    const samplePath = getSampleListingPathFromState(pageStateRef.current)
    if (!samplePath) return undefined
    pendingListingNavRef.current = false
    if (location.pathname !== samplePath) {
      navigate(samplePath)
    }
    return undefined
  }, [pendingTourKey, pageStateVersion, location.pathname, navigate])

  const handleStepEnter = useCallback((step) => {
    if (!pageKey) return
    pageHandlersRef.current[pageKey]?.(step)
  }, [pageKey])

  const finalizePage = useCallback(async (markForced, explicitPageKey) => {
    const completingKey = explicitPageKey || activeTourPageKeyRef.current || pageKey
    if (!profile?.id || !completingKey || completingRef.current) return null
    completingRef.current = true
    try {
      markSessionPageDone(profile.id, completingKey)

      const finishOptions = {
        marketListingCount: getMarketListingCountFromState(pageStateRef.current),
      }

      let progress = syncSessionPagesIntoProgress(profile, finishOptions)
      try {
        const serverProgress = await completeOnboardingPage(completingKey)
        progress = mergeOnboardingProgress(progress, serverProgress, completingKey)
      } catch {
        progress = mergeOnboardingProgress(progress, null, completingKey)
      }

      saveLocalOnboardingProgress(profile.id, progress)

      if (
        completingKey === 'student_browse'
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

      setProgressOverride(progress)
      setProgressEpoch((n) => n + 1)

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
          setProgressOverride(merged)
          setProgressEpoch((n) => n + 1)
          patchProfile?.({
            onboarding_progress: merged,
            ...(mergedProfile.onboarding_completed_at
              ? { onboarding_completed_at: mergedProfile.onboarding_completed_at }
              : {}),
          })
          progress = merged
        }
      } catch {
        setProgressOverride(progress)
        setProgressEpoch((n) => n + 1)
        patchProfile?.({
          onboarding_progress: progress,
          ...(mergedProfile.onboarding_completed_at
            ? { onboarding_completed_at: mergedProfile.onboarding_completed_at }
            : {}),
        })
      }

      return {
        progress,
        allComplete: allRequiredPagesDone({ ...profile, onboarding_progress: progress }, finishOptions),
      }
    } finally {
      completingRef.current = false
      activeTourPageKeyRef.current = null
    }
  }, [profile, pageKey, refreshProfile, patchProfile])

  finalizePageRef.current = finalizePage

  const handleClose = useCallback(() => {
    suppressAutoStartUntilRef.current = Date.now() + 2500
    setTourOpen(false)
    setForced(false)
    setReplayPageKey(null)
    setPendingTourKey(null)
    pendingListingNavRef.current = false
    activeTourPageKeyRef.current = null
  }, [])

  const dismissCompletionNotice = useCallback(() => {
    setCompletionNotice(null)
  }, [])

  const handleComplete = useCallback(async () => {
    const completingKey = activeTourPageKeyRef.current || replayPageKey || pageKey
    if (completingKey && profile?.id) {
      markSessionPageDone(profile.id, completingKey)
      suppressAutoStartUntilRef.current = Date.now() + 12000
      const result = await finalizePage(forced, completingKey)
      if (result) {
        setCompletionNotice({
          pageKey: completingKey,
          allComplete: result.allComplete,
        })
      }
    }
    handleClose()
  }, [finalizePage, forced, handleClose, replayPageKey, pageKey, profile])

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
      onboardingProfile,
      progressEpoch,
      completionNotice,
      dismissCompletionNotice,
    }),
    [openReplay, startPageTour, registerPageHandler, registerPageState, clearPageState, pageKey, tourOpen, completionOptions, actionOnboardingPage, remainingOnboardingPages, onboardingProfile, progressEpoch, completionNotice, dismissCompletionNotice]
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
      {onboardingActive && <OnboardingCompleteToast />}
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
