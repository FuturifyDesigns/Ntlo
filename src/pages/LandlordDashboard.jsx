import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { Plus, Edit, Trash2, Eye, ToggleLeft, ToggleRight } from 'lucide-react'
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
import { getListingOccupancy, isListingRented } from '../lib/listingOccupancy'
import { relistListing } from '../lib/housing'
import { MAPS_ENABLED } from '../lib/googleMaps'
import { CreditCard } from 'lucide-react'

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
        id, title, price, area, city, lat, lng, available, occupancy_status, views, is_verified, created_at,
        cover_photo:listing_photos(url, is_cover)
      `)
      .eq('landlord_id', user.id)
      .order('created_at', { ascending: false })
    setListings(data || [])
    if (user?.id) listingsCache = { userId: user.id, items: data || [] }
    if (!silent) setLoading(false)
  }

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

  async function markTaken(id) {
    await supabase.from('listings').update({ occupancy_status: 'unavailable' }).eq('id', id)
    fetchListings({ silent: true })
  }

  async function handleRelist(id) {
    try {
      await relistListing(id)
      fetchListings({ silent: true })
    } catch (err) {
      alert(err.message)
    }
  }

  async function deleteListing(id) {
    if (!confirm(t('dashboard.deleteConfirm'))) return
    await supabase.from('listings').delete().eq('id', id)
    fetchListings({ silent: true })
  }

  const filtered = listings.filter((l) => {
    const occupancy = getListingOccupancy(l)
    if (filter === 'active') return occupancy === 'available' || occupancy === 'rented'
    if (filter === 'inactive') return occupancy === 'unavailable'
    return true
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
          <Button as={Link} to="/landlord/billing" variant="outline">
            <CreditCard size={18} />
            {t('billing.title')}
          </Button>
          <Button as={Link} to="/landlord/listings/new">
            <Plus size={18} />
            {t('dashboard.addListing')}
          </Button>
        </div>
      </div>

      <LandlordWelcomeBanner userId={user?.id} profile={profile} />
      <EarlyAccessBanner />

      <motion.div
        className="mb-8 grid gap-4 sm:grid-cols-3"
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
            {listings.filter((l) => getListingOccupancy(l) === 'available').length}
          </p>
        </Card>
        <Card className="p-5">
          <p className="text-sm text-muted">{t('dashboard.totalViews')}</p>
          <p className="font-display text-3xl font-bold text-accent">{totalViews}</p>
        </Card>
      </motion.div>

      <div className="mb-10">
        <LandlordInquiriesPanel />
      </div>

      {!loading && listings.some((l) => l.lat && l.lng) && (
        <motion.div className="mb-8" {...motionProps} transition={{ ...fade.transition, delay: prefs.reduceMotion ? 0 : 0.08 }}>
          <h2 className="mb-3 font-display text-lg font-semibold text-primary">
            {MAPS_ENABLED ? 'Your listings on the map' : 'Listing locations'}
          </h2>
          <ListingMap listings={listings} height="320px" />
        </motion.div>
      )}

      <div className="mb-6 flex gap-2">
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

      <AnimatePresence mode="wait">
        {loading ? (
          <motion.div key="listings-loading" className="space-y-4" {...motionProps}>
            {[1, 2, 3].map((i) => <Skeleton key={i} className="h-24 w-full" />)}
          </motion.div>
        ) : filtered.length === 0 ? (
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
            {filtered.map((listing) => {
              const occupancy = getListingOccupancy(listing)
              const badgeVariant = occupancy === 'available' ? 'success' : occupancy === 'rented' ? 'warning' : 'error'
              const badgeLabel = occupancy === 'available'
                ? t('listings.available')
                : occupancy === 'rented'
                  ? t('listings.rented')
                  : t('dashboard.taken')

              return (
              <Card key={listing.id} className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center">
                <img
                  src={getCoverPhoto(listing) || PLACEHOLDER}
                  alt={listing.title}
                  className="h-20 w-28 shrink-0 rounded-lg object-cover"
                />
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="font-semibold text-primary truncate">{listing.title}</h3>
                    <Badge variant={badgeVariant}>
                      {badgeLabel}
                    </Badge>
                  </div>
                  <p className="font-mono text-sm font-semibold">{formatPrice(listing.price)}{t('listings.perMo')}</p>
                  <p className="text-sm text-muted">{listing.area}, {listing.city}</p>
                  <p className="mt-1 flex items-center gap-1 text-xs text-muted">
                    <Eye size={12} />
                    {listing.views || 0} {t('dashboard.views')}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button as={Link} to={`/landlord/listings/${listing.id}/edit`} variant="outline" size="sm">
                    <Edit size={14} />
                    {t('dashboard.edit')}
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => (occupancy === 'available' ? markTaken(listing.id) : handleRelist(listing.id))}>
                    {occupancy === 'available' ? <ToggleRight size={14} /> : <ToggleLeft size={14} />}
                    {occupancy === 'available' ? t('dashboard.markTaken') : t('housing.listAgain')}
                  </Button>
                  <Button variant="danger" size="sm" onClick={() => deleteListing(listing.id)}>
                    <Trash2 size={14} />
                  </Button>
                </div>
              </Card>
              )
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </PageShell>
  )
}
