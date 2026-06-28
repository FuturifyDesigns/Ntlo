import { Link } from 'react-router-dom'
import { ShieldAlert } from 'lucide-react'
import { useTranslation } from '../../hooks/useTranslation'
import Button from '../ui/Button'
import { landlordShouldVerify } from '../../lib/verification'

export default function LandlordVerifyNudgeBanner({ profile }) {
  const { t } = useTranslation()

  if (!landlordShouldVerify(profile)) return null

  return (
    <div className="mb-6 rounded-xl border border-amber-500/35 bg-amber-500/5 p-4 sm:p-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex gap-3">
          <ShieldAlert className="mt-0.5 h-5 w-5 shrink-0 text-amber-700" />
          <div>
            <p className="font-semibold text-primary">{t('verification.nudgeTitle')}</p>
            <p className="mt-1 text-sm text-muted">{t('verification.nudgeBody')}</p>
          </div>
        </div>
        <Button as={Link} to="/landlord/verify" variant="outline" size="sm" className="shrink-0">
          {t('verification.nudgeCta')}
        </Button>
      </div>
    </div>
  )
}
