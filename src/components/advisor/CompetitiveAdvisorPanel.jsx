import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { Sparkles, TrendingUp, TrendingDown, Trophy, Loader2, Edit, BarChart3 } from 'lucide-react'
import { useTranslation } from '../../hooks/useTranslation'
import { useAuth } from '../../hooks/useAuth'
import { useCompetitiveMarket, useLandlordListings, useBatchCompetitiveMarkets } from '../../hooks/useCompetitiveMarket'
import {
  analyzeCompetitivePosition,
  analyzeLandlordVsListing,
  buildCompetitiveSummary,
  getMarketKey,
} from '../../lib/competitiveAdvisor'
import { getScoreColor } from '../../lib/aiAdvisor'
import { getListingOccupancy, isListingRented } from '../../lib/listingOccupancy'
import { formatPrice } from '../../lib/utils'
import Card from '../ui/Card'
import Badge from '../ui/Badge'
import Button from '../ui/Button'
import AdvisorLiveBanner from './AdvisorLiveBanner'
import { useLiveRevision } from '../../hooks/useLiveRevision'

function ScoreBar({ label, score, t }) {
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-xs">
        <span className="text-muted">{label}</span>
        <span className={`font-semibold ${getScoreColor(score)}`}>{score}</span>
      </div>
      <div className="h-1.5 overflow-hidden rounded-full bg-background">
        <div className="h-full rounded-full bg-accent transition-all duration-500" style={{ width: `${score}%` }} />
      </div>
    </div>
  )
}

