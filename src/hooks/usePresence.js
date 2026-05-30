import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from './useAuth'

const ONLINE_MS = 90_000
const HEARTBEAT_MS = 45_000
const DISPLAY_TICK_MS = 30_000

export function usePresenceHeartbeat() {
  const { user } = useAuth()

  useEffect(() => {
    if (!user?.id) return undefined

    async function ping() {
      await supabase.rpc('touch_last_seen')
    }

    ping()
    const timer = setInterval(ping, HEARTBEAT_MS)

    function onVisible() {
      if (document.visibilityState === 'visible') ping()
    }
    document.addEventListener('visibilitychange', onVisible)

    return () => {
      clearInterval(timer)
      document.removeEventListener('visibilitychange', onVisible)
    }
  }, [user?.id])
}

export function useProfilePresence(profile) {
  const profileId = profile?.id
  const [lastSeenAt, setLastSeenAt] = useState(profile?.last_seen_at ?? null)
  const [tick, setTick] = useState(0)

  useEffect(() => {
    setLastSeenAt(profile?.last_seen_at ?? null)
  }, [profile?.last_seen_at])

  useEffect(() => {
    if (!profileId) return undefined

    async function fetchPresence() {
      const { data } = await supabase
        .from('profiles')
        .select('last_seen_at')
        .eq('id', profileId)
        .maybeSingle()
      if (data) setLastSeenAt(data.last_seen_at ?? null)
    }

    fetchPresence()

    const channelName = `presence-${profileId}`
    supabase.getChannels().forEach((ch) => {
      if (ch.topic === `realtime:${channelName}`) supabase.removeChannel(ch)
    })

    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'profiles', filter: `id=eq.${profileId}` },
        (payload) => setLastSeenAt(payload.new?.last_seen_at ?? null)
      )
      .subscribe()

    const refreshTimer = setInterval(fetchPresence, 60_000)
    const tickTimer = setInterval(() => setTick((n) => n + 1), DISPLAY_TICK_MS)

    return () => {
      clearInterval(refreshTimer)
      clearInterval(tickTimer)
      supabase.removeChannel(channel)
    }
  }, [profileId])

  const online = Boolean(
    lastSeenAt && Date.now() - new Date(lastSeenAt).getTime() < ONLINE_MS
  )

  // tick refreshes relative "last seen" labels without a new fetch
  void tick

  return { online, lastSeenAt }
}

export function formatLastSeen(iso, t) {
  if (!iso) return t('presence.neverOnline')

  const diff = Math.max(0, Date.now() - new Date(iso).getTime())
  if (diff < ONLINE_MS) return t('presence.online')

  const mins = Math.floor(diff / 60_000)
  if (mins < 1) return t('presence.lastSeenJustNow')
  if (mins < 60) {
    return mins === 1
      ? t('presence.lastSeenMinute')
      : t('presence.lastSeenMinutes', { count: mins })
  }

  const hours = Math.floor(mins / 60)
  if (hours < 24) {
    return hours === 1
      ? t('presence.lastSeenHour')
      : t('presence.lastSeenHours', { count: hours })
  }

  const days = Math.floor(hours / 24)
  if (days === 1) return t('presence.lastSeenDay')
  return t('presence.lastSeenDays', { count: days })
}

/** Normalize profile passed into chat from conversation rows. */
export function chatOtherProfile(row, role) {
  if (!row) return null
  const nested = role === 'landlord' ? row.landlord : row.student
  const id = nested?.id ?? (role === 'landlord' ? row.landlord_id : row.student_id)
  if (!id) return null
  return { id, full_name: nested?.full_name, last_seen_at: nested?.last_seen_at ?? null }
}
