import { getUniversities } from './universities'
import { getUniversityDisplayName } from './universityNames'

function normalizeQuery(query) {
  return (query || '').trim().toLowerCase()
}

function universitySearchHaystack(uni) {
  const parts = [
    uni.name,
    uni.short_name,
    uni.slug,
    uni.city,
    getUniversityDisplayName(uni),
    ...(uni.nearby_areas || []),
  ]
  return parts.filter(Boolean).join(' ').toLowerCase()
}

/** Match universities by name, abbreviation, slug, city, or nearby area. */
export function findUniversitiesBySearch(query) {
  const q = normalizeQuery(query)
  if (q.length < 2) return []

  const matches = getUniversities().filter((uni) => {
    const haystack = universitySearchHaystack(uni)
    if (haystack.includes(q)) return true

    const short = (uni.short_name || '').toLowerCase()
    if (short && short.startsWith(q)) return true

    const slug = (uni.slug || '').toLowerCase()
    if (slug && slug.startsWith(q)) return true

    return (uni.nearby_areas || []).some((area) => area.toLowerCase().includes(q))
  })

  return matches.sort((a, b) => {
    const aShort = (a.short_name || '').toLowerCase()
    const bShort = (b.short_name || '').toLowerCase()
    if (aShort === q && bShort !== q) return -1
    if (bShort === q && aShort !== q) return 1
    if (aShort.startsWith(q) && !bShort.startsWith(q)) return -1
    if (bShort.startsWith(q) && !aShort.startsWith(q)) return 1
    return getUniversityDisplayName(a).localeCompare(getUniversityDisplayName(b))
  })
}

/** Best single university match for map panning and result labels. */
export function pickPrimaryUniversityMatch(query) {
  const matches = findUniversitiesBySearch(query)
  if (!matches.length) return null
  if (matches.length === 1) return matches[0]

  const q = normalizeQuery(query)
  const exact = matches.find((uni) => {
    const short = (uni.short_name || '').toLowerCase()
    const slug = (uni.slug || '').toLowerCase()
    const name = (uni.name || '').toLowerCase()
    return short === q || slug === q || name === q || short.startsWith(q)
  })
  return exact || matches[0]
}

export function getUniversityIdsFromSearch(query) {
  return findUniversitiesBySearch(query).map((uni) => uni.id)
}

export function escapeIlikePattern(value) {
  return (value || '').replace(/[%_\\]/g, '')
}
