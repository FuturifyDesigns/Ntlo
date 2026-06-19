import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Home, Trash2, MapPin, User, ExternalLink, ShieldCheck, ShieldOff } from 'lucide-react'
import { useTranslation } from '../../hooks/useTranslation'
import Button from '../ui/Button'
import Badge from '../ui/Badge'
import TrustedBadge from '../trust/TrustedBadge'
import TrustRiskBadge from '../trust/TrustRiskBadge'
import { getListingTrustProfile } from '../../lib/listingTrust'

export default function AdminLiveListingCard({ listing, onDelete, onSetTrust, trustBusy }) {
  const { t } = useTranslation()
  const trust = getListingTrustProfile(listing, listing.landlord)

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
            {trust.primaryBadge && <TrustedBadge level={trust.primaryBadge} compact />}
            <TrustRiskBadge risk={trust.risk} compact />
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

      <div className="flex flex-wrap gap-2">
        <Button size="sm" variant="outline" as={Link} to={`/listings/${listing.id}`} target="_blank" rel="noopener noreferrer">
          <ExternalLink size={14} />
          {t('admin.viewListing')}
        </Button>
        {listing.is_verified ? (
          <Button
            size="sm"
            variant="outline"
            disabled={trustBusy === listing.id}
            onClick={() => onSetTrust?.(listing, false)}
          >
            <ShieldOff size={14} />
            {t('admin.removeTrustedHome')}
          </Button>
        ) : (
          <Button
            size="sm"
            variant="outline"
            disabled={trustBusy === listing.id}
            onClick={() => onSetTrust?.(listing, true)}
          >
            <ShieldCheck size={14} />
            {t('admin.awardTrustedHome')}
          </Button>
        )}
        <Button size="sm" variant="danger" onClick={onDelete}>
          <Trash2 size={14} />
          {t('admin.deleteListing')}
        </Button>
      </div>
    </motion.div>
  )
}
