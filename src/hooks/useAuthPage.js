import { useEffect, useState } from 'react'
import { useAuth } from './useAuth'

/** Clears stale sessions (verify link, recovery, etc.) before auth forms run */
export function useAuthPageSession() {
  const { signOut } = useAuth()
  const [ready, setReady] = useState(false)

  useEffect(() => {
    let alive = true
    signOut()
      .catch(() => {})
      .finally(() => {
        if (alive) setReady(true)
      })
    return () => {
      alive = false
    }
  }, [signOut])

  return ready
}

/** Resets Google redirect loading if user returns without leaving the page */
export function useResetGoogleLoading(setGoogleLoading) {
  useEffect(() => {
    setGoogleLoading(false)
    sessionStorage.removeItem('ntlo_oauth_pending')
  }, [setGoogleLoading])
}
