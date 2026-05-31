import { useTranslation } from '../../hooks/useTranslation'
import Modal from '../ui/Modal'
import Button from '../ui/Button'

export default function NotificationDetailModal({
  open,
  notification,
  onClose,
  onView,
  urgent = false,
  busy = false,
}) {
  const { t } = useTranslation()

  if (!notification) return null

  return (
    <Modal open={open} onClose={onClose} title={notification.title} size="md">
      {urgent && (
        <p className="mb-3 text-xs font-medium text-accent">{t('notifications.urgent')}</p>
      )}
      {notification.body && (
        <p className="whitespace-pre-wrap text-sm leading-relaxed text-muted">{notification.body}</p>
      )}
      <p className="mt-4 text-xs text-muted">
        {new Date(notification.created_at).toLocaleString()}
      </p>
      <div className="mt-6 flex flex-wrap gap-2">
        <Button type="button" onClick={() => onView(notification)} disabled={busy}>
          {t('notifications.view')}
        </Button>
        <Button type="button" variant="outline" onClick={onClose} disabled={busy}>
          {t('notifications.cancel')}
        </Button>
      </div>
    </Modal>
  )
}
