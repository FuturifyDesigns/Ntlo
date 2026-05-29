import { useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import Hero from '../components/home/Hero'
import FeaturedListings from '../components/home/FeaturedListings'
import HowItWorks, { TrustFeatures } from '../components/home/HowItWorks'
import FilterBar from '../components/listings/FilterBar'
import { useListings } from '../hooks/useListings'
import { useTranslation } from '../hooks/useTranslation'
import Button from '../components/ui/Button'
import { PatternBotswana } from '../components/ui/Icons'

export default function Home() {
  const [filters, setFilters] = useState({ availableOnly: true, sortBy: 'newest' })
  const { listings } = useListings({ ...filters, sortBy: 'newest' })
  const { t } = useTranslation()

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <Hero />

      <section className="relative border-y border-border bg-surface py-6 sm:py-8">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <FilterBar filters={filters} onChange={setFilters} resultCount={listings.length} />
        </div>
      </section>

      <FeaturedListings listings={listings} />
      <TrustFeatures />

      <section className="relative overflow-hidden bg-primary py-10 sm:py-14 lg:py-16">
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
