import { useParams, Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { MapPin, ArrowLeft, Home } from 'lucide-react'
import { getUniversityBySlug, getUniversityImage } from '../lib/universities'
import FilterBar from '../components/listings/FilterBar'
import ListingGrid from '../components/listings/ListingGrid'
import { useListings } from '../hooks/useListings'
import { useState } from 'react'
import Button from '../components/ui/Button'
import { AnimatedCounter } from '../components/ui/Motion'
import { useTranslation } from '../hooks/useTranslation'

export default function UniversityPage() {
  const { slug } = useParams()
  const university = getUniversityBySlug(slug)
  const { t } = useTranslation()
  const [filters, setFilters] = useState({
    universityId: university?.id || '',
    availableOnly: true,
    sortBy: 'distance',
    search: '',
    minPrice: '',
    maxPrice: '',
    roomType: '',
    genderPreference: 'any',
    amenities: [],
  })

  const { listings, loading, error, count, page, setPage, pageSize } = useListings(filters)

  if (!university) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-16 text-center">
        <p className="text-lg text-primary">{t('universities.notFound')}</p>
        <Button as={Link} to="/universities" variant="outline" className="mt-4">
          {t('dashboard.backToUniversities')}
        </Button>
      </div>
    )
  }

  const campusImage = getUniversityImage(university)

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <section className="relative h-[200px] overflow-hidden sm:h-[280px] lg:h-[340px]">
        <img src={campusImage} alt={university.name} className="h-full w-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-primary via-primary/60 to-primary/30" />

        <div className="absolute inset-0 flex flex-col justify-end">
          <div className="mx-auto w-full max-w-7xl px-4 pb-8 sm:px-6 lg:px-8">
            <Link
              to="/universities"
              className="mb-4 inline-flex items-center gap-1.5 text-sm text-white/70 transition-colors hover:text-white"
            >
              <ArrowLeft size={15} />
              {t('universities.allUniversities')}
            </Link>

            <div className="flex flex-wrap items-end justify-between gap-4">
              <div>
                <span className="mb-2 inline-block rounded-full bg-accent px-3 py-0.5 text-xs font-bold uppercase tracking-wide text-primary">
                  {university.short_name}
                </span>
                <h1 className="font-display text-3xl font-semibold text-white sm:text-4xl">{university.name}</h1>
                <p className="mt-2 flex items-center gap-1.5 text-white/75">
                  <MapPin size={15} />
                  {university.city}
                </p>
              </div>

              <div className="rounded-xl bg-white/10 px-5 py-3 backdrop-blur-md">
                <p className="font-display text-3xl font-semibold text-accent">
                  {loading ? '—' : <AnimatedCounter value={count} />}
                </p>
                <p className="text-xs uppercase tracking-wider text-white/60">
                  {count === 1 ? t('universities.listingAvailable') : t('universities.listingsAvailable')}
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="border-b border-border bg-surface py-5">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted">
            {t('universities.popularAreas')}
          </p>
          <div className="flex flex-wrap gap-2">
            {university.nearby_areas.map((area) => (
              <button
                key={area}
                onClick={() => setFilters((f) => ({ ...f, search: area }))}
                className="rounded-full border border-border bg-background px-3 py-1 text-sm text-primary transition-colors hover:border-accent hover:bg-accent/10"
              >
                {area}
              </button>
            ))}
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-7xl px-4 py-5 sm:px-6 sm:py-8 lg:px-8">
        <div className="mb-6">
          <FilterBar
            filters={filters}
            onChange={setFilters}
            resultCount={count}
            universityName={university.short_name}
          />
        </div>

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

        {count === 0 && !loading && (
          <div className="mt-8 text-center">
            <Button as={Link} to="/listings" variant="outline">
              <Home size={16} />
              {t('universities.browseAll')}
            </Button>
          </div>
        )}
      </div>
    </motion.div>
  )
}
