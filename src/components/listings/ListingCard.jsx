import { Link, useNavigate } from 'react-router-dom'
import { Heart } from 'lucide-react'
import { useState } from 'react'
import { formatPrice, formatDistance, getCoverPhoto, getNearestUniversity, ROOM_TYPES, AMENITIES, cn } from '../../lib/utils'
import * as LucideIcons from 'lucide-react'
import { useSavedListings } from '../../hooks/useSavedListings'
import { useAuth } from '../../hooks/useAuth'
import { useTranslation } from '../../hooks/useTranslation'
import { getUniversityDisplayName } from '../../lib/universityNames'
import Badge from '../ui/Badge'
import { IconLocation, IconVerified } from '../ui/Icons'

const PLACEHOLDER = 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800&q=80'

export default function ListingCard({ listing, compact = false }) {
  const { user } = useAuth()
  const { isSaved, toggleSave } = useSavedListings()
  const navigate = useNavigate()
  const { t } = useTranslation()
  const [saving, setSaving] = useState(false)

  const uni = getNearestUniversity(listing)
  const coverUrl = getCoverPhoto(listing) || PLACEHOLDER
  const saved = isSaved(listing.id)

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
          <img
            src={coverUrl}
            alt={listing.title}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.04]"
            loading="lazy"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-primary/50 via-transparent to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />

          {uni && (
            <div className="absolute left-3 top-3">
              <span className="inline-flex items-center gap-1 rounded-full bg-primary/85 px-2.5 py-1 text-xs font-semibold text-white backdrop-blur-sm">
                <IconLocation className="h-3 w-3" />
                {formatDistance(listing.distance_to_campus, getUniversityDisplayName(uni))}
              </span>
            </div>
          )}

          <button
            onClick={handleSave}
            disabled={saving}
            className={cn(
              'absolute right-3 top-3 rounded-full p-2 shadow-md transition-all',
              saved
                ? 'bg-accent text-primary scale-110'
                : 'bg-white/95 text-muted hover:text-error hover:scale-105'
            )}
            aria-label={saved ? t('listings.saveListing') : t('listings.saveListing')}
          >
            <Heart size={17} fill={saved ? 'currentColor' : 'none'} strokeWidth={2} />
          </button>

          {!listing.available && (
            <div className="absolute inset-0 flex items-center justify-center bg-primary/70 backdrop-blur-[2px]">
              <Badge variant="error">{t('listings.unavailable')}</Badge>
            </div>
          )}

          {listing.is_verified && (
            <div className="absolute bottom-3 right-3">
              <span className="inline-flex items-center gap-1 rounded-full bg-accent px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-primary">
                <IconVerified className="h-3 w-3" />
                Verified
              </span>
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
