import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { supabase } from '../lib/supabase'
import { geocodeCampus, getGeocodeCampusName, hasValidCampusCoords } from '../lib/geocodeUniversity'
import { enrichUniversity } from '../lib/universityMeta'
import { setUniversitiesCache } from '../lib/universities'
import { useAuth } from '../hooks/useAuth'

const UniversitiesContext = createContext(null)

async function fetchUniversitiesFromDb() {
  const { data, error } = await supabase
    .from('universities')
    .select('id, name, slug, short_name, city, lat, lng, map_zoom, nearby_areas')
    .order('name')

  if (error) throw error
  return (data || []).map(enrichUniversity)
}

async function persistUniversityCoords(id, lat, lng, mapZoom) {
  const { error } = await supabase.rpc('admin_update_university_coords', {
    p_university_id: id,
    p_lat: lat,
    p_lng: lng,
    p_map_zoom: mapZoom ?? 15,
  })
  if (error) throw error
}

async function fillMissingCoordinates(list, isAdmin) {
  const next = [...list]
  let changed = false

  for (let i = 0; i < next.length; i += 1) {
    const uni = next[i]
    if (hasValidCampusCoords(uni.lat, uni.lng)) continue

    const coords = await geocodeCampus({
      name: getGeocodeCampusName(uni),
      city: uni.city,
      slug: uni.slug,
    })
    if (!coords) continue

    const updated = {
      ...uni,
      lat: coords.lat,
      lng: coords.lng,
      map_zoom: uni.map_zoom ?? 15,
    }
    next[i] = updated
    changed = true

    if (isAdmin) {
      try {
        await persistUniversityCoords(updated.id, coords.lat, coords.lng, updated.map_zoom)
      } catch {
        // Still use geocoded coords in the client even if persist fails.
      }
    }
  }

  return changed ? next : list
}

export function UniversitiesProvider({ children }) {
  const { profile } = useAuth()
  const isAdmin = profile?.role === 'admin'
  const [universities, setUniversities] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const applyList = useCallback((list) => {
    const enriched = list.map(enrichUniversity)
    setUniversities(enriched)
    setUniversitiesCache(enriched)
  }, [])

  const refresh = useCallback(async () => {
    setError(null)
    try {
      let list = await fetchUniversitiesFromDb()
      list = await fillMissingCoordinates(list, isAdmin)
      applyList(list)
    } catch (err) {
      setError(err.message || 'Failed to load universities')
    } finally {
      setLoading(false)
    }
  }, [applyList, isAdmin])

  useEffect(() => {
    refresh()
  }, [refresh])

  useEffect(() => {
    const channel = supabase
      .channel('universities-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'universities' }, refresh)
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [refresh])

  const value = useMemo(
    () => ({
      universities,
      loading,
      error,
      refresh,
      cities: [...new Set(universities.map((u) => u.city).filter(Boolean))],
    }),
    [universities, loading, error, refresh]
  )

  return (
    <UniversitiesContext.Provider value={value}>
      {children}
    </UniversitiesContext.Provider>
  )
}

export function useUniversities() {
  const ctx = useContext(UniversitiesContext)
  if (!ctx) {
    throw new Error('useUniversities must be used within UniversitiesProvider')
  }
  return ctx
}
