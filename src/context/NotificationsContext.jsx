import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'
import { fetchNotifications, markNotificationRead, markAllNotificationsRead } from '../lib/notifications'

const NotificationsContext = createContext(null)

export function NotificationsProvider({ children }) {
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

  const readOne = useCallback(async (id) => {
    const readAt = new Date().toISOString()
    await markNotificationRead(id)
    setItems((prev) => prev.map((n) => (n.id === id ? { ...n, read_at: n.read_at || readAt } : n)))
  }, [])

  const readAll = useCallback(async () => {
    const readAt = new Date().toISOString()
    await markAllNotificationsRead()
    setItems((prev) => prev.map((n) => ({ ...n, read_at: n.read_at || readAt })))
  }, [])

  const unreadCount = items.filter((n) => !n.read_at).length

  const value = useMemo(
    () => ({ items, unreadCount, loading, refetch, readOne, readAll }),
    [items, unreadCount, loading, refetch, readOne, readAll]
  )

  return (
    <NotificationsContext.Provider value={value}>
      {children}
    </NotificationsContext.Provider>
  )
}

export function useNotifications() {
  const ctx = useContext(NotificationsContext)
  if (!ctx) throw new Error('useNotifications must be used within NotificationsProvider')
  return ctx
}
