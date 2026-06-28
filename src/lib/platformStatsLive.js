import { supabase } from './supabase'
import { createDebouncer } from './queryOptim'

const subscribers = new Set()
let channel = null

const notifyAll = createDebouncer(() => {
  subscribers.forEach((cb) => {
    try {
      cb()
    } catch {
      /* ignore */
    }
  })
}, 2000)

function ensureChannel() {
  if (channel) return

  channel = supabase
    .channel('platform-stats-live')
    .on(
      'postgres_changes',
      { event: 'INSERT', schema: 'public', table: 'profiles' },
      () => notifyAll()
    )
    .on(
      'postgres_changes',
      { event: 'DELETE', schema: 'public', table: 'profiles' },
      () => notifyAll()
    )
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'listings' },
      () => notifyAll()
    )
    .subscribe()
}

/** Debounced refresh when sign-ups or listings change (no profile UPDATE noise). */
export function subscribePlatformStats(callback) {
  subscribers.add(callback)
  ensureChannel()
  return () => {
    subscribers.delete(callback)
    if (!subscribers.size && channel) {
      supabase.removeChannel(channel)
      channel = null
    }
  }
}
