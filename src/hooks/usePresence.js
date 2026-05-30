import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from './useAuth'

const ONLINE_MS = 90_000
const HEARTBEAT_MS = 45_000

export function usePresenceHeartbeat() {
  const { user } = useAuth()

  useEffect(() => {
    if (!user?.id) return undefined

    async function ping() {
      await supabase.rpc('touch_last_seen')
    }

    ping()
    const timer = setInterval(ping, HEARTBEAT_MS)
    return () => clearInterval(timer)
  }, [user?.id])
}

export function useProfilePresence(profile) {
  const [online, setOnline] = useState(false)

  useEffect(() => {
    if (!profile?.id) {
      setOnline(false)
      return undefined
    }

    function check(ts) {
      if (!ts) {
        setOnline(false)
        return
      }
      setOnline(Date.now() - new Date(ts).getTime() < ONLINE_MS)
    }

    check(profile.last_seen_at)

    const channel = supabase
      .channel(`presence-${profile.id}`)
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'profiles', filter: `id=eq.${profile.id}` },
        (payload) => check(payload.new?.last_seen_at)
      )
      .subscribe()

    const tick = setInterval(() => check(profile.last_seen_at), 30_000)

    return () => {
      clearInterval(tick)
      supabase.removeChannel(channel)
    }
  }, [profile?.id, profile?.last_seen_at])

  return { online, lastSeenAt: profile?.last_seen_at }
}

export function formatLastSeen(iso, t) {
  if (!iso) return t('presence.unknown')
  const diff = Date.now() - new Date(iso).getTime()
  if (diff < ONLINE_MS) return t('presence.online')
  const mins = Math.floor(diff / 60_000)
  if (mins < 60) return t('presence.minutesAgo', { count: mins })
  const hours = Math.floor(mins / 60)
  if (hours < 24) return t('presence.hoursAgo', { count: hours })
  return t('presence.daysAgo', { count: Math.floor(hours / 24) })
}
