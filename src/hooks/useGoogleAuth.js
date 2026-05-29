import { useCallback, useEffect, useRef, useState } from 'react'
import { flushSync } from 'react-dom'
import { useAuth } from './useAuth'
import { useAuthPageSession } from './useAuthPage'
import { useTranslation } from './useTranslation'
import { clearOAuthStorage, isOAuthPendingStale } from '../lib/oauthStorage'

export const GOOGLE_REDIRECT_KEY = 'ntlo_google_redirecting'

async function waitForAuthReady(authReadyRef, maxMs = 8000) {
  const started = Date.now()
  while (!authReadyRef.current) {
    if (Date.now() - started > maxMs) {
      throw new Error('Auth page is still loading. Please try again.')
    }
    await new Promise((resolve) => setTimeout(resolve, 50))
  }
}

function paintBeforeRedirect() {
  return new Promise((resolve) => {
    requestAnimationFrame(() => {
      requestAnimationFrame(resolve)
    })
  })
}

export function useGoogleAuth({ role, onError } = {}) {
  const authReady = useAuthPageSession()
  const authReadyRef = useRef(authReady)
  const { signInWithGoogle } = useAuth()
  const { t } = useTranslation()
  const [loading, setLoading] = useState(
    () => sessionStorage.getItem(GOOGLE_REDIRECT_KEY) === '1'
  )
  const startedRedirectRef = useRef(false)

  useEffect(() => {
    authReadyRef.current = authReady
  }, [authReady])

  const resetGoogleState = useCallback(() => {
    sessionStorage.removeItem(GOOGLE_REDIRECT_KEY)
    clearOAuthStorage()
    setLoading(false)
    startedRedirectRef.current = false
  }, [])

  useEffect(() => {
    if (startedRedirectRef.current) return

    if (isOAuthPendingStale()) {
      resetGoogleState()
      onError?.(t('auth.googleTimeout'))
    }
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

    startedRedirectRef.current = true
    sessionStorage.setItem(GOOGLE_REDIRECT_KEY, '1')

    flushSync(() => {
      setLoading(true)
    })

    try {
      await waitForAuthReady(authReadyRef)
      await paintBeforeRedirect()
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
