import { supabase } from './supabase'

const insertListeners = new Map()
const updateListeners = new Map()
const channels = new Map()

function ensureChannel(userId) {
  if (channels.has(userId)) return channels.get(userId)

  const channel = supabase
    .channel(`notifications-live-${userId}`)
    .on(
      'postgres_changes',
      { event: 'INSERT', schema: 'public', table: 'notifications', filter: `user_id=eq.${userId}` },
      (payload) => {
        insertListeners.get(userId)?.forEach((cb) => {
          try {
            cb(payload.new)
          } catch {
            /* ignore */
          }
        })
      },
    )
    .on(
      'postgres_changes',
      { event: 'UPDATE', schema: 'public', table: 'notifications', filter: `user_id=eq.${userId}` },
      (payload) => {
        updateListeners.get(userId)?.forEach((cb) => {
          try {
            cb(payload.new)
          } catch {
            /* ignore */
          }
        })
      },
    )
    .subscribe()

  channels.set(userId, channel)
  return channel
}

function maybeTeardown(userId) {
  const hasInserts = insertListeners.get(userId)?.size
  const hasUpdates = updateListeners.get(userId)?.size
  if (hasInserts || hasUpdates) return

  const channel = channels.get(userId)
  if (channel) supabase.removeChannel(channel)
  channels.delete(userId)
  insertListeners.delete(userId)
  updateListeners.delete(userId)
}

function subscribe(userId, map, callback) {
  if (!userId || typeof callback !== 'function') return () => {}

  if (!map.has(userId)) map.set(userId, new Set())
  map.get(userId).add(callback)
  ensureChannel(userId)

  return () => {
    map.get(userId)?.delete(callback)
    maybeTeardown(userId)
  }
}

/** One shared realtime channel per user for notification inserts. */
export function subscribeNotificationInserts(userId, callback) {
  return subscribe(userId, insertListeners, callback)
}

/** One shared realtime channel per user for notification updates. */
export function subscribeNotificationUpdates(userId, callback) {
  return subscribe(userId, updateListeners, callback)
}
