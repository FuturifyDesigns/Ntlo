import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { UNIVERSITIES } from '../lib/universities'

export function useStats() {
  const [stats, setStats] = useState({
    listings: 0,
    universities: UNIVERSITIES.length,
    universitiesWithListings: 0,
    verified: 0,
    landlords: 0,
    loading: true,
  })

  useEffect(() => {
    async function fetchStats() {
      try {
        const [listingsRes, verifiedRes, uniRes, landlordsRes] = await Promise.all([
          supabase
            .from('listings')
            .select('id', { count: 'exact', head: true })
            .eq('available', true),
          supabase
            .from('listings')
            .select('id', { count: 'exact', head: true })
            .eq('available', true)
            .eq('is_verified', true),
          supabase
            .from('listings')
            .select('nearest_university_id')
            .eq('available', true)
            .not('nearest_university_id', 'is', null),
          supabase
            .from('profiles')
            .select('id', { count: 'exact', head: true })
            .eq('role', 'landlord'),
        ])

        const uniqueUnis = new Set(
          (uniRes.data || []).map((l) => l.nearest_university_id).filter(Boolean)
        )

        setStats({
          listings: listingsRes.count || 0,
          universities: UNIVERSITIES.length,
          universitiesWithListings: uniqueUnis.size,
          verified: verifiedRes.count || 0,
          landlords: landlordsRes.count || 0,
          loading: false,
        })
      } catch {
        setStats((s) => ({ ...s, loading: false }))
      }
    }
    fetchStats()
  }, [])

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
