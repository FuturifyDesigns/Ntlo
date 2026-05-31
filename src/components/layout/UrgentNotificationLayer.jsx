import { useEffect, useState, useCallback, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { X } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../hooks/useAuth'
import { navigateToNotification, markNotificationRead } from '../../lib/notifications'
import { useTranslation } from '../../hooks/useTranslation'
import { useLocale } from '../../context/LocaleContext'
import Button from '../ui/Button'

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
  'account_banned',
])

export function isUrgentNotification(notification) {
  return Boolean(notification?.is_urgent || URGENT_NOTIFICATION_TYPES.has(notification?.type))
}

export function useUrgentNotificationToasts() {
  const { user, profile } = useAuth()
  const [toasts, setToasts] = useState([])
  const dismissedRef = useRef(new Set())

  const pushToast = useCallback((notification) => {
    if (!isUrgentNotification(notification)) return
    if (dismissedRef.current.has(notification.id)) return
    setToasts((prev) => {
      if (prev.some((item) => item.id === notification.id)) return prev
      return [notification, ...prev].slice(0, 3)
    })
  }, [])

  const dismiss = useCallback((id) => {
    dismissedRef.current.add(id)
    setToasts((prev) => prev.filter((item) => item.id !== id))
  }, [])

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
      .subscribe()

    return () => supabase.removeChannel(channel)
  }, [user?.id, pushToast])

  return { toasts, dismiss, role: profile?.role }
}

export default function UrgentNotificationLayer() {
  const { t } = useTranslation()
  const { prefs } = useLocale()
  const navigate = useNavigate()
  const { toasts, dismiss, role } = useUrgentNotificationToasts()
  const active = toasts[0]

  async function handleView(notification) {
    dismiss(notification.id)
    if (!notification.read_at) {
      await markNotificationRead(notification.id).catch(() => {})
    }
    navigateToNotification(navigate, notification, role)
  }

  if (!active) return null

  const motionProps = prefs.reduceMotion
    ? {}
    : {
        initial: { opacity: 0, scale: 0.96, y: 8 },
        animate: { opacity: 1, scale: 1, y: 0 },
        exit: { opacity: 0, scale: 0.98, y: 4 },
        transition: { duration: 0.22, ease: [0.22, 1, 0.36, 1] },
      }

  return (
    <AnimatePresence>
      <motion.div
        key={active.id}
        className="fixed inset-0 z-[120] flex items-center justify-center p-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: prefs.reduceMotion ? 0 : 0.2 }}
      >
        <button
          type="button"
          className="absolute inset-0 bg-primary/40 backdrop-blur-[2px]"
          aria-label={t('notifications.dismiss')}
          onClick={() => dismiss(active.id)}
        />
        <motion.div
          role="dialog"
          aria-modal="true"
          aria-labelledby="urgent-notification-title"
          className="relative w-full max-w-md rounded-2xl border border-accent/30 bg-surface p-6 shadow-2xl"
          {...motionProps}
        >
          <button
            type="button"
            onClick={() => dismiss(active.id)}
            className="absolute right-3 top-3 rounded-lg p-1.5 text-muted hover:bg-background hover:text-primary"
            aria-label={t('notifications.dismiss')}
          >
            <X size={18} />
          </button>

          <p className="text-xs font-medium text-accent">{t('notifications.urgent')}</p>
          <h2 id="urgent-notification-title" className="mt-2 pr-8 font-display text-xl font-semibold text-primary">
            {active.title}
          </h2>
          {active.body && (
            <p className="mt-2 text-sm leading-relaxed text-muted">{active.body}</p>
          )}

          <div className="mt-6 flex flex-wrap gap-2">
            <Button type="button" onClick={() => handleView(active)}>
              {t('notifications.viewNow')}
            </Button>
            <Button type="button" variant="outline" onClick={() => dismiss(active.id)}>
              {t('notifications.dismiss')}
            </Button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}
