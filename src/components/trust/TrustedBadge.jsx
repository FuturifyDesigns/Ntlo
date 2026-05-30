import { cn } from '../../lib/utils'
import { IconListedHome, IconTrustedHome } from '../ui/Icons'
import { TRUST_LEVEL, trustBadgeLabelKey } from '../../lib/tierBenefits'
import { useTranslation } from '../../hooks/useTranslation'

const STYLES = {
  [TRUST_LEVEL.listed]: {
    wrap: 'bg-background/95 text-muted border border-border',
    icon: IconListedHome,
  },
  [TRUST_LEVEL.standard]: {
    wrap: 'bg-accent text-primary',
    icon: IconTrustedHome,
  },
  [TRUST_LEVEL.featured]: {
    wrap: 'bg-primary text-white ring-1 ring-accent/50',
    icon: IconTrustedHome,
  },
}

export default function TrustedBadge({
  level = TRUST_LEVEL.standard,
  compact = false,
  showLabel = true,
  className,
}) {
  const { t } = useTranslation()
  const style = STYLES[level] || STYLES[TRUST_LEVEL.standard]
  const Icon = style.icon
  const labelKey = trustBadgeLabelKey(level)

  if (!labelKey) return null

  if (compact) {
    return (
      <span
        className={cn(
          'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide',
          style.wrap,
          className
        )}
        title={t(labelKey)}
      >
        <Icon className="h-3 w-3 shrink-0" />
        {showLabel && <span className="max-w-[8rem] truncate sm:max-w-none">{t(labelKey)}</span>}
      </span>
    )
  }

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold',
        style.wrap,
        className
      )}
    >
      <Icon className="h-3.5 w-3.5 shrink-0" />
      {showLabel && t(labelKey)}
    </span>
  )
}
