import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useUniversities } from './useUniversities'
import { subscribeListingsLive } from '../lib/listingsLiveBus'
import { createDebouncer } from '../lib/queryOptim'

function campusKeyFromListing(row) {
  if (row?.nearest_university_id) return `id:${row.nearest_university_id}`
  const custom = row?.custom_university_name?.trim()
  if (custom) return `custom:${custom.toLowerCase()}`
  return null
}

async function fetchPublicListingStats() {
  const [listingsRes, campusRes, landlordsRes] = await Promise.all([
    supabase
      .from('listings')
      .select('id', { count: 'exact', head: true })
      .eq('verification_status', 'approved')
      .in('occupancy_status', ['available', 'rented']),
    supabase
      .from('listings')
      .select('nearest_university_id, custom_university_name')
      .eq('verification_status', 'approved')
      .in('occupancy_status', ['available', 'rented']),
    supabase
      .from('profiles')
      .select('id', { count: 'exact', head: true })
      .eq('role', 'landlord'),
  ])

  const campusKeys = new Set(
    (campusRes.data || []).map(campusKeyFromListing).filter(Boolean)
  )

  return {
    listings: listingsRes.count || 0,
    universitiesWithListings: campusKeys.size,
    landlords: landlordsRes.count || 0,
  }
}

export function useStats() {
  const { universities } = useUniversities()
  const [stats, setStats] = useState({
    listings: 0,
    universities: universities.length,
    universitiesWithListings: 0,
    landlords: 0,
    loading: true,
  })

  useEffect(() => {
    let cancelled = false

    async function load() {
      try {
        const data = await fetchPublicListingStats()
        if (!cancelled) {
          setStats({
            ...data,
            universities: universities.length,
            loading: false,
          })
        }
      } catch {
        if (!cancelled) setStats((s) => ({ ...s, loading: false }))
      }
    }

    load()
    const debouncedLoad = createDebouncer(() => {
      if (!cancelled) load()
    }, 5000)
    const unsub = subscribeListingsLive(() => debouncedLoad())
    return () => {
      cancelled = true
      debouncedLoad.cancel()
      unsub()
    }
  }, [universities.length])

  return stats
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
