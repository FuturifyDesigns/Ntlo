import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { MapPin, CheckCircle2, MessageCircle, ArrowLeft } from 'lucide-react'
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
import { useAuth } from '../hooks/useAuth'
import {
  formatPrice,
  formatDistance,
  getWhatsAppLink,
  getNearestUniversity,
  ROOM_TYPES,
} from '../lib/utils'

function WhatsAppIcon({ size = 20 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.435 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
    </svg>
  )
}

export default function ListingDetail() {
  const { id } = useParams()
  const { t } = useTranslation()
  const { profile } = useAuth()
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
                {listing.is_verified && (
                  <Badge variant="accent">
                    <CheckCircle2 size={12} className="mr-1" />
                    {t('listings.verifiedLandlord')}
                  </Badge>
                )}
              </div>

              <p className="mt-2 font-mono text-2xl font-bold text-primary">
                {formatPrice(listing.price)} <span className="text-base font-normal text-muted">{t('listings.perMonth')}</span>
              </p>

              <div className="mt-3 flex flex-wrap gap-2">
                <Badge variant={listing.available ? 'success' : 'error'}>
                  {listing.available ? t('listings.available') : t('listings.unavailable')}
                </Badge>
                {uni && (
                  <Badge variant="default">
                    <MapPin size={12} className="mr-1" />
                    {formatDistance(listing.distance_to_campus, uni.short_name)}
                  </Badge>
                )}
                <Badge variant="default">{ROOM_TYPES[listing.room_type]}</Badge>
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

            <div>
              <h2 className="mb-3 font-display text-lg font-semibold">{t('listingDetail.location')}</h2>
              <SingleListingMap listing={listing} lat={listing.lat} lng={listing.lng} title={listing.title} />
            </div>

            <ReviewSection listingId={listing.id} />
          </div>

          <div className="lg:col-span-1">
            <div className="sticky top-24 space-y-4 rounded-xl border border-border bg-surface p-6 shadow-sm">
              <div>
                <p className="text-sm text-muted">{t('listingDetail.listedBy')}</p>
                <p className="font-semibold">{listing.landlord?.full_name || 'Landlord'}</p>
                {listing.landlord?.is_verified && (
                  <p className="mt-1 flex items-center gap-1 text-xs font-semibold text-accent">
                    <CheckCircle2 size={14} />
                    {t('listings.verifiedLandlord')}
                  </p>
                )}
              </div>

              {listing.available && (
                <Button
                  as="a"
                  href={getWhatsAppLink(listing.whatsapp_number, listing.title)}
                  target="_blank"
                  rel="noopener noreferrer"
                  variant="whatsapp"
                  size="lg"
                  className="w-full"
                >
                  <WhatsAppIcon />
                  {t('listings.chatWhatsApp')}
                </Button>
              )}

              <p className="text-xs text-muted text-center">{t('listingDetail.paymentNote')}</p>

              <ListingAdvisorPanel
                listing={listing}
                studentUniversityId={profile?.role === 'student' ? profile.university_id : undefined}
              />
            </div>
          </div>
        </div>

        {relatedListings.length > 0 && (
          <div className="mt-12">
            <h2 className="mb-6 font-display text-xl font-semibold">{t('listingDetail.moreByLandlord')}</h2>
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
              {relatedListings.map((l) => (
                <ListingCard key={l.id} listing={l} />
              ))}
            </div>
          </div>
        )}
      </div>

      {listing.available && (
        <div className="fixed bottom-16 left-0 right-0 border-t border-border bg-surface p-4 md:hidden">
          <Button
            as="a"
            href={getWhatsAppLink(listing.whatsapp_number, listing.title)}
            target="_blank"
            rel="noopener noreferrer"
            variant="whatsapp"
            size="lg"
            className="w-full"
          >
            <MessageCircle size={20} />
            {t('listings.chatWhatsApp')}
          </Button>
        </div>
      )}
    </motion.div>
  )
}
