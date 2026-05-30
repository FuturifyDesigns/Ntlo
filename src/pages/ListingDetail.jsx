import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { MapPin, ArrowLeft } from 'lucide-react'
import { useParams } from 'react-router-dom'
import { useListing, useListings } from '../hooks/useListings'
import { useTranslation } from '../hooks/useTranslation'
import PhotoCarousel from '../components/listings/PhotoCarousel'
import AmenityChips from '../components/listings/AmenityChips'
import { SingleListingMap } from '../components/listings/ListingMap'
import ReviewSection from '../components/listings/ReviewSection'
import ListingCard from '../components/listings/ListingCard'
import Badge from '../components/ui/Badge'
import Button from '../components/ui/Button'
import { ListingGridSkeleton, Skeleton } from '../components/ui/Skeleton'
import ListingAdvisorPanel from '../components/advisor/ListingAdvisorPanel'
import ListingContactPanel from '../components/housing/ListingContactPanel'
import TrustedBadge from '../components/trust/TrustedBadge'
import { resolveListingTrustBadge } from '../lib/tierBenefits'
import { useAuth } from '../hooks/useAuth'
import { getUniversityDisplayName } from '../lib/universityNames'
import { getListingOccupancy, isListingRented } from '../lib/listingOccupancy'
import CompetitiveAdvisorPanel from '../components/advisor/CompetitiveAdvisorPanel'
import {
  formatPrice,
  formatDistance,
  getNearestUniversity,
  ROOM_TYPES,
  GENDER_PREFERENCES,
  UTILITIES_OPTIONS,
} from '../lib/utils'

export default function ListingDetail() {
  const { id } = useParams()
  const { t } = useTranslation()
  const { profile, isLandlord } = useAuth()
  const { listing, loading, error } = useListing(id)
  const { listings: related } = useListings(
    listing?.landlord_id ? { landlordId: listing.landlord_id, availableOnly: true } : {}
  )

  if (loading) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-5 sm:px-6 sm:py-6 lg:px-8">
        <Skeleton className="mb-6 h-8 w-32" />
        <Skeleton className="aspect-[16/9] w-full rounded-xl" />
        <Skeleton className="mt-6 h-10 w-2/3" />
      </div>
    )
  }

  if (error || !listing) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-16 text-center">
        <p className="text-lg text-error">{error || t('listings.notFound')}</p>
        <Button as={Link} to="/listings" variant="outline" className="mt-4">
          {t('listings.backToListings')}
        </Button>
      </div>
    )
  }

  const uni = getNearestUniversity(listing)
  const relatedListings = related.filter((l) => l.id !== listing.id).slice(0, 3)
  const trustLevel = resolveListingTrustBadge(listing)

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <Link to="/listings" className="mb-4 inline-flex items-center gap-1 text-sm text-muted hover:text-primary">
          <ArrowLeft size={16} />
          {t('listings.backToListings')}
        </Link>

        <div className="grid gap-8 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-6">
            <PhotoCarousel photos={listing.listing_photos} />

            <div>
              <div className="flex flex-wrap items-start gap-3">
                <h1 className="font-display text-2xl font-bold text-primary sm:text-3xl">{listing.title}</h1>
                {trustLevel && <TrustedBadge level={trustLevel} />}
              </div>

              <p className="mt-2 font-mono text-2xl font-bold text-primary">
                {formatPrice(listing.price)} <span className="text-base font-normal text-muted">{t('listings.perMonth')}</span>
              </p>

              <div className="mt-3 flex flex-wrap gap-2">
                {isListingRented(listing) ? (
                  <Badge variant="warning">{t('listings.rented')}</Badge>
                ) : getListingOccupancy(listing) === 'available' ? (
                  <Badge variant="success">{t('listings.available')}</Badge>
                ) : (
                  <Badge variant="error">{t('listings.unavailable')}</Badge>
                )}
                {uni && (
                  <Badge variant="default">
                    <MapPin size={12} className="mr-1" />
                    {formatDistance(listing.distance_to_campus, getUniversityDisplayName(uni))}
                  </Badge>
                )}
                <Badge variant="default">{ROOM_TYPES[listing.room_type]}</Badge>
                {listing.gender_preference && listing.gender_preference !== 'any' && (
                  <Badge variant="default">{GENDER_PREFERENCES[listing.gender_preference]}</Badge>
                )}
                {listing.deposit_pula != null && listing.deposit_pula > 0 && (
                  <Badge variant="default">{t('listingForm.deposit')}: P{listing.deposit_pula}</Badge>
                )}
                {listing.utilities_included && (
                  <Badge variant="default">{UTILITIES_OPTIONS[listing.utilities_included]}</Badge>
                )}
              </div>

              <p className="mt-4 flex items-center gap-1 text-muted">
                <MapPin size={16} />
                {listing.address}{listing.area ? `, ${listing.area}` : ''}, {listing.city}
              </p>
            </div>

            {listing.amenities?.length > 0 && (
              <div>
                <h2 className="mb-3 font-display text-lg font-semibold">{t('filter.amenities')}</h2>
                <AmenityChips amenities={listing.amenities} />
              </div>
            )}

            {listing.description && (
              <div>
                <h2 className="mb-3 font-display text-lg font-semibold">{t('listingDetail.description')}</h2>
                <p className="whitespace-pre-wrap text-muted leading-relaxed">{listing.description}</p>
              </div>
            )}

            {listing.house_rules && (
              <div>
                <h2 className="mb-3 font-display text-lg font-semibold">{t('listingForm.houseRules')}</h2>
                <p className="whitespace-pre-wrap text-muted leading-relaxed">{listing.house_rules}</p>
              </div>
            )}

            <div>
              <h2 className="mb-3 font-display text-lg font-semibold">{t('listingDetail.location')}</h2>
              <SingleListingMap listing={listing} lat={listing.lat} lng={listing.lng} title={listing.title} />
            </div>

            <ReviewSection listingId={listing.id} />
          </div>

          <div className="lg:col-span-1">
            <div className="sticky top-24 max-h-[calc(100vh-6rem)] space-y-4 overflow-y-auto rounded-xl border border-border bg-surface p-6 shadow-sm">
              <ListingContactPanel listing={listing} />

              {isLandlord ? (
                <CompetitiveAdvisorPanel listing={listing} />
              ) : (
                <ListingAdvisorPanel
                  listing={listing}
                  studentUniversityId={profile?.role === 'student' ? profile.university_id : undefined}
                />
              )}
            </div>
          </div>
        </div>

        {relatedListings.length > 0 && (
          <div className="mt-12">
            <h2 className="mb-6 font-display text-xl font-semibold">{t('listingDetail.moreByLandlord')}</h2>
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
              {relatedListings.map((l, i) => (
                <ListingCard key={l.id} listing={l} carouselIndex={i} />
              ))}
            </div>
          </div>
        )}
      </div>

    </motion.div>
  )
}
