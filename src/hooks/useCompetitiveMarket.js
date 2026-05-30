import { useState, useEffect, useCallback, useMemo } from 'react'
import { supabase } from '../lib/supabase'
import { getMarketKey } from '../lib/competitiveAdvisor'

const MARKET_SELECT = `
  id, title, price, room_type, area, city, lat, lng, available, occupancy_status,
  distance_to_campus, nearest_university_id, custom_university_name, amenities,
  is_verified, landlord_verified, landlord_id, gender_preference, description,
  verification_status, created_at, views,
  listing_photos(url, is_cover, display_order),
  nearest_university:universities(id, short_name, name, lat, lng),
  landlord:profiles(id, full_name, is_verified)
`

export function useCompetitiveMarket(anchorListing) {
  const [marketListings, setMarketListings] = useState([])
  const [loading, setLoading] = useState(true)

  const marketKey = useMemo(() => getMarketKey(anchorListing), [anchorListing])

  const fetchMarket = useCallback(async ({ silent = false } = {}) => {
    if (!anchorListing || !marketKey) {
      setMarketListings([])
      setLoading(false)
      return
    }

    if (!silent) setLoading(true)

    let query = supabase.from('listings').select(MARKET_SELECT)

    if (anchorListing.nearest_university_id) {
      query = query
        .eq('nearest_university_id', anchorListing.nearest_university_id)
        .eq('room_type', anchorListing.room_type || 'single')
    } else if (anchorListing.city) {
      query = query
        .ilike('city', anchorListing.city.trim())
        .eq('room_type', anchorListing.room_type || 'single')
    } else {
      setMarketListings([])
      setLoading(false)
      return
    }

    query = query.in('occupancy_status', ['available', 'rented'])
      .eq('verification_status', 'approved')
      .order('created_at', { ascending: false }).limit(80)

    const { data, error } = await query
    if (!error) setMarketListings(data || [])
    if (!silent) setLoading(false)
  }, [anchorListing, marketKey])

  useEffect(() => {
    fetchMarket()
  }, [fetchMarket])

  useEffect(() => {
    if (!marketKey) return undefined

    const channel = supabase
      .channel(`market-${marketKey}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'listings' }, () => {
        fetchMarket({ silent: true })
      })
      .subscribe()

    return () => supabase.removeChannel(channel)
  }, [marketKey, fetchMarket])

  return { marketListings, loading, refetch: fetchMarket, marketKey }
}

export function useLandlordListings(landlordId) {
  const [listings, setListings] = useState([])
  const [loading, setLoading] = useState(true)

  const fetchAll = useCallback(async ({ silent = false } = {}) => {
    if (!landlordId) {
      setListings([])
      setLoading(false)
      return
    }
    if (!silent) setLoading(true)
    const { data } = await supabase
      .from('listings')
      .select(MARKET_SELECT)
      .eq('landlord_id', landlordId)
      .order('created_at', { ascending: false })
    setListings(data || [])
    if (!silent) setLoading(false)
  }, [landlordId])

  useEffect(() => {
    fetchAll()
  }, [fetchAll])

  useEffect(() => {
    if (!landlordId) return undefined
    const channel = supabase
      .channel(`landlord-compete-${landlordId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'listings', filter: `landlord_id=eq.${landlordId}` },
        () => fetchAll({ silent: true })
      )
      .subscribe()
    return () => supabase.removeChannel(channel)
  }, [landlordId, fetchAll])

  return { listings, loading, refetch: fetchAll }
}
