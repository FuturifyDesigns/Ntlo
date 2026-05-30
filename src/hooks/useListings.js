import { useState, useEffect, useCallback, useRef } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from './useAuth'

const PAGE_SIZE = 12

export function useListings(filters = {}) {
  const {
    universityId,
    minPrice,
    maxPrice,
    roomType,
    genderPreference,
    search,
    availableOnly = true,
    sortBy = 'newest',
    amenities = [],
    landlordId,
    mapMode = false,
  } = filters

  const amenitiesKey = JSON.stringify(amenities)

  const [listings, setListings] = useState([])
  const [loading, setLoading] = useState(true)
  const [isFetching, setIsFetching] = useState(false)
  const [error, setError] = useState(null)
  const [count, setCount] = useState(0)
  const [page, setPage] = useState(0)
  const hasLoadedRef = useRef(false)

  useEffect(() => {
    setPage(0)
  }, [
    universityId,
    minPrice,
    maxPrice,
    roomType,
    genderPreference,
    search,
    availableOnly,
    sortBy,
    amenitiesKey,
  ])

  const fetchListings = useCallback(async () => {
    if (!hasLoadedRef.current) setLoading(true)
    setIsFetching(true)
    setError(null)

    try {
      let query = supabase
        .from('listings')
        .select(
          `
          id, title, price, room_type, area, city, address, lat, lng,
          distance_to_campus, available, is_verified, landlord_verified, landlord_display_name, featured,
          whatsapp_number, amenities, gender_preference, deposit_pula, utilities_included, house_rules,
          created_at, views,
          nearest_university_id, custom_university_name,
          nearest_university:universities(id, short_name, name, lat, lng),
          cover_photo:listing_photos(url, is_cover)
        `,
          { count: 'exact' }
        )
        .eq('available', availableOnly !== false)

      if (universityId === 'other') {
        query = query.is('nearest_university_id', null)
      } else if (universityId) {
        query = query.eq('nearest_university_id', universityId)
      }
      if (minPrice) query = query.gte('price', minPrice)
      if (maxPrice) query = query.lte('price', maxPrice)
      if (roomType) query = query.eq('room_type', roomType)
      if (genderPreference && genderPreference !== 'any') {
        query = query.eq('gender_preference', genderPreference)
      }
      if (landlordId) query = query.eq('landlord_id', landlordId)
      if (search) {
        query = query.or(
          `title.ilike.%${search}%,area.ilike.%${search}%,city.ilike.%${search}%,address.ilike.%${search}%`
        )
      }
      if (amenities.length) {
        query = query.contains('amenities', amenities)
      }

      if (sortBy === 'price_asc') {
        query = query.order('price', { ascending: true })
      } else if (sortBy === 'price_desc') {
        query = query.order('price', { ascending: false })
      } else if (sortBy === 'distance') {
        query = query.order('distance_to_campus', { ascending: true })
      } else {
        query = query.order('featured', { ascending: false }).order('created_at', { ascending: false })
      }

      if (mapMode) {
        query = query.limit(200)
      } else {
        query = query.range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1)
      }

      const { data, error: queryError, count: total } = await query
      if (queryError) throw queryError
      setListings(data || [])
      setCount(total || 0)
      hasLoadedRef.current = true
    } catch (err) {
      setError(err.message)
      if (!hasLoadedRef.current) {
        setListings([])
        setCount(0)
      }
    } finally {
      setLoading(false)
      setIsFetching(false)
    }
  }, [
    universityId,
    minPrice,
    maxPrice,
    roomType,
    genderPreference,
    search,
    availableOnly,
    sortBy,
    amenitiesKey,
    landlordId,
    mapMode,
    page,
  ])

  useEffect(() => {
    const timer = setTimeout(fetchListings, 300)
    return () => clearTimeout(timer)
  }, [fetchListings])

  useEffect(() => {
    const channel = supabase
      .channel('listings-live')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'listings' }, () => {
        fetchListings()
      })
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [fetchListings])

  return {
    listings,
    loading,
    isFetching,
    error,
    count,
    page,
    setPage,
    pageSize: PAGE_SIZE,
    refetch: fetchListings,
  }
}

export function useListing(id) {
  const { loading: authLoading } = useAuth()
  const [listing, setListing] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (!id || authLoading) return undefined
    async function fetchListing() {
      setLoading(true)
      try {
        const { data, error: fetchError } = await supabase
          .from('listings')
          .select(
            `
            *,
            nearest_university:universities(id, short_name, name, lat, lng),
            listing_photos(id, url, is_cover, display_order),
            landlord:profiles(id, full_name, is_verified, phone)
          `
          )
          .eq('id', id)
          .maybeSingle()

        if (fetchError) throw fetchError
        setListing(data)

        if (data) {
          supabase.rpc('increment_listing_view', { p_listing_id: id }).then(() => {})
        }
      } catch (err) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }
    fetchListing()
    return undefined
  }, [id, authLoading])

  useEffect(() => {
    if (!id) return undefined

    const channel = supabase
      .channel(`listing-${id}`)
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'listings', filter: `id=eq.${id}` },
        (payload) => {
          if (payload.new) setListing((prev) => (prev ? { ...prev, ...payload.new } : payload.new))
        }
      )
      .subscribe()

    return () => supabase.removeChannel(channel)
  }, [id])

  return { listing, loading, error }
}
