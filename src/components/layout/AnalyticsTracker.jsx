import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { trackPageView } from '../../lib/analytics'
import { isAnalyticsAllowed } from '../../lib/cookies'

export default function AnalyticsTracker() {
  const location = useLocation()

  useEffect(() => {
    if (!isAnalyticsAllowed()) return
    trackPageView(location.pathname + location.search + location.hash)
  }, [location.pathname, location.search, location.hash])

  return null
}
