import { RefreshCw } from 'lucide-react'
import { useTranslation } from '../../hooks/useTranslation'
import { useNow } from '../../hooks/useNow'
import { relativeTimeParts } from '../../lib/utils'

export default function AdvisorLiveBanner({ isFresh, updatedAt, className = '' }) {
  const { t } = useTranslation()
  useNow(15000)

  if (!isFresh && !updatedAt) return null

  let label = t('advisor.liveUpdated')
  if (updatedAt && !isFresh) {
    const parts = relativeTimeParts(updatedAt)
    if (parts.unit === 'now') label = t('advisor.liveUpdated')
    else if (parts.unit === 'minutes') label = t('advisor.liveUpdatedMinutes', { count: parts.count })
    else label = t('advisor.liveSynced')
  }

  return (
    <div
      className={`flex items-center gap-1.5 text-xs text-accent transition-opacity ${isFresh ? 'opacity-100' : 'opacity-70'} ${className}`}
    >
      <RefreshCw size={12} className={isFresh ? 'animate-spin' : ''} />
      <span>{label}</span>
    </div>
  )
}
