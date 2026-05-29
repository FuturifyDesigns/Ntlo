import { useEffect, useRef } from 'react'
import { useAuth } from './useAuth'

/** Clears accidental sessions (e.g. from email verify link) on auth pages */
export function useAuthPageSession() {
  const { user, signOut, loading } = useAuth()
  const cleared = useRef(false)

  useEffect(() => {
    if (loading || !user || cleared.current) return
    cleared.current = true
    signOut().catch(() => {
      cleared.current = false
    })
  }, [loading, user, signOut])
}

/** Resets Google redirect loading if user returns without leaving the page */
export function useResetGoogleLoading(setGoogleLoading) {
  useEffect(() => {
    setGoogleLoading(false)
    sessionStorage.removeItem('ntlo_oauth_pending')
  }, [setGoogleLoading])
}