export default function CompetitiveAdvisorPanel({ listing }) {
  const { t } = useTranslation()
  const { user, profile, isLandlord } = useAuth()
  const { marketListings, loading, lastSyncedAt } = useCompetitiveMarket(listing)
  const { listings: myListings } = useLandlordListings(isLandlord ? user?.id : null)

  const isOwn = listing?.landlord_id === user?.id

  const { isFresh } = useLiveRevision([
    listing?.id,
    listing?.updated_at,
    listing?.price,
    marketListings?.length,
    myListings?.length,
  ])

  const result = useMemo(() => {
    if (!listing || !isLandlord) return null
    if (isOwn) {
      return {
        type: 'own',
        data: analyzeCompetitivePosition(listing, marketListings, {
          landlordId: user?.id,
          context: {},
        }),
      }
    }
    return {
      type: 'competitor',
      data: analyzeLandlordVsListing(myListings, listing, marketListings, {
        landlordId: user?.id,
        context: {},
      }),
    }
  }, [listing, marketListings, myListings, isLandlord, isOwn, user?.id])

  if (!isLandlord || !listing) return null

  if (loading && !marketListings.length) {
    return (
      <Card className="flex items-center justify-center gap-2 p-5 text-sm text-muted">
        <Loader2 size={16} className="animate-spin" />
        {t('advisor.competitive.loading')}
      </Card>
    )
  }

  if (!result?.data) return null

  if (result.type === 'own') {
    const pos = result.data
    if (!pos) return null

    return (
      <Card className="space-y-4 border-accent/25 p-5">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div className="flex items-start gap-2">
            <BarChart3 size={18} className="mt-0.5 shrink-0 text-accent" />
            <div>
              <h3 className="font-display font-semibold text-primary">{t('advisor.competitive.title')}</h3>
              <p className="mt-1 text-xs text-muted">{t('advisor.competitive.subtitle')}</p>
            </div>
          </div>
          <AdvisorLiveBanner isFresh={isFresh} updatedAt={lastSyncedAt} />
        </div>

        <div className="rounded-lg border border-border bg-background p-3">
          <p className="text-sm text-primary">{buildCompetitiveSummary(pos, t)}</p>
          <div className="mt-2 flex flex-wrap gap-2">
            <Badge variant={pos.position === 'leading' ? 'success' : pos.position === 'rented' ? 'warning' : 'default'}>
              {t(`advisor.competitive.position.${pos.position}`)}
            </Badge>
            {pos.rank && (
              <Badge>{t('advisor.competitive.rankBadge', { rank: pos.rank, total: pos.availableCount })}</Badge>
            )}
            {pos.rentedCount > 0 && (
              <Badge variant="default">{t('advisor.competitive.rentedNearby', { count: pos.rentedCount })}</Badge>
            )}
          </div>
        </div>

        {getListingOccupancy(listing) === 'available' && (
          <div className="grid gap-2">
            <ScoreBar label={t('advisor.score.price')} score={pos.targetScore.scores.price} t={t} />
            <ScoreBar label={t('advisor.score.trust')} score={pos.targetScore.scores.trust} t={t} />
            <ScoreBar label={t('advisor.score.amenities')} score={pos.targetScore.scores.amenities} t={t} />
          </div>
        )}

        {pos.strengths.length > 0 && (
          <div>
            <p className="mb-2 flex items-center gap-1 text-sm font-medium text-success">
              <TrendingUp size={14} />
              {t('advisor.competitive.strengths')}
            </p>
            <ul className="space-y-1.5 text-sm text-muted">
              {pos.strengths.map((s, i) => (
                <li key={i} className="leading-relaxed">{t(`advisor.competitive.strength.${s.key}`, s.meta || {})}</li>
              ))}
            </ul>
          </div>
        )}

        {pos.weaknesses.length > 0 && (
          <div>
            <p className="mb-2 flex items-center gap-1 text-sm font-medium text-amber-700">
              <TrendingDown size={14} />
              {t('advisor.competitive.gaps')}
            </p>
            <ul className="space-y-1.5 text-sm text-muted">
              {pos.weaknesses.map((w, i) => (
                <li key={i} className="leading-relaxed">{t(`advisor.competitive.gap.${w.key}`, w.meta || {})}</li>
              ))}
            </ul>
          </div>
        )}

        {pos.actions.length > 0 && (
          <div>
            <p className="mb-2 text-sm font-medium text-accent">{t('advisor.competitive.actions')}</p>
            <ul className="space-y-2">
              {pos.actions.map((a, i) => (
                <li key={i} className="rounded-lg border border-border bg-background px-3 py-2 text-sm text-primary">
                  {t(`advisor.competitive.action.${a.key}`, a.meta || {})}
                </li>
              ))}
            </ul>
          </div>
        )}

        {pos.topCompetitor && pos.topCompetitor.listing.id !== listing.id && (
          <p className="text-xs text-muted">
            {t('advisor.competitive.topRival', {
              title: pos.topCompetitor.listing.title,
              score: pos.topCompetitor.analysis.overall,
              price: formatPrice(pos.topCompetitor.listing.price),
            })}
          </p>
        )}

        <Button as={Link} to={`/landlord/listings/${listing.id}/edit`} variant="outline" size="sm" className="w-full">
          <Edit size={14} />
          {t('advisor.competitive.editListing')}
        </Button>
      </Card>
    )
  }

  const vs = result.data

  return (
    <Card className="space-y-4 border-accent/25 p-5">
      <div className="flex items-start gap-2">
        <Sparkles size={18} className="mt-0.5 text-accent" />
        <div>
          <h3 className="font-display font-semibold text-primary">{t('advisor.competitive.vsTitle')}</h3>
          <p className="mt-1 text-xs text-muted">{t('advisor.competitive.vsSubtitle')}</p>
        </div>
      </div>

      <div className="rounded-lg border border-border bg-background p-3 text-sm">
        <p className="font-medium text-primary">{listing.title}</p>
        <p className={`mt-1 font-semibold ${getScoreColor(vs.competitorAnalysis.overall)}`}>
          {t('advisor.matchScore', { score: vs.competitorAnalysis.overall })}
          {isListingRented(listing) && (
            <span className="ml-2 text-xs font-normal text-muted">({t('listings.rented')})</span>
          )}
        </p>
        {vs.competitorPosition?.rank && (
          <p className="mt-1 text-xs text-muted">
            {t('advisor.competitive.rankBadge', {
              rank: vs.competitorPosition.rank,
              total: vs.competitorPosition.availableCount,
            })}
          </p>
        )}
      </div>

      {vs.mode === 'noLocalListing' ? (
        <div className="space-y-3">
          <p className="text-sm text-muted">{t('advisor.competitive.noLocalListing')}</p>
          <Button as={Link} to="/landlord/listings/new" size="sm" className="w-full">
            {t('advisor.competitive.createInMarket')}
          </Button>
        </div>
      ) : (
        <>
          {vs.myComparisons.map(({ listing: mine, position, gaps }) => (
            <div key={mine.id} className="space-y-2 rounded-lg border border-border p-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="font-semibold text-primary">{mine.title}</p>
                {position.rank && (
                  <Badge>{t('advisor.competitive.rankBadge', { rank: position.rank, total: position.availableCount })}</Badge>
                )}
              </div>
              <p className={`text-sm font-semibold ${getScoreColor(position.targetScore.overall)}`}>
                {t('advisor.competitive.yourScore', { score: position.targetScore.overall })}
                <span className="font-normal text-muted"> · </span>
                {t('advisor.competitive.vsScore', { score: vs.competitorAnalysis.overall })}
              </p>
              {gaps.length > 0 && (
                <ul className="space-y-1.5 text-sm text-muted">
                  {gaps.map((g, i) => (
                    <li key={i} className="leading-relaxed">{t(`advisor.competitive.gap.${g.key}`, g.meta || {})}</li>
                  ))}
                </ul>
              )}
              {position.actions.slice(0, 2).map((a, i) => (
                <p key={i} className="text-sm text-primary">
                  {t(`advisor.competitive.action.${a.key}`, a.meta || {})}
                </p>
              ))}
              <Button as={Link} to={`/landlord/listings/${mine.id}/edit`} variant="outline" size="sm">
                <Edit size={14} />
                {t('advisor.competitive.improveMine')}
              </Button>
            </div>
          ))}
        </>
      )}

      <Button as={Link} to="/listings" variant="outline" size="sm" className="w-full">
        {t('advisor.competitive.browseMarket')}
      </Button>
    </Card>
  )
}

