import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from './useAuth'

export function useSavedListings() {
  const { user, loading: authLoading } = useAuth()
  const [savedIds, setSavedIds] = useState(new Set())
  const [savedListings, setSavedListings] = useState([])
  const [loading, setLoading] = useState(true)

  const fetchSaved = useCallback(async () => {
    if (!user) {
      setSavedIds(new Set())
      setSavedListings([])
      setLoading(false)
      return
    }

    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('saved_listings')
        .select(
          `
          listing_id,
          listing:listings(
            id, title, price, room_type, area, city,
            distance_to_campus, available, is_verified,
            nearest_university:universities(short_name, name),
            cover_photo:listing_photos(url, is_cover)
          )
        `
        )
        .eq('student_id', user.id)
        .order('created_at', { ascending: false })

      if (error) throw error
      const ids = new Set((data || []).map((s) => s.listing_id))
      setSavedIds(ids)
      setSavedListings((data || []).map((s) => s.listing).filter(Boolean))
    } catch {
      setSavedIds(new Set())
      setSavedListings([])
    } finally {
      setLoading(false)
    }
  }, [user])

  useEffect(() => {
    if (authLoading) return
    fetchSaved()
  }, [authLoading, fetchSaved])

  async function toggleSave(listingId) {
    if (!user) return { needsAuth: true }

    if (savedIds.has(listingId)) {
      const { error } = await supabase
        .from('saved_listings')
        .delete()
        .eq('student_id', user.id)
        .eq('listing_id', listingId)
      if (error) throw error
      setSavedIds((prev) => {
        const next = new Set(prev)
        next.delete(listingId)
        return next
      })
      setSavedListings((prev) => prev.filter((l) => l.id !== listingId))
      return { saved: false }
    }

    const { error } = await supabase
      .from('saved_listings')
      .insert({ student_id: user.id, listing_id: listingId })
    if (error) throw error
    setSavedIds((prev) => new Set([...prev, listingId]))
    await fetchSaved()
    return { saved: true }
  }

  function isSaved(listingId) {
    return savedIds.has(listingId)
  }

  return {
    savedListings,
    savedIds,
    loading: authLoading || loading,
    toggleSave,
    isSaved,
    refetch: fetchSaved,
  }
}
