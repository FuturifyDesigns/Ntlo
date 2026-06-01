import { useState, useEffect, useCallback, useMemo } from 'react'
import { useSearchParams, Link } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { Heart, Search, Sparkles } from 'lucide-react'
import { useSavedListingsContext } from '../context/SavedListingsContext'
import { useAuth } from '../hooks/useAuth'
import { useTranslation } from '../hooks/useTranslation'
import { useLocale } from '../context/LocaleContext'
import { useOnboarding, OnboardingReplayButton, useOnboardingPageState } from '../context/OnboardingContext'
import { useListings } from '../hooks/useListings'
import { useConversations, useStudentHousing } from '../hooks/useHousing'
import ListingCard from '../components/listings/ListingCard'
import Button from '../components/ui/Button'
import Card from '../components/ui/Card'
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
  const { applications, viewings, loading: housingLoading } = useStudentHousing()
  const { conversations, loading: convLoading } = useConversations()
  const { count: marketListingCount, loading: marketLoading } = useListings({})
  const { t } = useTranslation()
  const { prefs } = useLocale()
  const { registerPageHandler } = useOnboarding()
  const [section, setSection] = useState('saved')
  const [housingTab, setHousingTab] = useState('applications')
  const [searchParams] = useSearchParams()

  useEffect(() => {
    const tab = searchParams.get('tab')
    if (tab && ['applications', 'viewings', 'messages'].includes(tab)) {
      setSection('housing')
      setHousingTab(tab)
    }
  }, [searchParams])

  const handleStepEnter = useCallback((step) => {
    if (step.onEnter?.section) setSection(step.onEnter.section)
    if (step.onEnter?.housingTab) setHousingTab(step.onEnter.housingTab)
  }, [])

  useEffect(() => {
    return registerPageHandler('student_dashboard', handleStepEnter)
  }, [registerPageHandler, handleStepEnter])

  const pageLoading = loading || profileLoading || housingLoading || convLoading
  const hasHousingActivity = applications.length + viewings.length + conversations.length > 0

  const onboardingState = useMemo(() => ({
    ready: !pageLoading && !marketLoading,
    savedCount: savedListings.length,
    hasHousingActivity,
    applicationsCount: applications.length,
    viewingsCount: viewings.length,
    messagesCount: conversations.length,
    marketListingCount: marketListingCount ?? 0,
  }), [
    pageLoading,
    marketLoading,
    savedListings.length,
    hasHousingActivity,
    applications.length,
    viewings.length,
    conversations.length,
    marketListingCount,
  ])

  useOnboardingPageState('student_dashboard', onboardingState)

  const myUni = getUniversityById(profile?.university_id)
  const motionProps = prefs.reduceMotion ? {} : fade

  const sections = [
    { id: 'saved', label: t('dashboard.savedTitle') },
    { id: 'housing', label: t('housing.myHousing') },
  ]

  return (
    <PageShell className="mx-auto max-w-7xl px-4 py-5 sm:px-6 sm:py-8 lg:px-8">
      <div className="mb-8 flex flex-wrap items-start justify-between gap-4">
        <div className="min-h-[4.5rem] flex-1">
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
        <div className="flex flex-wrap items-center gap-2">
          <Button as={Link} to="/listings" variant="outline" size="sm" data-onboarding="student-browse-cta">
            <Search size={16} />
            {t('footer.browseListings')}
          </Button>
          <OnboardingReplayButton />
        </div>
      </div>

      <div className="mb-6 flex flex-wrap gap-2" data-onboarding="student-section-tabs">
        {sections.map((s) => (
          <button
            key={s.id}
            type="button"
            data-onboarding={s.id === 'saved' ? 'student-tab-saved' : 'student-tab-housing'}
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
            <StudentHousingPanel tourTab={housingTab} />
          </motion.div>
        ) : (
          <motion.div key="saved" className="min-h-[20rem]" {...motionProps}>
            <AnimatePresence mode="wait">
              {pageLoading ? (
                <motion.div key="saved-loading" {...motionProps}>
                  <ListingGridSkeleton count={3} />
                </motion.div>
              ) : (
                <motion.div key="saved-content" {...motionProps}>
                  {savedListings.length === 0 && (
                    <Card className="mb-8 p-5 sm:p-6" data-onboarding="student-compare">
                      <div className="flex items-start gap-3">
                        <Sparkles size={18} className="mt-0.5 shrink-0 text-accent" />
                        <div>
                          <h2 className="font-display text-lg font-semibold text-primary">{t('advisor.compareTitle')}</h2>
                          <p className="mt-1 text-sm text-muted">{t('advisor.compareNeedMore')}</p>
                        </div>
                      </div>
                    </Card>
                  )}
                  {savedListings.length >= 1 && <CompareAdvisor listings={savedListings} />}
                  {savedListings.length === 0 ? (
                    <div
                      className="rounded-xl border border-border bg-surface p-8 text-center sm:p-10"
                      data-onboarding="student-saved-empty"
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
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                      {savedListings.map((listing, i) => (
                        <ListingCard key={listing.id} listing={listing} carouselIndex={i} />
                      ))}
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>
    </PageShell>
  )
}