export function LandlordMarketOverview({ listings: propListings }) {
  const { t } = useTranslation()
  const { user } = useAuth()
  const { listings: fetched, loading } = useLandlordListings(propListings ? null : user?.id)
  const listings = propListings || fetched

  const overview = useMemo(() => {
    if (!listings?.length) return []
    return listings
      .filter((l) => getListingOccupancy(l) !== 'unavailable')
      .slice(0, 6)
  }, [listings])

  const { marketsByKey, loading: marketsLoading } = useBatchCompetitiveMarkets(overview)

  if (loading && !listings.length) {
    return (
      <div className="flex justify-center py-6">
        <Loader2 className="animate-spin text-muted" />
      </div>
    )
  }

  if (!overview.length) return null

  return (
    <div className="space-y-4 rounded-xl border border-border bg-surface p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <Trophy size={18} className="text-accent" />
            <h2 className="font-display text-xl font-semibold text-primary">{t('advisor.competitive.marketTitle')}</h2>
          </div>
          <p className="mt-1 text-sm text-muted">{t('advisor.competitive.marketSubtitle')}</p>
        </div>
        <Button as={Link} to="/listings" variant="outline" size="sm">
          {t('advisor.competitive.browseMarket')}
        </Button>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        {overview.map((listing) => (
          <MarketListingCard
            key={listing.id}
            listing={listing}
            landlordId={user?.id}
            marketListings={marketsByKey.get(getMarketKey(listing)) || []}
            loadingMarket={marketsLoading}
            t={t}
          />
        ))}
      </div>
    </div>
  )
}

function MarketListingCard({ listing, landlordId, marketListings, loadingMarket, t }) {
  const pos = useMemo(
    () => analyzeCompetitivePosition(listing, marketListings, { landlordId, context: {} }),
    [listing, marketListings, landlordId]
  )

  return (
    <Link
      to={`/listings/${listing.id}`}
      className="block rounded-xl border border-border p-4 transition hover:border-accent/40 hover:bg-background"
    >
      <p className="font-semibold text-primary line-clamp-1">{listing.title}</p>
      <p className="mt-1 text-sm text-muted">{formatPrice(listing.price)}{t('listings.perMo')}</p>
      {loadingMarket && !pos ? (
        <Loader2 size={14} className="mt-2 animate-spin text-muted" />
      ) : pos ? (
        <div className="mt-2 flex flex-wrap gap-2">
          {pos.rank ? (
            <Badge variant={pos.rank === 1 ? 'success' : 'default'}>
              {t('advisor.competitive.rankBadge', { rank: pos.rank, total: pos.availableCount })}
            </Badge>
          ) : (
            <Badge variant="warning">{t(`advisor.competitive.position.${pos.position}`)}</Badge>
          )}
          <span className={`text-xs font-semibold transition-all duration-500 ${getScoreColor(pos.targetScore.overall)}`}>
            {pos.targetScore.overall}/100
          </span>
        </div>
      ) : null}
    </Link>
  )
}
