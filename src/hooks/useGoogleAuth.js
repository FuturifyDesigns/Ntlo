import { useCallback, useEffect, useState } from 'react'
import { useAuth } from './useAuth'
import { useAuthPageSession } from './useAuthPage'
import { useTranslation } from './useTranslation'
import { clearOAuthStorage, isOAuthPendingStale } from '../lib/oauthStorage'

export function useGoogleAuth({ role, onError } = {}) {
  const authReady = useAuthPageSession()
  const { signInWithGoogle } = useAuth()
  const { t } = useTranslation()
  const [loading, setLoading] = useState(false)

  const resetGoogleState = useCallback(() => {
    clearOAuthStorage()
    setLoading(false)
  }, [])

  useEffect(() => {
    if (isOAuthPendingStale()) {
      resetGoogleState()
      onError?.(t('auth.googleTimeout'))
      return
    }
    setLoading(false)
  }, [resetGoogleState, onError, t])

  useEffect(() => {
    function handlePageShow(event) {
      if (event.persisted) resetGoogleState()
    }

    window.addEventListener('pageshow', handlePageShow)
    return () => window.removeEventListener('pageshow', handlePageShow)
  }, [resetGoogleState])

  useEffect(() => {
    if (!loading) return undefined

    const timeout = window.setTimeout(() => {
      if (sessionStorage.getItem('ntlo_oauth_pending')) {
        resetGoogleState()
        onError?.(t('auth.googleTimeout'))
      }
    }, 12_000)

    return () => clearTimeout(timeout)
  }, [loading, resetGoogleState, onError, t])

  const startGoogleAuth = useCallback(async () => {
    if (!authReady || loading) return

    setLoading(true)
    try {
      await signInWithGoogle({ role })
    } catch (err) {
      resetGoogleState()
      onError?.(err.message || t('auth.googleError'))
    }
  }, [authReady, loading, role, signInWithGoogle, resetGoogleState, onError, t])

  return {
    startGoogleAuth,
    googleLoading: loading,
    authReady,
    googleDisabled: !authReady || loading,
  }
}
