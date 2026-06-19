import { cn } from '../../lib/utils'
import { trustRiskLabelKey, trustRiskStyle } from '../../lib/listingTrust'
import { useTranslation } from '../../hooks/useTranslation'

export default function TrustRiskBadge({ risk, compact = false, className }) {
  const { t } = useTranslation()
  if (!risk) return null

  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full border font-semibold',
        compact ? 'px-2 py-0.5 text-[10px] uppercase tracking-wide' : 'px-2.5 py-1 text-xs',
        trustRiskStyle(risk),
        className
      )}
      title={t(trustRiskLabelKey(risk))}
    >
      {t(trustRiskLabelKey(risk))}
    </span>
  )
}
