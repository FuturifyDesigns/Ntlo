import { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Link } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { Heart, Search } from 'lucide-react'
import { useSavedListingsContext } from '../context/SavedListingsContext'
import { useAuth } from '../hooks/useAuth'
import { useTranslation } from '../hooks/useTranslation'
import { useLocale } from '../context/LocaleContext'
import ListingCard from '../components/listings/ListingCard'
import Button from '../components/ui/Button'
import PageShell from '../components/layout/PageShell'
import { ListingGridSkeleton } from '../components/ui/Skeleton'
import CompareAdvisor from '../components/advisor/CompareAdvisor'
import StudentHousingPanel from '../components/housing/StudentHousingPanel'
import { getUniversityById } from '../lib/universities'
import { getUniversityDisplayName } from '../lib/universityNames'

const fade = {
  initial: { opacity: 0, y: 6 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -4 },
  transition: { duration: 0.25, ease: [0.22, 1, 0.36, 1] },
}

export default function StudentDashboard() {
  const { profile, profileLoading } = useAuth()
  const { savedListings, loading } = useSavedListingsContext()
  const { t } = useTranslation()
  const { prefs } = useLocale()
  const [section, setSection] = useState('saved')
  const [searchParams] = useSearchParams()

  useEffect(() => {
    const tab = searchParams.get('tab')
    if (tab && ['applications', 'viewings', 'messages'].includes(tab)) {
      setSection('housing')
    }
  }, [searchParams])
  const myUni = getUniversityById(profile?.university_id)
  const pageLoading = loading || profileLoading
  const motionProps = prefs.reduceMotion ? {} : fade

  const sections = [
    { id: 'saved', label: t('dashboard.savedTitle') },
    { id: 'housing', label: t('housing.myHousing') },
  ]

  return (
    <PageShell className="mx-auto max-w-7xl px-4 py-5 sm:px-6 sm:py-8 lg:px-8">
      <div className="mb-8 min-h-[4.5rem]">
        {pageLoading ? (
          <div className="space-y-2 animate-pulse">
            <div className="h-9 w-56 rounded-lg bg-border/60" />
            <div className="h-5 w-40 rounded-lg bg-border/40" />
          </div>
        ) : (
          <motion.div {...motionProps}>
            <h1 className="font-display text-3xl font-bold text-primary">
              {t('dashboard.hello')}, {profile?.full_name?.split(' ')[0] || t('dashboard.student')}
            </h1>
            <p className="mt-2 text-muted">{t('housing.dashboardSubtitle')}</p>
          </motion.div>
        )}
      </div>

      <div className="mb-6 flex flex-wrap gap-2">
        {sections.map((s) => (
          <button
            key={s.id}
            type="button"
            onClick={() => setSection(s.id)}
            className={`rounded-lg border px-4 py-2 text-sm font-semibold transition-colors ${
              section === s.id ? 'border-accent bg-accent/10 text-primary' : 'border-border text-muted'
            }`}
          >
            {s.label}
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        {section === 'housing' ? (
          <motion.div key="housing" {...motionProps}>
            <StudentHousingPanel />
          </motion.div>
        ) : (
          <motion.div key="saved" className="min-h-[20rem]" {...motionProps}>
            <AnimatePresence mode="wait">
              {pageLoading ? (
                <motion.div key="saved-loading" {...motionProps}>
                  <ListingGridSkeleton count={3} />
                </motion.div>
              ) : savedListings.length === 0 ? (
                <motion.div
                  key="saved-empty"
                  className="rounded-xl border border-border bg-surface p-8 text-center sm:p-10"
                  {...motionProps}
                >
                  <Heart className="mx-auto mb-4 text-muted" size={48} />
                  <p className="text-lg font-medium text-primary">{t('dashboard.noSaved')}</p>
                  <p className="mt-2 text-sm text-muted">{t('dashboard.noSavedDesc')}</p>
                  <div className="mt-6 flex flex-wrap justify-center gap-3">
                    <Button as={Link} to="/listings">
                      <Search size={16} />
                      {t('footer.browseListings')}
                    </Button>
                    {myUni && (
                      <Button as={Link} to={`/universities/${myUni.slug}`} variant="outline">
                        {t('dashboard.findNear')} {getUniversityDisplayName(myUni)}
                      </Button>
                    )}
                  </div>
                </motion.div>
              ) : (
                <motion.div key="saved-grid" {...motionProps}>
                  <CompareAdvisor listings={savedListings} />
                  <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                    {savedListings.map((listing, i) => (
                      <ListingCard key={listing.id} listing={listing} carouselIndex={i} />
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>
    </PageShell>
  )
}
