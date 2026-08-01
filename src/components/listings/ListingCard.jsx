import { Link, useNavigate } from 'react-router-dom'
import { Heart } from 'lucide-react'
import { useState } from 'react'
import { getListingOccupancy, isListingRented } from '../../lib/listingOccupancy'
import { isListingRecentlyUpdated } from '../../lib/listingFreshness'
import { formatPrice, formatDistance, getListingPhotos, getNearestUniversity, ROOM_TYPES, AMENITIES, cn } from '../../lib/utils'
import PhotoCarousel from './PhotoCarousel'
import * as LucideIcons from 'lucide-react'
import { useSavedListingsContext } from '../../context/SavedListingsContext'
import { useAuth } from '../../hooks/useAuth'
import { useTranslation } from '../../hooks/useTranslation'
import { getUniversityDisplayName } from '../../lib/universityNames'
import Badge from '../ui/Badge'
import { IconLocation } from '../ui/Icons'
import TrustedBadge from '../trust/TrustedBadge'
import TrustRiskBadge from '../trust/TrustRiskBadge'
import { TRUST_LEVEL, resolveListingTrustBadge } from '../../lib/tierBenefits'
import { getListingTrustProfile } from '../../lib/listingTrust'
import ListingRecentlyUpdatedBadge from './ListingRecentlyUpdatedBadge'
import { isExternalListing } from '../../lib/listingOrigin'

export default function ListingCard({
  listing, compact = false, carouselIndex = 0, onboardingHeartTarget = false,
}) {
  const { user } = useAuth()
  const { isSaved, toggleSave } = useSavedListingsContext()
  const navigate = useNavigate()
  const { t } = useTranslation()
  const [saving, setSaving] = useState(false)

  const uni = getNearestUniversity(listing)
  const listingPhotos = getListingPhotos(listing).filter((p) => {
    const url = typeof p === 'string' ? p : p?.url
    return typeof url === 'string' && /^https?:\/\//i.test(url)
  })
  const hasMultiplePhotos = listingPhotos.length > 1
  const saved = isSaved(listing.id)
  const trustLevel = resolveListingTrustBadge(listing)
  const trust = getListingTrustProfile(listing)
  const occupancy = getListingOccupancy(listing)
  const external = isExternalListing(listing)

  async function handleSave(e) {
    e.preventDefault()
    e.stopPropagation()
    if (!user) {
      navigate('/login')
      return
    }
    setSaving(true)
    try {
      await toggleSave(listing.id)
    } finally {
      setSaving(false)
    }
  }

  return (
    <Link to={`/listings/${listing.id}`} className="group block h-full">
      <article className="card-elevated flex h-full flex-col overflow-hidden">
        <div className="relative aspect-[4/3] overflow-hidden bg-background">
          <PhotoCarousel
            photos={listingPhotos}
            compact
            showArrows={false}
            showDots={hasMultiplePhotos}
            pauseOnHover={false}
            startDelay={carouselIndex * 600}
            className="h-full rounded-none"
            aspectClass="h-full w-full"
            altPrefix={listing.title}
            placeholderTitle={listing.area || listing.city || listing.title}
            placeholderSubtitle={listing.city && listing.area ? listing.city : 'Botswana'}
          />
          <div className="pointer-events-none absolute inset-0 z-[1] bg-gradient-to-t from-primary/50 via-transparent to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />

          {uni && (
            <div className="absolute left-3 top-3 z-[2]">
              <span className="inline-flex items-center gap-1 rounded-full bg-primary/85 px-2.5 py-1 text-xs font-semibold text-white backdrop-blur-sm">
                <IconLocation className="h-3 w-3" />
                {formatDistance(listing.distance_to_campus, getUniversityDisplayName(uni))}
              </span>
            </div>
          )}

          <button
            onClick={handleSave}
            disabled={saving}
            {...(onboardingHeartTarget ? { 'data-onboarding': 'browse-save-heart' } : {})}
            className={cn(
              'absolute right-3 top-3 rounded-full p-2 shadow-md transition-all',
              onboardingHeartTarget ? 'z-[5]' : 'z-[2]',
              saved
                ? 'bg-accent text-primary scale-110'
                : 'bg-white/95 text-muted hover:text-error hover:scale-105'
            )}
            aria-label={saved ? t('listings.saveListing') : t('listings.saveListing')}
          >
            <Heart size={17} fill={saved ? 'currentColor' : 'none'} strokeWidth={2} />
          </button>

          {occupancy === 'unavailable' && !external && (
            <div className="absolute inset-0 z-[3] flex items-center justify-center bg-primary/70 backdrop-blur-[2px]">
              <Badge variant="error">{t('listings.unavailable')}</Badge>
            </div>
          )}

          {external && (
            <div className="absolute left-3 bottom-3 z-[2]">
              <Badge variant="default">{t('listings.externalBadge')}</Badge>
            </div>
          )}

          {!external && isListingRented(listing) && (
            <div className="absolute left-3 bottom-3 z-[2]">
              <Badge variant="warning">{t('listings.rented')}</Badge>
            </div>
          )}

          {!external && !isListingRented(listing) && isListingRecentlyUpdated(listing) && (
            <div className="absolute left-3 bottom-3 z-[2]">
              <ListingRecentlyUpdatedBadge listing={listing} />
            </div>
          )}

          {!external && (trustLevel || trust.showRisk || trust.showUnverifiedLandlord) && (
            <div className="absolute bottom-3 right-3 z-[2] flex flex-col items-end gap-1">
              {trustLevel && <TrustedBadge level={trustLevel} compact />}
              {trust.showUnverifiedLandlord && (
                <TrustedBadge level={TRUST_LEVEL.landlordUnverified} compact />
              )}
              {trust.showRisk && <TrustRiskBadge risk={trust.risk} compact />}
            </div>
          )}
        </div>

        <div className={cn('flex flex-1 flex-col p-4', compact && 'p-3')}>
          <h3 className="line-clamp-2 font-semibold leading-snug text-primary group-hover:text-accent transition-colors">
            {listing.title}
          </h3>
          <p className="mt-2 font-mono text-xl font-bold text-primary">
            {formatPrice(listing.price)}
            <span className="ml-1 text-sm font-normal text-muted">{t('listings.perMo')}</span>
          </p>
          <p className="mt-1.5 flex items-center gap-1 text-sm text-muted">
            <IconLocation className="h-3.5 w-3.5 shrink-0 opacity-60" />
            {listing.area ? `${listing.area}, ${listing.city}` : listing.city}
          </p>
          {external ? (
            <p className="mt-1.5 text-xs text-muted">
              {t('trust.verifyWithOwner')}
            </p>
          ) : trust.published && !trust.listingTrusted ? (
            <p className="mt-1.5 text-xs text-amber-700 dark:text-amber-300">
              {t('trust.propertyNotFullyVerified')}
            </p>
          ) : null}
          <div className="mt-auto flex items-center justify-between pt-3">
            <span className="rounded-md bg-background px-2 py-0.5 text-xs font-medium text-muted">
              {ROOM_TYPES[listing.room_type] || listing.room_type}
            </span>
            {listing.amenities?.length > 0 && (
              <div className="flex gap-1.5 text-muted">
                {listing.amenities.slice(0, 3).map((id) => {
                  const amenity = AMENITIES.find((a) => a.id === id)
                  const Icon = amenity ? LucideIcons[amenity.icon] : null
                  return Icon ? <Icon key={id} size={14} title={amenity?.label} /> : null
                })}
              </div>
            )}
          </div>
        </div>
      </article>
    </Link>
  )
}
