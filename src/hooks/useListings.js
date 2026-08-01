import { useState, useEffect, useCallback, useRef } from 'react'
import { supabase } from '../lib/supabase'
import { subscribeListingsLive } from '../lib/listingsLiveBus'
import { dedupeAsync } from '../lib/queryOptim'
import { getUniversityIdsFromSearch, escapeIlikePattern } from '../lib/universitySearch'
import { mergeListingRow } from '../lib/listingMerge'
import { getWebRentalById, isWebRentalId, mergeWebIntoListings } from '../data/webRentals'
import { useWebRentalsFeed } from './useWebRentalsFeed'

const PAGE_SIZE = 12

const LISTING_CARD_SELECT = `
  id, title, price, room_type, area, city, lat, lng,
  distance_to_campus, available, occupancy_status, is_verified, landlord_verified, landlord_display_name, featured,
  amenities, gender_preference, created_at, updated_at, views,
  nearest_university_id, custom_university_name,
  nearest_university:universities(id, short_name, name, lat, lng),
  listing_photos(url, is_cover, display_order)
`

const LISTING_CARD_SELECT_WITH_ORIGIN = `
  id, title, price, room_type, area, city, lat, lng,
  distance_to_campus, available, occupancy_status, is_verified, landlord_verified, landlord_display_name, featured,
  amenities, gender_preference, created_at, updated_at, views,
  listing_origin, external_contact_name, external_source_label,
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

const LISTING_DETAIL_SELECT_WITH_ORIGIN = `
  id, landlord_id, title, description, price, room_type, gender_preference,
  address, area, city, lat, lng, nearest_university_id, custom_university_name, custom_university_city,
  distance_to_campus, amenities, whatsapp_number, available, occupancy_status,
  is_verified, landlord_verified, landlord_display_name, featured, verification_status,
  listing_origin, external_contact_name, external_source_label, external_source_url,
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
  const webCatalog = useWebRentalsFeed()

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
      const { data, error: queryError } = await dedupeAsync(`listings:${cacheKey}`, async () => {
        async function runSelect(selectCols) {
          let query = supabase
            .from('listings')
            .select(selectCols)

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
            // Include open-to-all rooms when filtering by a gender preference
            query = query.in('gender_preference', [genderPreference, 'any'])
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

          // Fetch a wide page from DB; web rentals are merged + re-paged client-side.
          query = query.limit(mapMode ? 200 : 120)
          return await query
        }

        let result = await runSelect(LISTING_CARD_SELECT_WITH_ORIGIN)
        if (result.error?.code === '42703' || /listing_origin|external_contact/i.test(result.error?.message || '')) {
          result = await runSelect(LISTING_CARD_SELECT)
        }
        return result
      })

      if (queryError) throw queryError

      const merged = mergeWebIntoListings(data || [], {
        universityId,
        minPrice,
        maxPrice,
        roomType,
        genderPreference,
        search,
        availableOnly,
        verifiedOnly,
        landlordId,
        amenities,
      }, { page, pageSize: PAGE_SIZE, mapMode, sortBy, catalog: webCatalog })

      setListings(merged.listings)
      setCount(merged.count)
      hasLoadedRef.current = true
    } catch (err) {
      // If DB is down, still show curated web rentals.
      const merged = mergeWebIntoListings([], {
        universityId,
        minPrice,
        maxPrice,
        roomType,
        genderPreference,
        search,
        availableOnly,
        verifiedOnly,
        landlordId,
        amenities,
      }, { page, pageSize: PAGE_SIZE, mapMode, sortBy, catalog: webCatalog })
      if (merged.count > 0) {
        setListings(merged.listings)
        setCount(merged.count)
        setError(null)
        hasLoadedRef.current = true
      } else {
        setError(err.message)
        if (!hasLoadedRef.current) {
          setListings([])
          setCount(0)
        }
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
    webCatalog,
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

    if (isWebRentalId(id)) {
      const web = getWebRentalById(id)
      setListing(web)
      setError(web ? null : 'Listing not found')
      setLoading(false)
      return undefined
    }

    async function fetchListing() {
      setLoading(true)
      try {
        let result = await supabase
          .from('listings')
          .select(LISTING_DETAIL_SELECT_WITH_ORIGIN)
          .eq('id', id)
          .maybeSingle()

        if (result.error?.code === '42703' || /listing_origin|external_contact/i.test(result.error?.message || '')) {
          result = await supabase
            .from('listings')
            .select(LISTING_DETAIL_SELECT)
            .eq('id', id)
            .maybeSingle()
        }

        if (result.error) throw result.error
        setListing(result.data)

        if (result.data && markListingViewed(id)) {
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
    if (!id || isWebRentalId(id)) return undefined

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
