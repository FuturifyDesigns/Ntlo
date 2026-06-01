import { useState, useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { Plus, Edit, Trash2, Eye, ToggleLeft, ToggleRight, AlertCircle, CreditCard } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'
import { useTranslation } from '../hooks/useTranslation'
import { useLocale } from '../context/LocaleContext'
import Button from '../components/ui/Button'
import Badge from '../components/ui/Badge'
import Card from '../components/ui/Card'
import PageShell from '../components/layout/PageShell'
import { Skeleton } from '../components/ui/Skeleton'
import { formatPrice, getCoverPhoto } from '../lib/utils'
import ListingMap from '../components/listings/ListingMap'
import LandlordWelcomeBanner from '../components/landlord/LandlordWelcomeBanner'
import EarlyAccessBanner from '../components/landlord/EarlyAccessBanner'
import EarlyAccessLandlordNote from '../components/landlord/EarlyAccessLandlordNote'
import LandlordInquiriesPanel from '../components/housing/LandlordInquiriesPanel'
import { LandlordMarketOverview } from '../components/advisor/CompetitiveAdvisorPanel'
import { getListingOccupancy } from '../lib/listingOccupancy'
import { relistListing } from '../lib/housing'
import { withdrawListing } from '../lib/listingPublish'
import { mapListingEditError } from '../lib/listingEditPolicy'
import { getListingLandlordActions } from '../lib/listingReviewPolicy'
import { MAPS_ENABLED } from '../lib/googleMaps'
import { OnboardingReplayButton } from '../context/OnboardingContext'

const PLACEHOLDER = 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=400&q=80'

const fade = {
  initial: { opacity: 0, y: 6 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -4 },
  transition: { duration: 0.25, ease: [0.22, 1, 0.36, 1] },
}

/** Avoid skeleton flash when returning to My Listings via bottom nav. */
let listingsCache = { userId: null, items: [] }

export default function LandlordDashboard() {
  const { user, profile } = useAuth()
  const { t } = useTranslation()
  const { prefs } = useLocale()
  const location = useLocation()
  const [statusBanner, setStatusBanner] = useState(() => {
    if (location.state?.listingSubmitted) return 'submitted'
    if (location.state?.listingResubmitted) return 'resubmitted'
    return null
  })
  const cached = user?.id && listingsCache.userId === user.id ? listingsCache.items : []
  const [listings, setListings] = useState(cached)
  const [loading, setLoading] = useState(!cached.length)
  const [filter, setFilter] = useState('all')
  const motionProps = prefs.reduceMotion ? {} : fade

  async function fetchListings({ silent = false } = {}) {
    if (!user) return
    if (!silent) setLoading(true)
    const { data } = await supabase
      .from('listings')
      .select(`
        id, title, price, area, city, lat, lng, available, occupancy_status, verification_status, verification_notes, views, is_verified, created_at,
        cover_photo:listing_photos(url, is_cover)
      `)
      .eq('landlord_id', user.id)
      .order('created_at', { ascending: false })
    setListings(data || [])
    if (user?.id) listingsCache = { userId: user.id, items: data || [] }
    if (!silent) setLoading(false)
  }

  useEffect(() => {
    if (!statusBanner) return undefined
    const timer = setTimeout(() => setStatusBanner(null), 8000)
    return () => clearTimeout(timer)
  }, [statusBanner])

  useEffect(() => {
    if (!user) return
    fetchListings({ silent: listingsCache.userId === user.id && listingsCache.items.length > 0 })
  }, [user])

  useEffect(() => {
    if (!user?.id) return undefined

    const channel = supabase
      .channel(`landlord-listings-${user.id}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'listings', filter: `landlord_id=eq.${user.id}` },
        () => fetchListings({ silent: true })
      )
      .subscribe()

    return () => supabase.removeChannel(channel)
  }, [user?.id])

  async function markTaken(listing) {
    const actions = getListingLandlordActions(listing)
    if (!actions.canMarkOccupancy) {
      alert(t('listingReview.cannotMarkOccupancy'))
      return
    }
    const { error } = await supabase.from('listings').update({ occupancy_status: 'unavailable' }).eq('id', listing.id)
    if (error) {
      const key = mapListingEditError(error.message)
      alert(key ? t(`listingEdit.errors.${key}`) : error.message)
      return
    }
    fetchListings({ silent: true })
  }

  async function handleRelist(listing) {
    const actions = getListingLandlordActions(listing)
    if (!actions.canMarkOccupancy) {
      alert(t('listingReview.cannotRelistUnderReview'))
      return
    }
    try {
      await relistListing(listing.id)
      fetchListings({ silent: true })
    } catch (err) {
      alert(err.message)
    }
  }

  async function deleteListing(id) {
    if (!confirm(t('dashboard.deleteConfirm'))) return
    try {
      await withdrawListing(id)
      fetchListings({ silent: true })
    } catch (err) {
      const key = mapListingEditError(err.message)
      alert(key ? t(`listingEdit.errors.${key}`) : err.message)
    }
  }

  function listingReviewBadge(listing) {
    const status = listing.verification_status || 'pending'
    if (status === 'approved') return null
    const variant = status === 'changes_requested' ? 'warning' : status === 'rejected' || status === 'withdrawn' ? 'error' : 'default'
    return (
      <Badge variant={variant}>
        {t(`listingReview.status.${status}`, { defaultValue: status })}
      </Badge>
    )
  }

  const pendingReviewCount = listings.filter((l) => ['pending', 'changes_requested'].includes(l.verification_status || 'pending')).length
  const changesRequestedCount = listings.filter((l) => l.verification_status === 'changes_requested').length

  const filtered = listings.filter((l) => {
    const occupancy = getListingOccupancy(l)
    if (filter === 'active') return occupancy === 'available' || occupancy === 'rented'
    if (filter === 'inactive') return occupancy === 'unavailable'
    return true
  })

  const sortedFiltered = [...filtered].sort((a, b) => {
    const priority = (listing) => {
      const status = listing.verification_status || 'pending'
      if (status === 'changes_requested') return 0
      if (status === 'rejected') return 1
      if (status === 'pending') return 2
      return 3
    }
    const diff = priority(a) - priority(b)
    if (diff !== 0) return diff
    return new Date(b.created_at) - new Date(a.created_at)
  })

  const totalViews = listings.reduce((sum, l) => sum + (l.views || 0), 0)

  const filterLabels = {
    all: t('dashboard.all'),
    active: t('dashboard.active'),
    inactive: t('dashboard.inactive'),
  }

  return (
    <PageShell className="mx-auto max-w-7xl px-4 py-5 sm:px-6 sm:py-8 lg:px-8">
      <div className="mb-8 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-bold text-primary">{t('dashboard.landlordTitle')}</h1>
          <p className="mt-2 text-muted">{t('dashboard.welcomeLandlord')}, {profile?.full_name || 'Landlord'}</p>
          <EarlyAccessLandlordNote className="mt-4 max-w-2xl" />
        </div>
        <div className="flex flex-wrap gap-2">
          <OnboardingReplayButton />
          <Button as={Link} to="/landlord/billing" variant="outline">
            <CreditCard size={18} />
            {t('billing.title')}
          </Button>
          <span data-onboarding="landlord-add-listing">
            <Button as={Link} to="/landlord/listings/new">
              <Plus size={18} />
              {t('dashboard.addListing')}
            </Button>
          </span>
        </div>
      </div>

      <LandlordWelcomeBanner userId={user?.id} profile={profile} />
      <EarlyAccessBanner />

      {statusBanner && (
        <motion.div className="mb-6 rounded-xl border border-accent/30 bg-accent/5 px-4 py-3 text-sm text-primary" {...motionProps}>
          {t(`listingReview.banner.${statusBanner}`)}
        </motion.div>
      )}

      {changesRequestedCount > 0 && (
        <div className="mb-6 rounded-xl border border-amber-500/40 bg-amber-500/5 px-4 py-3 text-sm text-primary">
          <p className="font-medium">{t('listingReview.changesNeededBanner', { count: changesRequestedCount })}</p>
          <p className="mt-1 text-muted">{t('listingReview.changesNeededHint')}</p>
        </div>
      )}

      {pendingReviewCount > 0 && !statusBanner && changesRequestedCount === 0 && (
        <div className="mb-6 rounded-xl border border-border bg-surface px-4 py-3 text-sm text-muted">
          {t('listingReview.pendingCount', { count: pendingReviewCount })}
        </div>
      )}

      <motion.div
        className="mb-8 grid gap-4 sm:grid-cols-3"
        data-onboarding="landlord-stats"
        {...motionProps}
        transition={{ ...fade.transition, delay: prefs.reduceMotion ? 0 : 0.05 }}
      >
        <Card className="p-5">
          <p className="text-sm text-muted">{t('dashboard.totalListings')}</p>
          <p className="font-display text-3xl font-bold text-primary">{listings.length}</p>
        </Card>
        <Card className="p-5">
          <p className="text-sm text-muted">{t('dashboard.activeListings')}</p>
          <p className="font-display text-3xl font-bold text-success">
            {listings.filter((l) => l.verification_status === 'approved' && getListingOccupancy(l) === 'available').length}
          </p>
        </Card>
        <Card className="p-5">
          <p className="text-sm text-muted">{t('dashboard.totalViews')}</p>
          <p className="font-display text-3xl font-bold text-accent">{totalViews}</p>
        </Card>
      </motion.div>

      <section className="mb-10" data-onboarding="landlord-listings">
        <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="font-display text-xl font-semibold text-primary">{t('dashboard.yourListingsTitle')}</h2>
            <p className="mt-1 max-w-2xl text-sm text-muted">{t('dashboard.yourListingsHint')}</p>
          </div>
          <div className="flex gap-2">
            {['all', 'active', 'inactive'].map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`rounded-lg px-4 py-2 text-sm font-medium capitalize transition-colors ${
                  filter === f ? 'bg-primary text-white' : 'bg-surface border border-border text-muted'
                }`}
              >
                {filterLabels[f]}
              </button>
            ))}
          </div>
        </div>

        <AnimatePresence mode="wait">
          {loading ? (
            <motion.div key="listings-loading" className="space-y-4" {...motionProps}>
              {[1, 2, 3].map((i) => <Skeleton key={i} className="h-28 w-full" />)}
            </motion.div>
          ) : sortedFiltered.length === 0 ? (
            <motion.div
              key="listings-empty"
              className="rounded-xl border border-border bg-surface p-8 text-center sm:p-10"
              {...motionProps}
            >
              <p className="text-lg font-medium text-primary">
                {listings.length === 0 ? t('dashboard.noListings') : t('dashboard.noFilterMatch')}
              </p>
              {listings.length === 0 && (
                <Button as={Link} to="/landlord/listings/new" className="mt-4">
                  {t('dashboard.listFirst')}
                </Button>
              )}
            </motion.div>
          ) : (
            <motion.div key="listings-grid" className="space-y-4" {...motionProps}>
              {sortedFiltered.map((listing) => {
                const occupancy = getListingOccupancy(listing)
                const actions = getListingLandlordActions(listing)
                const needsAttention = actions.needsResubmit || actions.underReview
                const badgeVariant = occupancy === 'available' ? 'success' : occupancy === 'rented' ? 'warning' : 'error'
                const badgeLabel = occupancy === 'available'
                  ? t('listings.available')
                  : occupancy === 'rented'
                    ? t('listings.rented')
                    : t('dashboard.taken')
                const occupancyDisabledReason = !actions.approved
                  ? t('listingReview.cannotMarkOccupancy')
                  : null

                return (
                  <Card
                    key={listing.id}
                    className={`flex flex-col gap-4 p-4 sm:flex-row sm:items-center ${
                      actions.needsResubmit ? 'border-amber-500/40 bg-amber-500/[0.03]' : ''
                    }`}
                  >
                    <img
                      src={getCoverPhoto(listing) || PLACEHOLDER}
                      alt={listing.title}
                      className="h-20 w-28 shrink-0 rounded-lg object-cover"
                    />
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="truncate font-semibold text-primary">{listing.title}</h3>
                        <Badge variant={badgeVariant}>{badgeLabel}</Badge>
                        {listingReviewBadge(listing)}
                      </div>
                      <p className="font-mono text-sm font-semibold">{formatPrice(listing.price)}{t('listings.perMo')}</p>
                      <p className="text-sm text-muted">{listing.area}, {listing.city}</p>
                      {actions.needsResubmit && listing.verification_notes && (
                        <p className="mt-2 flex items-start gap-1.5 text-xs text-amber-800">
                          <AlertCircle size={14} className="mt-0.5 shrink-0" />
                          <span>{listing.verification_notes}</span>
                        </p>
                      )}
                      {needsAttention && !actions.needsResubmit && (
                        <p className="mt-1 text-xs text-muted">{t('listingReview.underReviewHint')}</p>
                      )}
                      {actions.approved && (
                        <p className="mt-1 text-xs text-muted">{t('dashboard.listingActionsHint')}</p>
                      )}
                      <p className="mt-1 flex items-center gap-1 text-xs text-muted">
                        <Eye size={12} />
                        {listing.views || 0} {t('dashboard.views')}
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Button
                        as={Link}
                        to={`/landlord/listings/${listing.id}/edit`}
                        variant={actions.needsResubmit ? 'primary' : 'outline'}
                        size="sm"
                      >
                        <Edit size={14} />
                        {t(actions.editLabelKey)}
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={!actions.canMarkOccupancy}
                        title={occupancyDisabledReason || undefined}
                        onClick={() => (occupancy === 'available' ? markTaken(listing) : handleRelist(listing))}
                      >
                        {occupancy === 'available' ? <ToggleRight size={14} /> : <ToggleLeft size={14} />}
                        {occupancy === 'available' ? t('dashboard.markTaken') : t('housing.listAgain')}
                      </Button>
                      <Button
                        variant="danger"
                        size="sm"
                        disabled={!actions.canWithdraw}
                        title={!actions.canWithdraw ? t('listingReview.alreadyWithdrawn') : t('dashboard.deleteConfirm')}
                        onClick={() => deleteListing(listing.id)}
                      >
                        <Trash2 size={14} />
                      </Button>
                    </div>
                  </Card>
                )
              })}
            </motion.div>
          )}
        </AnimatePresence>
      </section>

      <div className="mb-10" data-onboarding="landlord-inquiries">
        <LandlordInquiriesPanel />
      </div>

      <div className="mb-10">
        <LandlordMarketOverview />
      </div>

      {!loading && listings.some((l) => l.lat && l.lng) && (
        <motion.div className="mb-8" {...motionProps} transition={{ ...fade.transition, delay: prefs.reduceMotion ? 0 : 0.08 }}>
          <h2 className="mb-3 font-display text-lg font-semibold text-primary">
            {MAPS_ENABLED ? 'Your listings on the map' : 'Listing locations'}
          </h2>
          <ListingMap listings={listings} height="320px" />
        </motion.div>
      )}
    </PageShell>
  )
}
