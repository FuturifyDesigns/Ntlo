import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from './useAuth'
import { fetchNotifications, markNotificationRead, markAllNotificationsRead } from '../lib/notifications'

export function useNotifications() {
  const { user } = useAuth()
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)

  const refetch = useCallback(async () => {
    if (!user) {
      setItems([])
      setLoading(false)
      return
    }
    setLoading(true)
    try {
      const data = await fetchNotifications()
      setItems(data)
    } catch {
      setItems([])
    } finally {
      setLoading(false)
    }
  }, [user])

  useEffect(() => {
    refetch()
  }, [refetch])

  useEffect(() => {
    if (!user?.id) return undefined

    const channelName = `notifications-${user.id}`

    // Drop any stale channel (e.g. duplicate mounts) before re-subscribing
    supabase.getChannels().forEach((ch) => {
      if (ch.topic === `realtime:${channelName}`) supabase.removeChannel(ch)
    })

    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'notifications', filter: `user_id=eq.${user.id}` },
        (payload) => {
          setItems((prev) => [payload.new, ...prev.filter((n) => n.id !== payload.new.id)])
        }
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'notifications', filter: `user_id=eq.${user.id}` },
        (payload) => {
          setItems((prev) => prev.map((n) => (n.id === payload.new.id ? payload.new : n)))
        }
      )
      .subscribe()

    return () => supabase.removeChannel(channel)
  }, [user?.id])

  const unreadCount = items.filter((n) => !n.read_at).length

  async function readOne(id) {
    await markNotificationRead(id)
    setItems((prev) => prev.map((n) => (n.id === id ? { ...n, read_at: new Date().toISOString() } : n)))
  }

  async function readAll() {
    await markAllNotificationsRead()
    setItems((prev) => prev.map((n) => ({ ...n, read_at: n.read_at || new Date().toISOString() })))
  }

  return { items, unreadCount, loading, refetch, readOne, readAll }
}
