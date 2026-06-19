import { useState, useEffect, useCallback, useRef } from 'react'
import { supabase } from '../lib/supabase'
import { subscribeListingsLive } from '../lib/listingsLiveBus'
import { dedupeAsync } from '../lib/queryOptim'
import { getUniversityIdsFromSearch, escapeIlikePattern } from '../lib/universitySearch'
import { mergeListingRow } from '../lib/listingMerge'

const PAGE_SIZE = 12

const LISTING_CARD_SELECT = `
  id, title, price, room_type, area, city, lat, lng,
  distance_to_campus, available, occupancy_status, is_verified, landlord_verified, landlord_display_name, featured,
  amenities, gender_preference, created_at, updated_at, views,
  nearest_university_id, custom_university_name,
  nearest_university:universities(id, short_name, name, lat, lng),
  listing_photos(url, is_cover, display_order)
`

const LISTING_DETAIL_SELECT = `
  id, landlord_id, title, description, price, room_type, gender_preference,
  address, area, city, lat, lng, nearest_university_id, custom_university_name, custom_university_city,
  distance_to_campus, amenities, whatsapp_number, available, occupancy_status,
  is_verified, landlord_verified, landlord_display_name, featured, verification_status,
  deposit_pula, utilities_included, house_rules, views, created_at, updated_at,
  nearest_university:universities(id, short_name, name, lat, lng),
  listing_photos(id, url, is_cover, display_order),
  landlord:profiles(id, full_name, is_verified, phone, last_seen_at)
`

function buildFilterKey(filters) {
  return JSON.stringify(filters)
}

export function useListings(filters = {}) {
  const {
    universityId,
    minPrice,
    maxPrice,
    roomType,
    genderPreference,
    search,
    availableOnly = false,
    verifiedOnly = false,
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
    verifiedOnly,
    sortBy,
    amenitiesKey,
  ])

  const fetchListings = useCallback(async ({ silent = false } = {}) => {
    if (!hasLoadedRef.current && !silent) setLoading(true)
    setIsFetching(true)
    setError(null)

    const cacheKey = buildFilterKey({
      universityId, minPrice, maxPrice, roomType, genderPreference, search,
      availableOnly, verifiedOnly, sortBy, amenitiesKey, landlordId, mapMode, page,
    })

    try {
      const { data, error: queryError, count: total } = await dedupeAsync(`listings:${cacheKey}`, async () => {
        let query = supabase
          .from('listings')
          .select(LISTING_CARD_SELECT, { count: 'exact' })

        if (availableOnly === true) {
          query = query.eq('occupancy_status', 'available')
        } else {
          query = query.in('occupancy_status', ['available', 'rented'])
        }

        query = query.eq('verification_status', 'approved')

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
          const trimmed = escapeIlikePattern(search.trim())
          if (trimmed) {
            const matchedUniIds = universityId ? [] : getUniversityIdsFromSearch(trimmed)
            const textOr = `title.ilike.%${trimmed}%,area.ilike.%${trimmed}%,city.ilike.%${trimmed}%,address.ilike.%${trimmed}%,custom_university_name.ilike.%${trimmed}%`
            if (matchedUniIds.length > 0) {
              query = query.or(`${textOr},nearest_university_id.in.(${matchedUniIds.join(',')})`)
            } else {
              query = query.or(textOr)
            }
          }
        }
        if (amenities.length) {
          query = query.contains('amenities', amenities)
        }
        if (verifiedOnly === true) {
          query = query.eq('is_verified', true)
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

        return await query
      })

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
    verifiedOnly,
    sortBy,
    amenitiesKey,
    landlordId,
    mapMode,
    page,
  ])

  useEffect(() => {
    const timer = setTimeout(() => fetchListings(), 300)
    return () => clearTimeout(timer)
  }, [fetchListings])

  useEffect(() => {
    return subscribeListingsLive(() => fetchListings({ silent: true }))
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

function markListingViewed(id) {
  if (!id || typeof sessionStorage === 'undefined') return false
  const key = `ntlo_viewed_${id}`
  if (sessionStorage.getItem(key)) return false
  sessionStorage.setItem(key, '1')
  return true
}

export function useListing(id) {
  const [listing, setListing] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (!id) return undefined
    async function fetchListing() {
      setLoading(true)
      try {
        const { data, error: fetchError } = await supabase
          .from('listings')
          .select(LISTING_DETAIL_SELECT)
          .eq('id', id)
          .maybeSingle()

        if (fetchError) throw fetchError
        setListing(data)

        if (data && markListingViewed(id)) {
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
  }, [id])

  useEffect(() => {
    if (!id) return undefined

    const channel = supabase
      .channel(`listing-${id}`)
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'listings', filter: `id=eq.${id}` },
        (payload) => {
          if (payload.new) {
            setListing((prev) => mergeListingRow(prev, payload.new))
          }
        }
      )
      .subscribe()

    return () => supabase.removeChannel(channel)
  }, [id])

  return { listing, loading, error }
}
