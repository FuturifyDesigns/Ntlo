import { useMemo } from 'react'
import { Sparkles, CheckCircle, AlertCircle, Info } from 'lucide-react'
import { coachLandlordListing } from '../../lib/listingAdvisor'
import { useTranslation } from '../../hooks/useTranslation'
import Card from '../ui/Card'

const ICONS = {
  important: AlertCircle,
  warning: AlertCircle,
  tip: Info,
}

const COLORS = {
  important: 'text-error',
  warning: 'text-amber-600',
  tip: 'text-muted',
}

export default function LandlordListingCoach({ form, photoCount = 0, marketListings = [] }) {
  const { t } = useTranslation()

  const coach = useMemo(
    () => coachLandlordListing(form, { photoCount, marketListings }),
    [form, photoCount, marketListings]
  )

  if (!coach.suggestions.length) {
    return (
      <Card className="space-y-3 border-success/30 bg-success/5 p-5">
        <div className="flex items-center gap-2 text-success">
          <CheckCircle size={18} />
          <h3 className="font-display font-semibold">{t('advisor.landlordReady')}</h3>
        </div>
        <p className="text-sm text-muted">{t('advisor.landlordReadyDesc')}</p>
      </Card>
    )
  }

  return (
    <Card className="space-y-4 p-5">
      <div className="flex items-center gap-2">
        <Sparkles size={18} className="text-accent" />
        <h3 className="font-display font-semibold text-primary">{t('advisor.landlordTitle')}</h3>
      </div>
      <p className="text-sm text-muted">{t(`advisor.landlordStatus.${coach.readiness}`)}</p>
      <ul className="space-y-3">
        {coach.suggestions.map((item, i) => {
          const Icon = ICONS[item.severity] || Info
          return (
            <li key={i} className={`flex gap-2 text-sm ${COLORS[item.severity]}`}>
              <Icon size={16} className="mt-0.5 shrink-0" />
              <span>{t(`advisor.landlord.${item.key}`, item.meta || {})}</span>
            </li>
          )
        })}
      </ul>
    </Card>
  )
}
