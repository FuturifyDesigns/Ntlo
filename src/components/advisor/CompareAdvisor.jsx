import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { Sparkles, MapPin, Banknote, Trophy, Heart } from 'lucide-react'
import { compareListings } from '../../lib/listingAdvisor'
import { getScoreColor } from '../../lib/aiAdvisor'
import { useAuth } from '../../hooks/useAuth'
import { useTranslation } from '../../hooks/useTranslation'
import { formatPrice } from '../../lib/utils'
import Card from '../ui/Card'
import Button from '../ui/Button'

export default function CompareAdvisor({ listings }) {
  const { profile } = useAuth()
  const { t } = useTranslation()

  const comparison = useMemo(
    () => compareListings(listings, { studentUniversityId: profile?.university_id }),
    [listings, profile?.university_id]
  )

  if (listings.length === 0) return null

  if (listings.length === 1) {
    return (
      <Card className="mb-8 p-5 sm:p-6" data-onboarding="student-compare">
        <div className="flex items-start gap-3">
          <Sparkles size={18} className="mt-0.5 shrink-0 text-accent" />
          <div>
            <h2 className="font-display text-lg font-semibold text-primary">{t('advisor.compareTitle')}</h2>
            <p className="mt-1 text-sm text-muted">{t('advisor.compareNeedMore')}</p>
            <Button as={Link} to="/listings" variant="outline" size="sm" className="mt-3">
              <Heart size={14} />
              {t('advisor.findMore')}
            </Button>
          </div>
        </div>
      </Card>
    )
  }

  const { ranked, bestId, cheapestId, closestId, summaryKey, meta } = comparison

  return (
    <Card className="mb-8 space-y-5 p-5 sm:p-6" data-onboarding="student-compare">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Sparkles size={18} className="text-accent" />
            <h2 className="font-display text-lg font-semibold text-primary">{t('advisor.compareTitle')}</h2>
          </div>
          <p className="mt-1 text-sm text-muted">{t(`advisor.${summaryKey}`, meta)}</p>
        </div>
        <Button as={Link} to="/listings" variant="outline" size="sm">
          {t('advisor.findMore')}
        </Button>
      </div>

      <div className="space-y-3">
        {ranked.map(({ listing, analysis }, index) => (
          <Link
            key={listing.id}
            to={`/listings/${listing.id}`}
            className={`flex flex-wrap items-center gap-3 rounded-xl border p-4 transition-colors hover:bg-background ${
              listing.id === bestId ? 'border-accent/40 bg-accent/5' : 'border-border'
            }`}
          >
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-sm font-bold text-white">
              {index + 1}
            </span>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <p className="truncate font-semibold text-primary">{listing.title}</p>
                {listing.id === bestId && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-accent/15 px-2 py-0.5 text-xs font-semibold text-accent">
                    <Trophy size={12} />
                    {t('advisor.bestMatch')}
                  </span>
                )}
              </div>
              <div className="mt-1 flex flex-wrap gap-3 text-xs text-muted">
                <span className={`font-semibold ${getScoreColor(analysis.overall)}`}>
                  {t('advisor.matchScore', { score: analysis.overall })}
                </span>
                <span className="inline-flex items-center gap-1">
                  <Banknote size={12} />
                  {formatPrice(listing.price)}{t('listings.perMo')}
                </span>
                {analysis.distanceKm != null && (
                  <span className="inline-flex items-center gap-1">
                    <MapPin size={12} />
                    {analysis.distanceKm.toFixed(1)} km
                  </span>
                )}
                {listing.id === cheapestId && listing.id !== bestId && (
                  <span className="text-success">{t('advisor.cheapest')}</span>
                )}
                {listing.id === closestId && listing.id !== bestId && (
                  <span className="text-accent">{t('advisor.closest')}</span>
                )}
              </div>
            </div>
          </Link>
        ))}
      </div>
    </Card>
  )
}
