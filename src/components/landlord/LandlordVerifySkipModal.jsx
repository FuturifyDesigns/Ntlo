import { AlertTriangle } from 'lucide-react'
import Modal from '../ui/Modal'
import Button from '../ui/Button'
import { useTranslation } from '../../hooks/useTranslation'

export default function LandlordVerifySkipModal({ open, onClose, onConfirm, busy }) {
  const { t } = useTranslation()

  return (
    <Modal open={open} onClose={busy ? undefined : onClose} title={t('verification.skipModalTitle')}>
      <div className="space-y-4">
        <div className="flex gap-3 rounded-xl border border-amber-500/30 bg-amber-500/5 p-4">
          <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-700" />
          <p className="text-sm text-primary">{t('verification.skipModalBody')}</p>
        </div>
        <ul className="list-inside list-disc space-y-1.5 text-sm text-muted">
          <li>{t('verification.skipModalPointVerify')}</li>
          <li>{t('verification.skipModalPointBadge')}</li>
          <li>{t('verification.skipModalPointList')}</li>
        </ul>
        <div className="flex flex-wrap gap-3 pt-2">
          <Button variant="outline" onClick={onClose} disabled={busy}>
            {t('verification.skipModalBack')}
          </Button>
          <Button onClick={onConfirm} disabled={busy}>
            {busy ? t('verification.skipModalBusy') : t('verification.skipModalConfirm')}
          </Button>
        </div>
      </div>
    </Modal>
  )
}
