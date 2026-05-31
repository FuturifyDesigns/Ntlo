import { supabase } from './supabase'
import { createDebouncer } from './queryOptim'

const subscribers = new Set()
let channel = null

const notifyAll = createDebouncer(() => {
  subscribers.forEach((cb) => {
    try {
      cb()
    } catch {
      /* ignore subscriber errors */
    }
  })
}, 750)

function ensureChannel() {
  if (channel) return
  channel = supabase
    .channel('listings-live-singleton')
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'listings' },
      () => notifyAll()
    )
    .subscribe()
}

/** One shared realtime channel for all browse/home listing hooks. */
export function subscribeListingsLive(callback) {
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

export function invalidateListingsLive() {
  notifyAll.flush()
}
