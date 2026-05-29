import { useCallback, useEffect, useRef, useState } from 'react'
import { useAuth } from './useAuth'
import { useAuthPageSession } from './useAuthPage'
import { useTranslation } from './useTranslation'
import { clearOAuthStorage, isOAuthPendingStale } from '../lib/oauthStorage'

async function waitForAuthReady(authReadyRef, maxMs = 8000) {
  const started = Date.now()
  while (!authReadyRef.current) {
    if (Date.now() - started > maxMs) {
      throw new Error('Auth page is still loading. Please try again.')
    }
    await new Promise((resolve) => setTimeout(resolve, 50))
  }
}

export function useGoogleAuth({ role, onError } = {}) {
  const authReady = useAuthPageSession()
  const authReadyRef = useRef(authReady)
  const { signInWithGoogle } = useAuth()
  const { t } = useTranslation()
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    authReadyRef.current = authReady
  }, [authReady])

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
    if (loading) return

    setLoading(true)

    try {
      await waitForAuthReady(authReadyRef)
      await signInWithGoogle({ role })
    } catch (err) {
      resetGoogleState()
      onError?.(err.message || t('auth.googleError'))
    }
  }, [loading, role, signInWithGoogle, resetGoogleState, onError, t])

  return {
    startGoogleAuth,
    googleLoading: loading,
    authReady,
    googleDisabled: loading,
  }
}
