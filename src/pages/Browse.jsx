import { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Map, LayoutGrid } from 'lucide-react'
import { motion } from 'framer-motion'
import FilterBar from '../components/listings/FilterBar'
import ListingGrid from '../components/listings/ListingGrid'
import ListingMap from '../components/listings/ListingMap'
import { useListings } from '../hooks/useListings'
import { getUniversityById } from '../lib/universities'
import { useTranslation } from '../hooks/useTranslation'

export default function Browse() {
  const [searchParams] = useSearchParams()
  const [view, setView] = useState('grid')
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

  const { listings, loading, error, count, page, setPage, pageSize } = useListings({
    ...filters,
    mapMode: view === 'map',
  })
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
              : uni?.short_name
          }
        />
      </div>

      <div className="mb-6 flex gap-2">
        <button
          onClick={() => setView('grid')}
          className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium ${
            view === 'grid' ? 'bg-primary text-white' : 'bg-surface border border-border text-muted'
          }`}
        >
          <LayoutGrid size={16} />
          {t('listings.grid')}
        </button>
        <button
          onClick={() => setView('map')}
          className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium ${
            view === 'map' ? 'bg-primary text-white' : 'bg-surface border border-border text-muted'
          }`}
        >
          <Map size={16} />
          {t('listings.map')}
        </button>
      </div>

      {view === 'map' ? (
        <>
          {loading && (
            <p className="mb-3 text-sm text-muted">{t('listings.loadingMap')}</p>
          )}
          <ListingMap
            listings={listings}
            height="500px"
            emptyHint={t('listings.mapNoLocations')}
          />
        </>
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
    </motion.div>
  )
}
