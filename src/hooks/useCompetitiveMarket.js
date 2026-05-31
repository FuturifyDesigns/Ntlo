import { useState, useEffect, useCallback, useMemo } from 'react'
import { supabase } from '../lib/supabase'
import { getMarketKey } from '../lib/competitiveAdvisor'
import {
  MARKET_SELECT,
  fetchMarketListings,
  subscribeMarket,
  fetchMarketsBatch,
} from '../lib/marketCache'

export function useCompetitiveMarket(anchorListing) {
  const [marketListings, setMarketListings] = useState([])
  const [loading, setLoading] = useState(true)
  const [lastSyncedAt, setLastSyncedAt] = useState(null)

  const marketKey = useMemo(() => getMarketKey(anchorListing), [anchorListing])

  const load = useCallback(async ({ silent = false, force = false } = {}) => {
    if (!anchorListing || !marketKey) {
      setMarketListings([])
      setLoading(false)
      return
    }

    if (!silent) setLoading(true)
    try {
      const data = await fetchMarketListings(marketKey, anchorListing, { force })
      setMarketListings(data)
      setLastSyncedAt(Date.now())
    } finally {
      if (!silent) setLoading(false)
    }
  }, [anchorListing, marketKey])

  useEffect(() => {
    load()
  }, [load])

  useEffect(() => {
    if (!marketKey || !anchorListing) return undefined
    return subscribeMarket(marketKey, anchorListing, () => load({ silent: true, force: true }))
  }, [marketKey, anchorListing, load])

  return { marketListings, loading, refetch: load, marketKey, lastSyncedAt }
}

export function useBatchCompetitiveMarkets(anchorListings) {
  const [marketsByKey, setMarketsByKey] = useState(new Map())
  const [loading, setLoading] = useState(true)

  const keys = useMemo(
    () => (anchorListings || []).map((a) => getMarketKey(a)).filter(Boolean).join('|'),
    [anchorListings]
  )

  const load = useCallback(async ({ silent = false } = {}) => {
    if (!anchorListings?.length) {
      setMarketsByKey(new Map())
      setLoading(false)
      return
    }
    if (!silent) setLoading(true)
    try {
      const map = await fetchMarketsBatch(anchorListings)
      setMarketsByKey(map)
    } finally {
      if (!silent) setLoading(false)
    }
  }, [anchorListings])

  useEffect(() => {
    load()
  }, [load, keys])

  useEffect(() => {
    if (!anchorListings?.length) return undefined
    const unsubs = anchorListings.map((anchor) => {
      const key = getMarketKey(anchor)
      if (!key) return () => {}
      return subscribeMarket(key, anchor, () => load({ silent: true }))
    })
    return () => unsubs.forEach((off) => off())
  }, [anchorListings, keys, load])

  return { marketsByKey, loading, refetch: load }
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
