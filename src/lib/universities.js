import { getUniversityDisplayName } from './universityNames'
import { enrichUniversity, getUniversityImage } from './universityMeta'

/** In-memory cache populated by UniversitiesProvider from Supabase. */
let universitiesCache = []

export function setUniversitiesCache(list) {
  universitiesCache = Array.isArray(list) ? list.map(enrichUniversity) : []
}

export function getUniversities() {
  return universitiesCache
}

export function getUniversityBySlug(slug) {
  return universitiesCache.find((u) => u.slug === slug)
}

export function getUniversityById(id) {
  if (id == null || id === '') return undefined
  const numericId = Number(id)
  if (!Number.isFinite(numericId)) return undefined
  return universitiesCache.find((u) => u.id === numericId)
}

export function getUniversityCities() {
  return [...new Set(universitiesCache.map((u) => u.city).filter(Boolean))]
}

export function getUniversityMapViewport(university) {
  if (!university || university.lat == null || university.lng == null) return null
  return {
    id: university.id,
    center: { lat: Number(university.lat), lng: Number(university.lng) },
    zoom: university.map_zoom ?? 15,
    label: getUniversityDisplayName(university),
  }
}

export { getUniversityDisplayName, getUniversityImage, enrichUniversity }
