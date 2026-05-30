import { useState, useEffect, useMemo } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Map, LayoutGrid } from 'lucide-react'
import { motion } from 'framer-motion'
import FilterBar from '../components/listings/FilterBar'
import ListingGrid from '../components/listings/ListingGrid'
import ListingMap from '../components/listings/ListingMap'
import { useListings } from '../hooks/useListings'
import { getUniversityById, getUniversityMapViewport, getUniversityDisplayName } from '../lib/universities'
import { useTranslation } from '../hooks/useTranslation'

export default function Browse() {
  const [searchParams] = useSearchParams()
  const [view, setView] = useState(searchParams.get('view') === 'map' ? 'map' : 'grid')
  const { t } = useTranslation()
  const [filters, setFilters] = useState({
    search: searchParams.get('search') || '',
    universityId: searchParams.get('uni') ? Number(searchParams.get('uni')) : '',
    minPrice: '',
    maxPrice: '',
    roomType: '',
    genderPreference: 'any',
    sortBy: 'newest',
    availableOnly: true,
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

  const mapViewport = useMemo(() => {
    if (filters.universityId && filters.universityId !== 'other') {
      return getUniversityMapViewport(getUniversityById(filters.universityId))
    }
    return null
  }, [filters.universityId])

  const { listings, loading, isFetching, error, count, page, setPage, pageSize } = useListings(queryFilters)
  const uni = filters.universityId ? getUniversityById(filters.universityId) : null

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="mx-auto max-w-7xl px-4 py-5 sm:px-6 sm:py-8 lg:px-8"
    >
      <div className="mb-5 sm:mb-8">
        <h1 className="font-display text-2xl font-bold text-primary sm:text-3xl">{t('listings.browseTitle')}</h1>
        <p className="mt-2 text-muted">{t('listings.browseSubtitle')}</p>
      </div>

      <div className="mb-6">
        <FilterBar
          filters={filters}
          onChange={setFilters}
          resultCount={count}
          universityName={
            filters.universityId === 'other'
              ? t('filter.otherUniversity')
              : getUniversityDisplayName(uni)
          }
        />
      </div>

      <div className="mb-6 flex gap-2">
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

      <div className="relative min-h-[420px]">
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
    </motion.div>
  )
}
