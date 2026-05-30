import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useUniversities } from './useUniversities'

export function useStats() {
  const { universities } = useUniversities()
  const [stats, setStats] = useState({
    listings: 0,
    universities: universities.length,
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
            .eq('available', true)
            .eq('verification_status', 'approved'),
          supabase
            .from('listings')
            .select('id', { count: 'exact', head: true })
            .eq('available', true)
            .eq('verification_status', 'approved')
            .eq('is_verified', true),
          supabase
            .from('listings')
            .select('nearest_university_id')
            .eq('available', true)
            .eq('verification_status', 'approved')
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
          universities: universities.length,
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
