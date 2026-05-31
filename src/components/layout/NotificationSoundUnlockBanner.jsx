import { useEffect, useState } from 'react'
import { Volume2 } from 'lucide-react'
import { useTranslation } from '../../hooks/useTranslation'
import {
  isNotificationSoundEnabled,
  unlockNotificationSound,
} from '../../lib/notificationSound'
import Button from '../ui/Button'

export default function NotificationSoundUnlockBanner() {
  const { t } = useTranslation()
  const [visible, setVisible] = useState(() => !isNotificationSoundEnabled())
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    function hide() {
      setVisible(false)
    }
    window.addEventListener('ntlo-sound-unlocked', hide)
    return () => window.removeEventListener('ntlo-sound-unlocked', hide)
  }, [])

  if (!visible) return null

  async function handleEnable() {
    setBusy(true)
    try {
      await unlockNotificationSound({ persist: true, audible: true })
      setVisible(false)
    } catch {
      /* Keep banner — browser blocked playback; user can try again */
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="fixed bottom-4 left-1/2 z-[110] w-[min(100%-2rem,28rem)] -translate-x-1/2 rounded-2xl border border-accent/30 bg-surface p-4 shadow-xl">
      <div className="flex items-start gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-accent/15 text-accent">
          <Volume2 size={20} />
        </span>
        <div className="min-w-0 flex-1">
          <p className="font-semibold text-primary">{t('notifications.soundPromptTitle')}</p>
          <p className="mt-1 text-sm text-muted">{t('notifications.soundPromptBody')}</p>
          <Button type="button" size="sm" className="mt-3" onClick={handleEnable} disabled={busy}>
            {t('notifications.soundPromptEnable')}
          </Button>
        </div>
      </div>
    </div>
  )
}
