import { Link } from 'react-router-dom'
import { ArrowRight } from 'lucide-react'
import { motion } from 'framer-motion'
import ListingCard from '../listings/ListingCard'
import { useTranslation } from '../../hooks/useTranslation'

export default function FeaturedListings({ listings }) {
  const { t } = useTranslation()
  const hasListings = listings.length > 0

  return (
    <section className="py-7 sm:py-12 lg:py-16">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-6 flex flex-col gap-3 sm:mb-8 sm:flex-row sm:items-end sm:justify-between sm:gap-4">
          <div>
            <span className="section-label mb-3">{t('featured.topPicks')}</span>
            <h2 className="font-display text-2xl font-bold text-primary sm:text-3xl lg:text-4xl">{t('listings.recommended')}</h2>
            <p className="mt-2 text-muted">{t('listings.verifiedNearCampus')}</p>
          </div>
          {hasListings && (
            <Link
              to="/listings"
              className="hidden shrink-0 items-center gap-1.5 rounded-lg border border-border bg-surface px-4 py-2 text-sm font-semibold text-primary transition-colors hover:border-accent/40 hover:text-accent sm:flex"
            >
              {t('listings.viewAll')}
              <ArrowRight size={15} />
            </Link>
          )}
        </div>

        {hasListings ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3"
          >
            {listings.slice(0, 6).map((listing, i) => (
              <motion.div
                key={listing.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.08, duration: 0.4 }}
              >
                <ListingCard listing={listing} carouselIndex={i} />
              </motion.div>
            ))}
          </motion.div>
        ) : (
          <div className="card-elevated p-6 text-center sm:p-10">
            <p className="font-display text-xl font-semibold text-primary">{t('listings.comingSoon')}</p>
            <p className="mx-auto mt-2 max-w-sm text-sm text-muted">{t('listings.comingSoonDesc')}</p>
            <Link
              to="/register?role=landlord"
              className="mt-5 inline-flex items-center gap-1.5 rounded-lg bg-accent px-5 py-2.5 text-sm font-semibold text-primary transition-opacity hover:opacity-90"
            >
              {t('listings.listFree')}
              <ArrowRight size={15} />
            </Link>
          </div>
        )}

        {hasListings && (
          <Link
            to="/listings"
            className="mt-6 flex items-center justify-center gap-1.5 text-sm font-semibold text-accent hover:underline sm:hidden"
          >
            {t('featured.viewAllListings')}
            <ArrowRight size={15} />
          </Link>
        )}
      </div>
    </section>
  )
}
