import { useMemo } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Sparkles, CheckCircle, AlertCircle, Info } from 'lucide-react'
import { coachLandlordListing } from '../../lib/listingAdvisor'
import { useTranslation } from '../../hooks/useTranslation'
import { useLiveRevision } from '../../hooks/useLiveRevision'
import AdvisorLiveBanner from './AdvisorLiveBanner'
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

  const { revision, isFresh } = useLiveRevision([
    form?.price,
    form?.title,
    form?.description,
    form?.lat,
    form?.amenities?.join(','),
    photoCount,
    marketListings?.length,
    coach?.readiness,
    coach?.suggestions?.length,
  ])

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
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="flex items-center gap-2">
          <Sparkles size={18} className="text-accent" />
          <h3 className="font-display font-semibold text-primary">{t('advisor.landlordTitle')}</h3>
        </div>
        <AdvisorLiveBanner isFresh={isFresh} />
      </div>
      <p className="text-sm text-muted">{t(`advisor.landlordStatus.${coach.readiness}`)}</p>
      <AnimatePresence mode="wait">
        <motion.ul
          key={revision}
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="space-y-3"
        >
        {coach.suggestions.map((item, i) => {
          const Icon = ICONS[item.severity] || Info
          return (
            <motion.li
              key={`${item.key}-${i}`}
              layout
              className={`flex gap-2 text-sm ${COLORS[item.severity]}`}
            >
              <Icon size={16} className="mt-0.5 shrink-0" />
              <span>{t(`advisor.landlord.${item.key}`, item.meta || {})}</span>
            </motion.li>
          )
        })}
        </motion.ul>
      </AnimatePresence>
    </Card>
  )
}
