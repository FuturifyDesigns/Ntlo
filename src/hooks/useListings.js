import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'

const PAGE_SIZE = 12

export function useListings(filters = {}) {
  const [listings, setListings] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [count, setCount] = useState(0)
  const [page, setPage] = useState(0)

  useEffect(() => {
    setPage(0)
  }, [
    filters.universityId,
    filters.minPrice,
    filters.maxPrice,
    filters.roomType,
    filters.genderPreference,
    filters.search,
    filters.availableOnly,
    filters.sortBy,
    filters.amenities,
  ])

  const fetchListings = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      let query = supabase
        .from('listings')
        .select(
          `
          id, title, price, room_type, area, city, address,
          distance_to_campus, available, is_verified, featured,
          whatsapp_number, amenities, gender_preference, created_at, views,
          nearest_university_id, custom_university_name,
          nearest_university:universities(id, short_name, name),
          cover_photo:listing_photos(url, is_cover)
        `,
          { count: 'exact' }
        )
        .eq('available', filters.availableOnly !== false)

      if (filters.universityId === 'other') {
        query = query.is('nearest_university_id', null)
      } else if (filters.universityId) {
        query = query.eq('nearest_university_id', filters.universityId)
      }
      if (filters.minPrice) query = query.gte('price', filters.minPrice)
      if (filters.maxPrice) query = query.lte('price', filters.maxPrice)
      if (filters.roomType) query = query.eq('room_type', filters.roomType)
      if (filters.genderPreference && filters.genderPreference !== 'any') {
        query = query.eq('gender_preference', filters.genderPreference)
      }
      if (filters.landlordId) query = query.eq('landlord_id', filters.landlordId)
      if (filters.search) {
        query = query.or(
          `title.ilike.%${filters.search}%,area.ilike.%${filters.search}%,city.ilike.%${filters.search}%,address.ilike.%${filters.search}%`
        )
      }
      if (filters.amenities?.length) {
        query = query.contains('amenities', filters.amenities)
      }

      if (filters.sortBy === 'price_asc') {
        query = query.order('price', { ascending: true })
      } else if (filters.sortBy === 'price_desc') {
        query = query.order('price', { ascending: false })
      } else if (filters.sortBy === 'distance') {
        query = query.order('distance_to_campus', { ascending: true })
      } else {
        query = query.order('featured', { ascending: false }).order('created_at', { ascending: false })
      }

      query = query.range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1)

      const { data, error: queryError, count: total } = await query
      if (queryError) throw queryError
      setListings(data || [])
      setCount(total || 0)
    } catch (err) {
      setError(err.message)
      setListings([])
      setCount(0)
    } finally {
      setLoading(false)
    }
  }, [filters, page])

  useEffect(() => {
    const timer = setTimeout(fetchListings, 300)
    return () => clearTimeout(timer)
  }, [fetchListings])

  return { listings, loading, error, count, page, setPage, pageSize: PAGE_SIZE, refetch: fetchListings }
}

export function useListing(id) {
  const [listing, setListing] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (!id) return
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
          supabase
            .from('listings')
            .update({ views: (data.views || 0) + 1 })
            .eq('id', id)
            .then(() => {})
        }
      } catch (err) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }
    fetchListing()
  }, [id])

  return { listing, loading, error }
}
