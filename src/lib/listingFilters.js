/** Defaults for listing browse/home filters. */
export function emptyListingFilters(overrides = {}) {
  return {
    search: '',
    universityId: '',
    minPrice: '',
    maxPrice: '',
    roomType: '',
    genderPreference: 'any',
    sortBy: 'newest',
    availableOnly: false,
    verifiedOnly: false,
    amenities: [],
    ...overrides,
  }
}

/** Read listing filters from URLSearchParams (Home → Browse handoff). */
export function listingFiltersFromSearchParams(searchParams) {
  const uni = searchParams.get('uni')
  const maxPrice = searchParams.get('maxPrice')
  const minPrice = searchParams.get('minPrice')
  const amenitiesRaw = searchParams.get('amenities')
  const amenities = amenitiesRaw
    ? amenitiesRaw.split(',').map((s) => s.trim()).filter(Boolean)
    : []

  return emptyListingFilters({
    search: searchParams.get('search') || '',
    universityId: uni === 'other' ? 'other' : uni ? Number(uni) : '',
    minPrice: minPrice ? Number(minPrice) : '',
    maxPrice: maxPrice ? Number(maxPrice) : '',
    roomType: searchParams.get('roomType') || '',
    genderPreference: searchParams.get('gender') || 'any',
    sortBy: searchParams.get('sort') || 'newest',
    availableOnly: searchParams.get('available') === '1',
    verifiedOnly: searchParams.get('verified') === '1',
    amenities,
  })
}

/** Serialize active filters into URLSearchParams for Browse. */
export function listingFiltersToSearchParams(filters, { view } = {}) {
  const params = new URLSearchParams()
  if (filters.search?.trim()) params.set('search', filters.search.trim())
  if (filters.universityId) params.set('uni', String(filters.universityId))
  if (filters.roomType) params.set('roomType', filters.roomType)
  if (filters.minPrice) params.set('minPrice', String(filters.minPrice))
  if (filters.maxPrice) params.set('maxPrice', String(filters.maxPrice))
  if (filters.genderPreference && filters.genderPreference !== 'any') {
    params.set('gender', filters.genderPreference)
  }
  if (filters.sortBy && filters.sortBy !== 'newest') params.set('sort', filters.sortBy)
  if (filters.availableOnly) params.set('available', '1')
  if (filters.verifiedOnly) params.set('verified', '1')
  if (filters.amenities?.length) params.set('amenities', filters.amenities.join(','))
  if (view === 'map') params.set('view', 'map')
  return params
}
