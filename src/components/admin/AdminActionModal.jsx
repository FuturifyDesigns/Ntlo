import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Loader2, CheckCircle2, AlertTriangle } from 'lucide-react'
import { useTranslation } from '../../hooks/useTranslation'
import Button from '../ui/Button'

/**
 * In-app confirm / prompt dialog — replaces window.confirm and window.prompt.
 * mode: 'confirm' | 'prompt'
 */
export default function AdminActionModal({
  mode = 'prompt',
  title,
  subtitle,
  description,
  placeholder = '',
  noteRequired = false,
  confirmLabel,
  confirmVariant = 'primary',
  onConfirm,
  onClose,
}) {
  const { t } = useTranslation()
  const [note, setNote] = useState('')
  const [busy, setBusy] = useState(false)
  const [done, setDone] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    function onKey(e) {
      if (e.key === 'Escape' && !busy) onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose, busy])

  async function handleConfirm() {
    if (mode === 'prompt' && noteRequired && !note.trim()) return
    setBusy(true)
    setError('')
    try {
      await onConfirm(mode === 'prompt' ? note.trim() || null : undefined)
      setDone(true)
      setTimeout(onClose, 1200)
    } catch (err) {
      setError(err.message || t('admin.actionFailed'))
      setBusy(false)
    }
  }

  const Icon = mode === 'confirm' ? AlertTriangle : CheckCircle2
  const iconClass = confirmVariant === 'danger' ? 'bg-error/10 text-error' : 'bg-accent/10 text-accent'

  return createPortal(
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[60] flex items-end justify-center bg-black/50 p-0 backdrop-blur-sm sm:items-center sm:p-4"
        onClick={() => !busy && onClose()}
      >
        <motion.div
          initial={{ opacity: 0, y: 24, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 24, scale: 0.98 }}
          transition={{ type: 'spring', damping: 26, stiffness: 320 }}
          className="w-full max-w-lg overflow-hidden rounded-t-2xl bg-surface shadow-xl sm:rounded-2xl"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center justify-between gap-3 border-b border-border px-5 py-4">
            <div className="flex items-center gap-2">
              <span className={`flex h-9 w-9 items-center justify-center rounded-lg ${iconClass}`}>
                <Icon size={18} />
              </span>
              <div>
                <p className="font-semibold text-primary">{title}</p>
                {subtitle && <p className="text-xs text-muted">{subtitle}</p>}
              </div>
            </div>
            <button
              type="button"
              onClick={() => !busy && onClose()}
              className="flex h-8 w-8 items-center justify-center rounded-lg text-muted hover:bg-background"
            >
              <X size={18} />
            </button>
          </div>

          {done ? (
            <div className="flex flex-col items-center gap-2 px-5 py-10 text-center">
              <CheckCircle2 size={40} className="text-success" />
              <p className="font-semibold text-primary">{t('admin.dialog.done')}</p>
            </div>
          ) : (
            <div className="px-5 py-4">
              {description && <p className="mb-3 text-sm text-muted">{description}</p>}

              {mode === 'prompt' && (
                <>
                  <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-muted">
                    {placeholder}
                  </label>
                  <textarea
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    rows={4}
                    autoFocus
                    className="w-full resize-none rounded-xl border border-border bg-background px-3 py-2.5 text-sm text-primary outline-none focus:border-accent focus:ring-2 focus:ring-accent/20"
                  />
                </>
              )}

              {error && <p className="mt-2 text-sm text-error">{error}</p>}

              <div className="mt-4 flex justify-end gap-2">
                <Button variant="outline" size="sm" onClick={onClose} disabled={busy}>
                  {t('admin.cancel')}
                </Button>
                <Button
                  size="sm"
                  variant={confirmVariant === 'danger' ? 'danger' : confirmVariant === 'accent' ? 'accent' : 'primary'}
                  onClick={handleConfirm}
                  disabled={busy || (mode === 'prompt' && noteRequired && !note.trim())}
                >
                  {busy && <Loader2 size={14} className="animate-spin" />}
                  {confirmLabel}
                </Button>
              </div>
            </div>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>,
    document.body
  )
}
