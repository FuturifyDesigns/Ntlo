import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react'
import { useLocation } from 'react-router-dom'

const WelcomeReturnContext = createContext(null)

export function WelcomeReturnProvider({ children }) {
  const location = useLocation()
  const [showWelcome, setShowWelcome] = useState(false)
  const isReadyRef = useRef(false)
  const leftWhileLoadedRef = useRef(false)

  useEffect(() => {
    const timer = setTimeout(() => {
      isReadyRef.current = true
    }, 0)
    return () => clearTimeout(timer)
  }, [])

  useEffect(() => {
    function onVisibilityChange() {
      if (document.visibilityState === 'hidden') {
        if (isReadyRef.current) leftWhileLoadedRef.current = true
        return
      }

      if (
        document.visibilityState === 'visible' &&
        isReadyRef.current &&
        leftWhileLoadedRef.current &&
        location.pathname === '/'
      ) {
        setShowWelcome(true)
      }

      leftWhileLoadedRef.current = false
    }

    document.addEventListener('visibilitychange', onVisibilityChange)
    return () => document.removeEventListener('visibilitychange', onVisibilityChange)
  }, [location.pathname])

  useEffect(() => {
    if (location.pathname !== '/' && showWelcome) {
      setShowWelcome(false)
    }
  }, [location.pathname, showWelcome])

  const dismissWelcome = useCallback(() => setShowWelcome(false), [])

  return (
    <WelcomeReturnContext.Provider value={{ showWelcome, dismissWelcome }}>
      {children}
    </WelcomeReturnContext.Provider>
  )
}

export function useReturnWelcome() {
  const ctx = useContext(WelcomeReturnContext)
  if (!ctx) throw new Error('useReturnWelcome must be used within WelcomeReturnProvider')
  return ctx
}
