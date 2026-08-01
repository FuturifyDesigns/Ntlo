import { useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import Hero from '../components/home/Hero'
import FeaturedListings from '../components/home/FeaturedListings'
import HowItWorks, { TrustFeatures } from '../components/home/HowItWorks'
import WelcomeBackBanner from '../components/home/WelcomeBackBanner'
import FilterBar from '../components/listings/FilterBar'
import { useListings } from '../hooks/useListings'
import { useTranslation } from '../hooks/useTranslation'
import Button from '../components/ui/Button'
import { PatternBotswana } from '../components/ui/Icons'
import { emptyListingFilters, listingFiltersToSearchParams } from '../lib/listingFilters'
import { getUniversityById, getUniversityDisplayName } from '../lib/universities'
import { pickPrimaryUniversityMatch } from '../lib/universitySearch'

export default function Home() {
  const navigate = useNavigate()
  const [filters, setFilters] = useState(() => emptyListingFilters())
  const { listings, count, loading } = useListings(filters)
  const { t } = useTranslation()

  const browsePath = useMemo(() => {
    const params = listingFiltersToSearchParams(filters)
    const qs = params.toString()
    return `/listings${qs ? `?${qs}` : ''}`
  }, [filters])

  const universityName = useMemo(() => {
    if (filters.universityId === 'other') return t('filter.otherUniversity')
    if (filters.universityId) {
      return getUniversityDisplayName(getUniversityById(filters.universityId)) || ''
    }
    const match = pickPrimaryUniversityMatch(filters.search)
    return match ? getUniversityDisplayName(match) : ''
  }, [filters.universityId, filters.search, t])

  function goToBrowseWithSearch() {
    navigate(browsePath)
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <WelcomeBackBanner />
      <Hero />

      <section className="relative border-y border-border bg-surface py-6 sm:py-8">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <FilterBar
            filters={filters}
            onChange={setFilters}
            onSearchSubmit={goToBrowseWithSearch}
            resultCount={loading && count === 0 ? null : count}
            universityName={universityName}
          />
        </div>
      </section>

      <FeaturedListings listings={listings} browsePath={browsePath} filtered={Boolean(
        filters.search
        || filters.universityId
        || filters.minPrice
        || filters.maxPrice
        || filters.roomType
        || (filters.genderPreference && filters.genderPreference !== 'any')
        || filters.availableOnly
        || filters.verifiedOnly
        || filters.amenities?.length
      )} />
      <TrustFeatures />

      <section className="relative overflow-hidden bg-primary py-8 sm:py-14 lg:py-16">
        <PatternBotswana className="opacity-40" />
        <div className="relative mx-auto max-w-3xl px-4 text-center">
          <span className="section-label mb-3 text-accent sm:mb-4">{t('landlord.forLandlords')}</span>
          <h2 className="font-display text-2xl font-bold text-white sm:text-3xl lg:text-4xl">{t('landlord.ctaTitle')}</h2>
          <p className="mx-auto mt-3 max-w-lg text-sm text-white/60 sm:mt-4 sm:text-base">{t('landlord.ctaSubtitle')}</p>
          <Button as={Link} to="/register?role=landlord" variant="accent" size="lg" className="mt-5 shadow-lg shadow-accent/25 sm:mt-6">
            {t('nav.listPlace')}
          </Button>
        </div>
      </section>

      <HowItWorks />
    </motion.div>
  )
}
