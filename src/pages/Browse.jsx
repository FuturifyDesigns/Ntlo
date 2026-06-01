import { useState, useEffect, useMemo, useCallback } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Map, LayoutGrid } from 'lucide-react'
import FilterBar from '../components/listings/FilterBar'
import ListingGrid from '../components/listings/ListingGrid'
import ListingMap from '../components/listings/ListingMap'
import { useListings } from '../hooks/useListings'
import { useAuth } from '../hooks/useAuth'
import { OnboardingReplayButton, useOnboardingPageState } from '../context/OnboardingContext'
import { getUniversityById, getUniversityMapViewport, getUniversityDisplayName } from '../lib/universities'
import { pickPrimaryUniversityMatch } from '../lib/universitySearch'
import { useTranslation } from '../hooks/useTranslation'

export default function Browse() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [view, setView] = useState(searchParams.get('view') === 'map' ? 'map' : 'grid')
  const { t } = useTranslation()
  const { user, profile } = useAuth()
  const [filters, setFilters] = useState({
    search: searchParams.get('search') || '',
    universityId: searchParams.get('uni') ? Number(searchParams.get('uni')) : '',
    minPrice: '',
    maxPrice: '',
    roomType: '',
    genderPreference: 'any',
    sortBy: 'newest',
    availableOnly: false,
    amenities: [],
  })

  useEffect(() => {
    const search = searchParams.get('search')
    if (search) setFilters((f) => ({ ...f, search }))
  }, [searchParams])

  const queryFilters = useMemo(
    () => ({ ...filters, mapMode: view === 'map' }),
    [filters, view]
  )

  const searchUniversityMatch = useMemo(() => {
    if (filters.universityId) return null
    return pickPrimaryUniversityMatch(filters.search)
  }, [filters.search, filters.universityId])

  const mapViewport = useMemo(() => {
    if (filters.universityId && filters.universityId !== 'other') {
      return getUniversityMapViewport(getUniversityById(filters.universityId))
    }
    if (searchUniversityMatch) {
      return getUniversityMapViewport(searchUniversityMatch)
    }
    return null
  }, [filters.universityId, searchUniversityMatch])

  const syncSearchToUrl = useCallback(() => {
    const params = new URLSearchParams()
    if (filters.search?.trim()) params.set('search', filters.search.trim())
    if (filters.universityId) params.set('uni', String(filters.universityId))
    if (view === 'map') params.set('view', 'map')
    setSearchParams(params, { replace: true })
    document.getElementById('browse-results')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }, [filters.search, filters.universityId, view, setSearchParams])

  const { listings, loading, isFetching, error, count, page, setPage, pageSize } = useListings(queryFilters)
  const uni = filters.universityId ? getUniversityById(filters.universityId) : searchUniversityMatch

  const onboardingPageKey = profile?.role === 'student'
    ? 'student_browse'
    : profile?.role === 'landlord'
      ? 'landlord_browse'
      : null

  const browseOnboardingState = useMemo(() => ({
    ready: !loading,
    listingCount: count ?? listings.length,
  }), [loading, count, listings.length])

  useOnboardingPageState(onboardingPageKey, browseOnboardingState)

  return (
    <div className="mx-auto max-w-7xl px-4 py-5 sm:px-6 sm:py-8 lg:px-8">
      <div className="mb-5 flex flex-wrap items-start justify-between gap-4 sm:mb-8">
        <div>
          <h1 className="font-display text-2xl font-bold text-primary sm:text-3xl">{t('listings.browseTitle')}</h1>
          <p className="mt-2 text-muted">{t('listings.browseSubtitle')}</p>
        </div>
        {user && (profile?.role === 'student' || profile?.role === 'landlord') && (
          <OnboardingReplayButton />
        )}
      </div>

      <div className="mb-6" data-onboarding="browse-filters">
        <FilterBar
          filters={filters}
          onChange={setFilters}
          onSearchSubmit={syncSearchToUrl}
          resultCount={count}
          universityName={
            filters.universityId === 'other'
              ? t('filter.otherUniversity')
              : getUniversityDisplayName(uni)
          }
        />
      </div>

      <div className="mb-6 flex gap-2" data-onboarding="browse-view-toggle">
        <button
          type="button"
          onClick={() => setView('grid')}
          className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium ${
            view === 'grid' ? 'bg-primary text-white' : 'bg-surface border border-border text-muted'
          }`}
        >
          <LayoutGrid size={16} />
          {t('listings.grid')}
        </button>
        <button
          type="button"
          onClick={() => setView('map')}
          className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium ${
            view === 'map' ? 'bg-primary text-white' : 'bg-surface border border-border text-muted'
          }`}
        >
          <Map size={16} />
          {t('listings.map')}
        </button>
      </div>

      <div id="browse-results" className="relative min-h-[420px]" data-onboarding="browse-listings">
        {isFetching && listings.length > 0 && (
          <div
            className="pointer-events-none absolute inset-x-0 top-0 z-10 h-0.5 overflow-hidden rounded-full bg-border"
            aria-hidden
          >
            <div className="h-full w-1/3 animate-pulse bg-accent" />
          </div>
        )}

        {view === 'map' ? (
          <ListingMap
            listings={listings}
            viewport={mapViewport}
            height="500px"
            interactive
            emptyHint={t('listings.mapNoLocations')}
          />
        ) : (
          <ListingGrid
            listings={listings}
            loading={loading}
            error={error}
            count={count}
            page={page}
            setPage={setPage}
            pageSize={pageSize}
            emptyMessage={t('listings.noResults')}
          />
        )}
      </div>
    </div>
  )
}
