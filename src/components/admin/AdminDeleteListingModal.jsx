import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Trash2, Loader2, X } from 'lucide-react'
import { useTranslation } from '../../hooks/useTranslation'
import Button from '../ui/Button'
import { Textarea } from '../ui/Input'
import { LISTING_REMOVAL_REASON_CODES } from '../../lib/listingAdmin'

export default function AdminDeleteListingModal({ open, listingTitle, onClose, onConfirm }) {
  const { t } = useTranslation()
  const [reasonCode, setReasonCode] = useState('policy_violation')
  const [reasonNote, setReasonNote] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!open) return undefined
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = prev
    }
  }, [open])

  if (!open) return null

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setBusy(true)
    try {
      await onConfirm({
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
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-primary/50 backdrop-blur-sm"
          onClick={() => !busy && onClose()}
        />
        <motion.form
          initial={{ opacity: 0, y: 24, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 24, scale: 0.98 }}
          role="dialog"
          aria-modal="true"
          className="relative flex max-h-[min(90dvh,720px)] w-full max-w-lg flex-col overflow-hidden rounded-2xl bg-surface shadow-xl"
          onClick={(e) => e.stopPropagation()}
          onSubmit={handleSubmit}
        >
          <div className="flex shrink-0 items-center justify-between gap-3 border-b border-border px-5 py-4">
            <div className="flex items-center gap-2">
              <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-error/10 text-error">
                <Trash2 size={18} />
              </span>
              <div>
                <p className="font-semibold text-primary">{t('admin.listingDeleteTitle')}</p>
                {listingTitle && <p className="text-xs text-muted">{listingTitle}</p>}
              </div>
            </div>
            <button type="button" onClick={onClose} disabled={busy} className="rounded-lg p-1.5 text-muted hover:bg-background">
              <X size={18} />
            </button>
          </div>

          <div className="min-h-0 flex-1 space-y-4 overflow-y-auto overscroll-contain px-5 py-4">
            <p className="text-sm text-muted">{t('admin.listingDeleteHint')}</p>

            <div>
              <p className="mb-2 text-sm font-medium text-primary">{t('admin.listingDeleteReasonLabel')}</p>
              <div className="space-y-2">
                {LISTING_REMOVAL_REASON_CODES.map((code) => (
                  <label key={code} className="flex cursor-pointer items-start gap-2 rounded-lg border border-border px-3 py-2 hover:bg-background">
                    <input
                      type="radio"
                      name="listing-delete-reason"
                      value={code}
                      checked={reasonCode === code}
                      onChange={() => setReasonCode(code)}
                      className="mt-1"
                    />
                    <span className="text-sm text-primary">{t(`admin.listingDeleteReason.${code}`)}</span>
                  </label>
                ))}
              </div>
            </div>

            <Textarea
              label={t('admin.listingDeleteNoteLabel')}
              value={reasonNote}
              onChange={(e) => setReasonNote(e.target.value)}
              placeholder={t('admin.listingDeleteNotePlaceholder')}
              rows={3}
            />

            <p className="text-xs text-muted">{t('admin.listingDeleteNotifyHint')}</p>
            {error && <p className="text-sm text-error">{error}</p>}
          </div>

          <div className="flex shrink-0 justify-end gap-2 border-t border-border px-5 py-4">
            <Button type="button" variant="outline" onClick={onClose} disabled={busy}>
              {t('admin.cancel')}
            </Button>
            <Button type="submit" variant="danger" disabled={busy}>
              {busy ? <Loader2 size={14} className="animate-spin" /> : null}
              {t('admin.listingDeleteConfirm')}
            </Button>
          </div>
        </motion.form>
      </div>
    </AnimatePresence>,
    document.body
  )
}
