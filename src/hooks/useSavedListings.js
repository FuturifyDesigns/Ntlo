import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from './useAuth'
import { getWebRentalById, isWebRentalId } from '../data/webRentals'

const WEB_SAVED_KEY = 'ntlo_saved_web_rentals'

function readWebSavedIds() {
  try {
    const raw = localStorage.getItem(WEB_SAVED_KEY)
    const list = raw ? JSON.parse(raw) : []
    return new Set(Array.isArray(list) ? list : [])
  } catch {
    return new Set()
  }
}

function writeWebSavedIds(ids) {
  try {
    localStorage.setItem(WEB_SAVED_KEY, JSON.stringify([...ids]))
  } catch { /* ignore */ }
}

export function useSavedListings() {
  const { user, loading: authLoading } = useAuth()
  const [savedIds, setSavedIds] = useState(new Set())
  const [savedListings, setSavedListings] = useState([])
  const [loading, setLoading] = useState(true)

  const fetchSaved = useCallback(async ({ silent = false } = {}) => {
    if (!user) {
      setSavedIds(new Set())
      setSavedListings([])
      setLoading(false)
      return
    }

    if (!silent) setLoading(true)
    try {
      const { data, error } = await supabase
        .from('saved_listings')
        .select(
          `
          listing_id,
          listing:listings(
            id, title, price, room_type, area, city, lat, lng,
            distance_to_campus, available, is_verified, landlord_verified, landlord_display_name, amenities,
            nearest_university_id, gender_preference,
            nearest_university:universities(id, short_name, name, lat, lng),
            listing_photos(url, is_cover, display_order)
          )
        `
        )
        .eq('student_id', user.id)
        .order('created_at', { ascending: false })

      if (error) throw error
      const ids = new Set((data || []).map((s) => s.listing_id))
      const webIds = readWebSavedIds()
      webIds.forEach((id) => ids.add(id))
      setSavedIds(ids)
      const fromDb = (data || []).map((s) => s.listing).filter(Boolean)
      const fromWeb = [...webIds].map(getWebRentalById).filter(Boolean)
      setSavedListings([...fromWeb, ...fromDb])
    } catch {
      const webIds = readWebSavedIds()
      setSavedIds(webIds)
      setSavedListings([...webIds].map(getWebRentalById).filter(Boolean))
    } finally {
      setLoading(false)
    }
  }, [user])

  useEffect(() => {
    if (authLoading) return undefined
    fetchSaved()

    if (!user?.id) return undefined

    const channel = supabase
      .channel(`saved-listings-${user.id}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'saved_listings', filter: `student_id=eq.${user.id}` },
        () => fetchSaved({ silent: true })
      )
      .subscribe()

    return () => supabase.removeChannel(channel)
  }, [authLoading, fetchSaved, user?.id])

  async function toggleSave(listingId) {
    if (!user) return { needsAuth: true }

    if (isWebRentalId(listingId)) {
      const webIds = readWebSavedIds()
      if (webIds.has(listingId)) {
        webIds.delete(listingId)
        writeWebSavedIds(webIds)
        setSavedIds((prev) => {
          const next = new Set(prev)
          next.delete(listingId)
          return next
        })
        setSavedListings((prev) => prev.filter((l) => l.id !== listingId))
        return { saved: false }
      }
      webIds.add(listingId)
      writeWebSavedIds(webIds)
      const web = getWebRentalById(listingId)
      setSavedIds((prev) => new Set([...prev, listingId]))
      if (web) setSavedListings((prev) => [web, ...prev.filter((l) => l.id !== listingId)])
      return { saved: true }
    }

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
    await fetchSaved({ silent: true })
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
