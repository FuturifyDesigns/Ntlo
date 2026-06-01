import { useCallback, useEffect, useState } from 'react'
import { useAuth } from '../../hooks/useAuth'
import { needsOnboarding } from '../../lib/onboarding'
import OnboardingTour from './OnboardingTour'

export default function DashboardOnboarding({
  steps,
  onStepEnter,
  children,
}) {
  const { profile, profileLoading, refreshProfile } = useAuth()
  const [tourOpen, setTourOpen] = useState(false)
  const [forced, setForced] = useState(false)

  useEffect(() => {
    if (profileLoading || !profile) return
    if (needsOnboarding(profile)) {
      setForced(true)
      const t = window.setTimeout(() => setTourOpen(true), 400)
      return () => clearTimeout(t)
    }
    return undefined
  }, [profile, profileLoading])

  const openReplay = useCallback(() => {
    setForced(false)
    setTourOpen(true)
  }, [])

  const handleClose = useCallback(() => {
    setTourOpen(false)
    setForced(false)
  }, [])

  const handleComplete = useCallback(async () => {
    await refreshProfile?.()
  }, [refreshProfile])

  return (
    <>
      {children({ openReplay })}
      <OnboardingTour
        steps={steps}
        open={tourOpen}
        forced={forced}
        onClose={handleClose}
        onComplete={handleComplete}
        onStepEnter={onStepEnter}
      />
    </>
  )
}
