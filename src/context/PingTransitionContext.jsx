import { createContext, useCallback, useContext, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useLocale } from './LocaleContext'

const PingTransitionContext = createContext(null)

export function PingTransitionProvider({ children }) {
  const navigate = useNavigate()
  const { prefs } = useLocale()
  const [active, setActive] = useState(false)

  const goToPing = useCallback(() => {
    if (prefs.reduceMotion) {
      navigate('/ping', { state: { pingReveal: true } })
      return
    }
    setActive(true)
    window.setTimeout(() => {
      navigate('/ping', { state: { pingReveal: true } })
      window.setTimeout(() => setActive(false), 900)
    }, 1100)
  }, [navigate, prefs.reduceMotion])

  const value = useMemo(() => ({ goToPing, transitionActive: active }), [goToPing, active])

  return (
    <PingTransitionContext.Provider value={value}>
      {children}
    </PingTransitionContext.Provider>
  )
}

export function usePingTransition() {
  const ctx = useContext(PingTransitionContext)
  if (!ctx) throw new Error('usePingTransition must be used within PingTransitionProvider')
  return ctx
}
