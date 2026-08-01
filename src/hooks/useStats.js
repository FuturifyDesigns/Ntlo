import { useState, useEffect } from 'react'
import { useUniversities } from './useUniversities'
import { useLiveListingStats } from './useLiveListingStats'
import { supabase } from '../lib/supabase'
import { fetchPublicPlatformStats } from '../lib/platformStats'
import { subscribePlatformStats } from '../lib/platformStatsLive'
import { subscribeListingsLive } from '../lib/listingsLiveBus'
import { createDebouncer } from '../lib/queryOptim'

export function useStats() {
  const { universities } = useUniversities()
  const liveListings = useLiveListingStats()
  const [profileStats, setProfileStats] = useState({
    students: 0,
    landlords: 0,
    loading: true,
  })

  useEffect(() => {
    let cancelled = false

    async function load() {
      try {
        const data = await fetchPublicPlatformStats()
        if (!cancelled) {
          setProfileStats({
            students: data.students,
            landlords: data.landlords,
            loading: false,
          })
        }
      } catch {
        if (!cancelled) setProfileStats((s) => ({ ...s, loading: false }))
      }
    }

    load()
    const debouncedLoad = createDebouncer(() => {
      if (!cancelled) load()
    }, 3000)

    const unsubStats = subscribePlatformStats(() => debouncedLoad())
    const unsubListings = subscribeListingsLive(() => debouncedLoad())

    return () => {
      cancelled = true
      debouncedLoad.cancel()
      unsubStats()
      unsubListings()
    }
  }, [universities.length])

  return {
    students: profileStats.students,
    landlords: profileStats.landlords,
    listings: liveListings.listings,
    universities: universities.length,
    universitiesWithListings: liveListings.campusesWithListings,
    loading: profileStats.loading || liveListings.loading,
  }
}

export async function submitUniversityRequest({ name, city, userId, email }) {
  const { error } = await supabase.from('university_requests').insert({
    name: name.trim(),
    city: city.trim(),
    requested_by: userId || null,
    contact_email: email || null,
  })
  if (error) throw error
}
