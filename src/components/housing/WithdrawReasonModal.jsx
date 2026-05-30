import { useState } from 'react'
import { useTranslation } from '../../hooks/useTranslation'
import Button from '../ui/Button'
import Modal from '../ui/Modal'
import { Textarea } from '../ui/Input'

export const APPLICATION_WITHDRAW_REASONS = [
  { id: 'found_other_room', labelKey: 'withdraw.reason.foundOtherRoom' },
  { id: 'plans_changed', labelKey: 'withdraw.reason.plansChanged' },
  { id: 'listing_not_suitable', labelKey: 'withdraw.reason.listingNotSuitable' },
  { id: 'other', labelKey: 'withdraw.reason.other' },
]

export const VIEWING_CANCEL_REASONS = [
  { id: 'schedule_conflict', labelKey: 'withdraw.reason.scheduleConflict' },
  { id: 'found_alternative', labelKey: 'withdraw.reason.foundAlternative' },
  { id: 'no_longer_available', labelKey: 'withdraw.reason.noLongerAvailable' },
  { id: 'other', labelKey: 'withdraw.reason.other' },
]

export default function WithdrawReasonModal({
  open,
  onClose,
  onConfirm,
  title,
  reasons = APPLICATION_WITHDRAW_REASONS,
  busy = false,
}) {
  const { t } = useTranslation()
  const [code, setCode] = useState('')
  const [note, setNote] = useState('')

  function handleClose() {
    setCode('')
    setNote('')
    onClose()
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!code) return
    await onConfirm({ reasonCode: code, reasonNote: note.trim() || null })
    setCode('')
    setNote('')
  }

  return (
    <Modal open={open} onClose={handleClose} title={title} size="sm">
      <form onSubmit={handleSubmit} className="space-y-4">
        <p className="text-sm text-muted">{t('withdraw.prompt')}</p>
        <div className="space-y-2">
          {reasons.map((r) => (
            <label
              key={r.id}
              className={`flex cursor-pointer items-start gap-3 rounded-lg border p-3 text-sm transition-colors ${
                code === r.id ? 'border-accent bg-accent/5' : 'border-border hover:bg-background'
              }`}
            >
              <input
                type="radio"
                name="withdraw-reason"
                value={r.id}
                checked={code === r.id}
                onChange={() => setCode(r.id)}
                className="mt-1"
              />
              <span>{t(r.labelKey)}</span>
            </label>
          ))}
        </div>
        <Textarea
          label={t('withdraw.noteLabel')}
          placeholder={t('withdraw.notePlaceholder')}
          value={note}
          onChange={(e) => setNote(e.target.value)}
          rows={3}
        />
        <div className="flex gap-2">
          <Button type="button" variant="outline" className="flex-1" onClick={handleClose} disabled={busy}>
            {t('reviews.cancel')}
          </Button>
          <Button type="submit" className="flex-1" disabled={!code || busy}>
            {busy ? t('housing.sending') : t('withdraw.confirm')}
          </Button>
        </div>
      </form>
    </Modal>
  )
}
