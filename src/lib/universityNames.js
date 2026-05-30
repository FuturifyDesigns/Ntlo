/** Official campus names as listed on Google Maps (used for geocoding + display). */
export const GOOGLE_MAPS_CAMPUS_NAMES = {
  'university-of-botswana': 'University of Botswana',
  biust: 'Botswana International University of Science and Technology',
  'botho-university': 'Botho University',
  limkokwing: 'Limkokwing University College',
  'ba-isago': 'Ba Isago University',
  'abm-university': 'ABM University College',
  guc: 'Gaborone University College',
}

export function normalizeUniversityName(name) {
  return (name || '').trim().replace(/\s+/g, ' ')
}

export function getUniversityDisplayName(uni) {
  if (!uni) return ''
  return normalizeUniversityName(uni.name || uni.short_name)
}

/** Best name to send to Google Geocoding for a campus pin. */
export function getGeocodeCampusName(uni) {
  if (!uni) return ''
  const slug = uni.slug
  if (slug && GOOGLE_MAPS_CAMPUS_NAMES[slug]) {
    return GOOGLE_MAPS_CAMPUS_NAMES[slug]
  }
  return normalizeUniversityName(uni.name || uni.short_name)
}

/**
 * Require full official names (not UB, BIUST, etc.) for manual / "other" entries.
 * Returns a translation key or null if valid.
 */
export function validateFullUniversityName(name) {
  const normalized = normalizeUniversityName(name)

  if (!normalized) return 'universityRequired'
  if (normalized.length < 10) return 'universityFullNameMin'

  const lettersOnly = normalized.replace(/[^a-zA-Z]/g, '')
  if (lettersOnly.length <= 6 && normalized === normalized.toUpperCase()) {
    return 'universityNoAbbrev'
  }

  if (!/\b(university|college|institute|polytechnic)\b/i.test(normalized)) {
    return 'universityFullNameRequired'
  }

  return null
}
