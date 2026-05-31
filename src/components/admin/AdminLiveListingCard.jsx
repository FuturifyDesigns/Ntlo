import { motion } from 'framer-motion'
import { Home, Trash2, MapPin, User } from 'lucide-react'
import { useTranslation } from '../../hooks/useTranslation'
import Button from '../ui/Button'
import Badge from '../ui/Badge'

export default function AdminLiveListingCard({ listing, onDelete }) {
  const { t } = useTranslation()

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-border bg-surface p-4 sm:p-5"
    >
      <div className="flex min-w-0 flex-1 items-start gap-3">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
          <Home size={20} />
        </span>
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <p className="truncate font-semibold text-primary">{listing.title}</p>
            <Badge variant="success">{t('admin.listingFilterLive')}</Badge>
            {listing.occupancy_status === 'rented' && (
              <Badge variant="warning">{t('admin.listingOccupied')}</Badge>
            )}
          </div>
          <p className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted">
            <span className="inline-flex items-center gap-1">
              <User size={14} />
              {listing.landlord?.full_name || '—'}
            </span>
            <span className="inline-flex items-center gap-1">
              <MapPin size={14} />
              {listing.city || '—'}
            </span>
            {listing.price != null && (
              <span>P{Number(listing.price).toLocaleString()}/mo</span>
            )}
          </p>
          <p className="mt-1 text-xs text-muted">
            {t('admin.listingPosted', { date: new Date(listing.created_at).toLocaleDateString() })}
          </p>
        </div>
      </div>

      <Button size="sm" variant="danger" onClick={onDelete}>
        <Trash2 size={14} />
        {t('admin.deleteListing')}
      </Button>
    </motion.div>
  )
}
