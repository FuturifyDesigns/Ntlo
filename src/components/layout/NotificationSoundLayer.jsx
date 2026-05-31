import { useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../hooks/useAuth'
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

    const channelName = `notification-sound-${user.id}`
    supabase.getChannels().forEach((ch) => {
      if (ch.topic === `realtime:${channelName}`) supabase.removeChannel(ch)
    })

    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'notifications', filter: `user_id=eq.${user.id}` },
        (payload) => {
          playNotificationSound(payload.new?.id)
        }
      )
      .subscribe()

    return () => supabase.removeChannel(channel)
  }, [user?.id])

  return null
}
