import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { useAuth } from '../hooks/useAuth'
import { fetchNotifications, markNotificationRead, markAllNotificationsRead } from '../lib/notifications'
import { subscribeNotificationInserts, subscribeNotificationUpdates } from '../lib/notificationsLiveBus'

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

    const unsubInsert = subscribeNotificationInserts(user.id, (notification) => {
      setItems((prev) => [notification, ...prev.filter((n) => n.id !== notification.id)])
    })
    const unsubUpdate = subscribeNotificationUpdates(user.id, (notification) => {
      setItems((prev) => prev.map((n) => (n.id === notification.id ? notification : n)))
    })

    return () => {
      unsubInsert()
      unsubUpdate()
    }
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
