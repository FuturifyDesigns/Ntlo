import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Bell } from 'lucide-react'
import { useNotifications } from '../../hooks/useNotifications'
import { useTranslation } from '../../hooks/useTranslation'
import { useAuth } from '../../hooks/useAuth'
import { navigateToNotification } from '../../lib/notifications'
import NotificationDetailModal from '../notifications/NotificationDetailModal'

export default function NotificationBell() {
  const { t } = useTranslation()
  const { profile } = useAuth()
  const navigate = useNavigate()
  const { items, unreadCount, readOne, readAll } = useNotifications()
  const [open, setOpen] = useState(false)
  const [selectedId, setSelectedId] = useState(null)
  const [busy, setBusy] = useState(false)
  const ref = useRef(null)

  const selected = items.find((item) => item.id === selectedId) || null

  useEffect(() => {
    function onDocClick(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', onDocClick)
    return () => document.removeEventListener('mousedown', onDocClick)
  }, [])

  async function openNotification(n) {
    setSelectedId(n.id)
    setOpen(false)
    if (!n.read_at) {
      try {
        await readOne(n.id)
      } catch {
        // Modal still opens; user can retry via View.
      }
    }
  }

  async function closeModal() {
    const current = selected
    setSelectedId(null)
    setBusy(false)
    if (current?.id && !current.read_at) {
      try {
        await readOne(current.id)
      } catch {
        // Already attempted on open; ignore.
      }
    }
  }

  async function handleView(notification) {
    setBusy(true)
    try {
      if (!notification.read_at) {
        await readOne(notification.id)
      }
      setSelectedId(null)
      navigateToNotification(navigate, notification, profile?.role)
    } finally {
      setBusy(false)
    }
  }

  return (
    <>
      <div className="relative" ref={ref}>
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="relative rounded-lg p-2 text-muted transition-colors hover:bg-background hover:text-primary"
          aria-label={t('notifications.title')}
        >
          <Bell size={20} />
          {unreadCount > 0 && (
            <span className="absolute right-1 top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-accent px-1 text-[10px] font-bold text-primary">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </button>

        {open && (
          <div className="absolute right-0 z-50 mt-2 w-80 max-w-[calc(100vw-2rem)] overflow-hidden rounded-xl border border-border bg-surface shadow-xl">
            <div className="flex items-center justify-between border-b border-border px-4 py-3">
              <p className="text-sm font-semibold text-primary">{t('notifications.title')}</p>
              {unreadCount > 0 && (
                <button type="button" onClick={() => readAll()} className="text-xs font-medium text-accent hover:underline">
                  {t('notifications.markAllRead')}
                </button>
              )}
            </div>
            <div className="max-h-80 overflow-y-auto">
              {items.length === 0 ? (
                <p className="px-4 py-6 text-center text-sm text-muted">{t('notifications.empty')}</p>
              ) : (
                items.map((n) => (
                  <button
                    key={n.id}
                    type="button"
                    onClick={() => openNotification(n)}
                    className={`block w-full border-b border-border/60 px-4 py-3 text-left transition-colors hover:bg-background ${
                      n.read_at ? 'opacity-75' : 'bg-accent/5'
                    }`}
                  >
                    <p className="text-sm font-medium text-primary">{n.title}</p>
                    {n.body && <p className="mt-0.5 line-clamp-2 text-xs text-muted">{n.body}</p>}
                    <p className="mt-1 text-[10px] text-muted">{new Date(n.created_at).toLocaleString()}</p>
                  </button>
                ))
              )}
            </div>
          </div>
        )}
      </div>

      <NotificationDetailModal
        open={Boolean(selected)}
        notification={selected}
        onClose={closeModal}
        onView={handleView}
        busy={busy}
      />
    </>
  )
}
