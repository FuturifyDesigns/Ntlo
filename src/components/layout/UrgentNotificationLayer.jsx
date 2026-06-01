import { useEffect, useState, useCallback, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../hooks/useAuth'
import { useNotifications } from '../../hooks/useNotifications'
import { navigateToNotification } from '../../lib/notifications'
import { playNotificationSound } from '../../lib/notificationSound'
import NotificationDetailModal from '../notifications/NotificationDetailModal'

export const URGENT_NOTIFICATION_TYPES = new Set([
  'application_submitted',
  'application_accepted',
  'application_rejected',
  'application_withdrawn',
  'application_changes_requested',
  'viewing_request',
  'viewing_confirmed',
  'viewing_declined',
  'viewing_cancelled',
  'message',
  'admin_listing_review',
  'listing_approved',
  'listing_rejected',
  'listing_changes_requested',
  'listing_admin_removed',
  'account_unbanned',
])

export function isUrgentNotification(notification) {
  return Boolean(notification?.is_urgent || URGENT_NOTIFICATION_TYPES.has(notification?.type))
}

export function useUrgentNotificationToasts() {
  const { user, profile } = useAuth()
  const { readOne } = useNotifications()
  const [toasts, setToasts] = useState([])
  const dismissedRef = useRef(new Set())

  const pushToast = useCallback((notification) => {
    if (notification?.type === 'account_banned') return
    if (notification?.read_at) return
    if (!isUrgentNotification(notification)) return
    if (dismissedRef.current.has(notification.id)) return
    playNotificationSound(notification.id)
    setToasts((prev) => {
      if (prev.some((item) => item.id === notification.id)) return prev
      return [notification, ...prev].slice(0, 3)
    })
  }, [])

  const dismiss = useCallback((id) => {
    dismissedRef.current.add(id)
    setToasts((prev) => prev.filter((item) => item.id !== id))
  }, [])

  const acknowledge = useCallback(async (notification) => {
    if (!notification?.id) return
    dismiss(notification.id)
    if (!notification.read_at) {
      try {
        await readOne(notification.id)
      } catch {
        // Still dismissed locally; retry on next explicit open if needed.
      }
    }
  }, [dismiss, readOne])

  useEffect(() => {
    if (!user?.id) return undefined

    async function loadUnreadUrgent() {
      const { data } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user.id)
        .is('read_at', null)
        .order('created_at', { ascending: false })
        .limit(12)

      if (!data?.length) return

      data
        .filter((notification) => isUrgentNotification(notification) && !dismissedRef.current.has(notification.id))
        .forEach((notification) => pushToast(notification))
    }

    loadUnreadUrgent()

    const channelName = `urgent-toast-${user.id}`
    supabase.getChannels().forEach((ch) => {
      if (ch.topic === `realtime:${channelName}`) supabase.removeChannel(ch)
    })

    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'notifications', filter: `user_id=eq.${user.id}` },
        (payload) => pushToast(payload.new)
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'notifications', filter: `user_id=eq.${user.id}` },
        (payload) => {
          if (payload.new.read_at) {
            dismissedRef.current.add(payload.new.id)
            setToasts((prev) => prev.filter((item) => item.id !== payload.new.id))
          }
        }
      )
      .subscribe()

    return () => supabase.removeChannel(channel)
  }, [user?.id, pushToast])

  return { toasts, dismiss, acknowledge, role: profile?.role }
}

export default function UrgentNotificationLayer() {
  const navigate = useNavigate()
  const { toasts, acknowledge, role } = useUrgentNotificationToasts()
  const [busy, setBusy] = useState(false)
  const active = toasts[0]

  async function handleView(notification) {
    setBusy(true)
    try {
      await acknowledge(notification)
      navigateToNotification(navigate, notification, role)
    } finally {
      setBusy(false)
    }
  }

  async function handleClose(notification) {
    if (!notification) return
    setBusy(true)
    try {
      await acknowledge(notification)
    } finally {
      setBusy(false)
    }
  }

  return (
    <NotificationDetailModal
      open={Boolean(active)}
      notification={active}
      urgent
      busy={busy}
      onClose={() => handleClose(active)}
      onView={handleView}
    />
  )
}
