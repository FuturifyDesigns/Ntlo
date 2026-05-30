import { Gift } from 'lucide-react'
import { useTranslation } from '../../hooks/useTranslation'
import { isEarlyAccessMode } from '../../lib/subscriptions'

export default function EarlyAccessLandlordNote({ className = '' }) {
  const { t } = useTranslation()
  if (!isEarlyAccessMode()) return null

  return (
    <div className={`flex gap-3 rounded-xl border border-success/30 bg-success/5 p-4 ${className}`}>
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-success/15 text-success">
        <Gift size={18} />
      </span>
      <div className="min-w-0 text-sm">
        <p className="font-semibold text-primary">{t('billing.earlyAccessLandlordTitle')}</p>
        <p className="mt-1 text-muted">{t('billing.earlyAccessLandlordBody')}</p>
      </div>
    </div>
  )
}
