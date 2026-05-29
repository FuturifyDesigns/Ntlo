import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

/** Clears stale sessions (verify link, recovery, etc.) once when an auth page loads */
export function useAuthPageSession() {
  const [ready, setReady] = useState(false)

  useEffect(() => {
    let alive = true

    async function prepareAuthPage() {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        if (!alive) return
        if (session) {
          await supabase.auth.signOut()
        }
      } catch {
        // Ignore — form can still be used
      } finally {
        if (alive) setReady(true)
      }
    }

    prepareAuthPage()
    return () => {
      alive = false
    }
  }, [])

  return ready
}
