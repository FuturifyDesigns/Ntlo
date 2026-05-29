import { isAnalyticsAllowed } from './cookies'

const QUEUE_KEY = 'ntlo_analytics_queue'
const MAX_EVENTS = 100

function readQueue() {
  try {
    const raw = localStorage.getItem(QUEUE_KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

function writeQueue(events) {
  localStorage.setItem(QUEUE_KEY, JSON.stringify(events.slice(-MAX_EVENTS)))
}

export function initAnalytics() {
  if (!isAnalyticsAllowed()) return
  trackPageView(window.location.pathname + window.location.hash)
}

export function trackPageView(path) {
  if (!isAnalyticsAllowed()) return

  const event = {
    type: 'page_view',
    path,
    at: new Date().toISOString(),
  }

  writeQueue([...readQueue(), event])
  window.dispatchEvent(new CustomEvent('ntlo:analytics', { detail: event }))
}

export function getAnalyticsQueue() {
  if (!isAnalyticsAllowed()) return []
  return readQueue()
}
