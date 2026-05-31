import { useState } from 'react'
import { createPortal } from 'react-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Ban, Loader2, X } from 'lucide-react'
import { useTranslation } from '../../hooks/useTranslation'
import Button from '../ui/Button'
import Input, { Textarea } from '../ui/Input'
import { BAN_REASON_CODES, BAN_DURATION_TYPES } from '../../lib/bans'

export default function AdminBanModal({ open, userName, onClose, onConfirm }) {
  const { t } = useTranslation()
  const [durationType, setDurationType] = useState('days')
  const [durationAmount, setDurationAmount] = useState('7')
  const [reasonCode, setReasonCode] = useState('terms_violation')
  const [reasonNote, setReasonNote] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  if (!open) return null

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setBusy(true)
    try {
      const amount = durationType === 'permanent' ? null : Number(durationAmount)
      if (durationType !== 'permanent' && (!Number.isFinite(amount) || amount < 1)) {
        setError(t('admin.banInvalidDuration'))
        setBusy(false)
        return
      }
      await onConfirm({
        durationType,
        durationAmount: amount,
        reasonCode,
        reasonNote: reasonNote.trim() || null,
      })
      onClose()
    } catch (err) {
      setError(err.message || t('admin.actionFailed'))
    } finally {
      setBusy(false)
    }
  }

  return createPortal(
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[70] flex items-end justify-center bg-black/50 p-0 backdrop-blur-sm sm:items-center sm:p-4"
        onClick={() => !busy && onClose()}
      >
        <motion.form
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 24 }}
          className="w-full max-w-lg overflow-hidden rounded-t-2xl bg-surface shadow-xl sm:rounded-2xl"
          onClick={(e) => e.stopPropagation()}
          onSubmit={handleSubmit}
        >
          <div className="flex items-center justify-between gap-3 border-b border-border px-5 py-4">
            <div className="flex items-center gap-2">
              <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-error/10 text-error">
                <Ban size={18} />
              </span>
              <div>
                <p className="font-semibold text-primary">{t('admin.dialog.banTitle')}</p>
                {userName && <p className="text-xs text-muted">{userName}</p>}
              </div>
            </div>
            <button type="button" onClick={onClose} disabled={busy} className="rounded-lg p-1.5 text-muted hover:bg-background">
              <X size={18} />
            </button>
          </div>

          <div className="space-y-4 px-5 py-4">
            <div>
              <p className="mb-2 text-sm font-medium text-primary">{t('admin.banDurationLabel')}</p>
              <div className="flex flex-wrap gap-2">
                {BAN_DURATION_TYPES.map((type) => (
                  <button
                    key={type}
                    type="button"
                    onClick={() => setDurationType(type)}
                    className={`rounded-full px-3 py-1.5 text-sm font-medium transition-colors ${
                      durationType === type
                        ? 'bg-primary text-white'
                        : 'border border-border bg-background text-muted hover:text-primary'
                    }`}
                  >
                    {t(`admin.banDuration.${type}`)}
                  </button>
                ))}
              </div>
            </div>

            {durationType !== 'permanent' && (
              <Input
                label={durationType === 'hours' ? t('admin.banHoursLabel') : t('admin.banDaysLabel')}
                type="number"
                min="1"
                max={durationType === 'hours' ? 8760 : 365}
                value={durationAmount}
                onChange={(e) => setDurationAmount(e.target.value)}
                required
              />
            )}

            <div>
              <p className="mb-2 text-sm font-medium text-primary">{t('admin.banReasonLabel')}</p>
              <div className="space-y-2">
                {BAN_REASON_CODES.map((code) => (
                  <label key={code} className="flex cursor-pointer items-start gap-2 rounded-lg border border-border px-3 py-2 hover:bg-background">
                    <input
                      type="radio"
                      name="ban-reason"
                      value={code}
                      checked={reasonCode === code}
                      onChange={() => setReasonCode(code)}
                      className="mt-1"
                    />
                    <span className="text-sm text-primary">{t(`admin.banReason.${code}`)}</span>
                  </label>
                ))}
              </div>
            </div>

            <Textarea
              label={t('admin.banNoteLabel')}
              value={reasonNote}
              onChange={(e) => setReasonNote(e.target.value)}
              placeholder={t('admin.banNotePlaceholder')}
              rows={3}
            />

            <p className="text-xs text-muted">{t('admin.banNotifyHint')}</p>
            {error && <p className="text-sm text-error">{error}</p>}

            <div className="flex justify-end gap-2 border-t border-border pt-4">
              <Button type="button" variant="outline" onClick={onClose} disabled={busy}>
                {t('admin.cancel')}
              </Button>
              <Button type="submit" variant="danger" disabled={busy}>
                {busy ? <Loader2 size={14} className="animate-spin" /> : null}
                {t('admin.ban')}
              </Button>
            </div>
          </div>
        </motion.form>
      </motion.div>
    </AnimatePresence>,
    document.body
  )
}
