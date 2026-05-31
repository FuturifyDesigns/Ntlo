import Badge from '../ui/Badge'
import { useTranslation } from '../../hooks/useTranslation'
import { useNow } from '../../hooks/useNow'
import { isListingRecentlyUpdated } from '../../lib/listingFreshness'
import { relativeTimeParts } from '../../lib/utils'

export default function ListingRecentlyUpdatedBadge({ listing, className = '' }) {
  const { t } = useTranslation()
  useNow(30000)

  if (!isListingRecentlyUpdated(listing)) return null

  const parts = relativeTimeParts(listing.updated_at)
  let label = t('listings.recentlyUpdated')
  if (parts.unit === 'now') label = t('listings.updatedJustNow')
  else if (parts.unit === 'minutes') label = t('listings.updatedMinutesAgo', { count: parts.count })
  else if (parts.unit === 'hours') label = t('listings.updatedHoursAgo', { count: parts.count })
  else if (parts.unit === 'days') label = t('listings.updatedDaysAgo', { count: parts.count })

  return (
    <Badge variant="warning" className={className}>
      {label}
    </Badge>
  )
}
