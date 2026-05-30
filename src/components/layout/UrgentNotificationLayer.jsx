import { useEffect, useState, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { X } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../hooks/useAuth'
import { notificationHref } from '../../lib/notifications'
import { useTranslation } from '../../hooks/useTranslation'

const URGENT_TYPES = new Set([
  'application_submitted',
  'application_accepted',
  'application_rejected',
  'application_withdrawn',
  'viewing_request',
  'viewing_confirmed',
  'viewing_declined',
  'viewing_cancelled',
  'message',
])

export function useUrgentNotificationToasts() {
  const { user, profile } = useAuth()
  const [toasts, setToasts] = useState([])

  const dismiss = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }, [])

  useEffect(() => {
    if (!user?.id) return undefined

    const channelName = `urgent-toast-${user.id}`
    supabase.getChannels().forEach((ch) => {
      if (ch.topic === `realtime:${channelName}`) supabase.removeChannel(ch)
    })

    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'notifications', filter: `user_id=eq.${user.id}` },
        (payload) => {
          const n = payload.new
          const urgent = n.is_urgent || URGENT_TYPES.has(n.type)
          if (!urgent) return
          setToasts((prev) => {
            if (prev.some((x) => x.id === n.id)) return prev
            return [n, ...prev].slice(0, 4)
          })
        }
      )
      .subscribe()

    return () => supabase.removeChannel(channel)
  }, [user?.id])

  return { toasts, dismiss, role: profile?.role }
}

export default function UrgentNotificationLayer() {
  const { t } = useTranslation()
  const { toasts, dismiss, role } = useUrgentNotificationToasts()

  useEffect(() => {
    const timers = toasts.map((toast) => setTimeout(() => dismiss(toast.id), 8000))
    return () => timers.forEach(clearTimeout)
  }, [toasts, dismiss])

  if (!toasts.length) return null

  return (
    <div className="pointer-events-none fixed bottom-20 right-4 z-[110] flex w-[min(100vw-2rem,22rem)] flex-col gap-2 md:bottom-6">
      {toasts.map((n) => (
        <div
          key={n.id}
          className="pointer-events-auto rounded-xl border border-accent/40 bg-surface p-4 shadow-xl"
        >
          <div className="flex items-start gap-2">
            <div className="flex-1">
              <p className="text-xs font-semibold uppercase tracking-wide text-accent">{t('notifications.urgent')}</p>
              <p className="mt-1 text-sm font-semibold text-primary">{n.title}</p>
              {n.body && <p className="mt-0.5 line-clamp-2 text-xs text-muted">{n.body}</p>}
              <Link
                to={notificationHref(n, role)}
                onClick={() => dismiss(n.id)}
                className="mt-2 inline-block text-xs font-medium text-accent hover:underline"
              >
                {t('notifications.viewNow')}
              </Link>
            </div>
            <button
              type="button"
              onClick={() => dismiss(n.id)}
              className="rounded p-1 text-muted hover:text-primary"
              aria-label={t('notifications.dismiss')}
            >
              <X size={16} />
            </button>
          </div>
        </div>
      ))}
    </div>
  )
}
