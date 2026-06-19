import { useEffect } from 'react'
import { useAuth } from '../../hooks/useAuth'
import { subscribeNotificationInserts } from '../../lib/notificationsLiveBus'
import {
  isNotificationSoundEnabled,
  playNotificationSound,
  warmNotificationSoundOnInteraction,
} from '../../lib/notificationSound'

/** Plays ntlo-sound.mp3 whenever a new in-app notification arrives (realtime). */
export default function NotificationSoundLayer() {
  const { user } = useAuth()

  useEffect(() => {
    function onInteract() {
      warmNotificationSoundOnInteraction()
    }
    window.addEventListener('pointerdown', onInteract, { passive: true })
    window.addEventListener('keydown', onInteract)
    return () => {
      window.removeEventListener('pointerdown', onInteract)
      window.removeEventListener('keydown', onInteract)
    }
  }, [])

  useEffect(() => {
    if (!user?.id || !isNotificationSoundEnabled()) return undefined

    return subscribeNotificationInserts(user.id, (notification) => {
      playNotificationSound(notification?.id)
    })
  }, [user?.id])

  return null
}
