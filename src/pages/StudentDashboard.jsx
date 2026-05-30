import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Heart, Search } from 'lucide-react'
import { useSavedListingsContext } from '../context/SavedListingsContext'
import { useAuth } from '../hooks/useAuth'
import { useTranslation } from '../hooks/useTranslation'
import ListingCard from '../components/listings/ListingCard'
import Button from '../components/ui/Button'
import { ListingGridSkeleton } from '../components/ui/Skeleton'
import CompareAdvisor from '../components/advisor/CompareAdvisor'
import StudentHousingPanel from '../components/housing/StudentHousingPanel'
import { getUniversityById } from '../lib/universities'
import { getUniversityDisplayName } from '../lib/universityNames'

export default function StudentDashboard() {
  const { profile, profileLoading } = useAuth()
  const { savedListings, loading } = useSavedListingsContext()
  const { t } = useTranslation()
  const [section, setSection] = useState('saved')
  const myUni = getUniversityById(profile?.university_id)
  const pageLoading = loading || profileLoading

  const sections = [
    { id: 'saved', label: t('dashboard.savedTitle') },
    { id: 'housing', label: t('housing.myHousing') },
  ]

  return (
    <div className="mx-auto max-w-7xl px-4 py-5 sm:px-6 sm:py-8 lg:px-8">
      <div className="mb-8 min-h-[4.5rem]">
        {pageLoading ? (
          <div className="space-y-2 animate-pulse">
            <div className="h-9 w-56 rounded-lg bg-border/60" />
            <div className="h-5 w-40 rounded-lg bg-border/40" />
          </div>
        ) : (
          <>
            <h1 className="font-display text-3xl font-bold text-primary">
              {t('dashboard.hello')}, {profile?.full_name?.split(' ')[0] || t('dashboard.student')}
            </h1>
            <p className="mt-2 text-muted">{t('housing.dashboardSubtitle')}</p>
          </>
        )}
      </div>

      <div className="mb-6 flex flex-wrap gap-2">
        {sections.map((s) => (
          <button
            key={s.id}
            type="button"
            onClick={() => setSection(s.id)}
            className={`rounded-lg border px-4 py-2 text-sm font-semibold ${
              section === s.id ? 'border-accent bg-accent/10 text-primary' : 'border-border text-muted'
            }`}
          >
            {s.label}
          </button>
        ))}
      </div>

      {section === 'housing' ? (
        <StudentHousingPanel />
      ) : (
        <div className="min-h-[20rem]">
          {pageLoading ? (
            <ListingGridSkeleton />
          ) : savedListings.length === 0 ? (
            <div className="rounded-xl border border-border bg-surface p-8 text-center sm:p-10">
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
            <>
              <CompareAdvisor listings={savedListings} />
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {savedListings.map((listing) => (
                  <ListingCard key={listing.id} listing={listing} />
                ))}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  )
}
