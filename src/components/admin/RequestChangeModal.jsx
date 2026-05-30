import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { MessageSquare, X, Send, Loader2, CheckCircle2, Sparkles } from 'lucide-react'
import { useTranslation } from '../../hooks/useTranslation'
import Button from '../ui/Button'

/**
 * In-app modal to send document-change feedback to a landlord.
 * Pre-fills a suggestion derived from the compliance scan.
 */
export default function RequestChangeModal({ docLabel, suggestion = '', onSend, onClose }) {
  const { t } = useTranslation()
  const [message, setMessage] = useState(suggestion)
  const [sending, setSending] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    function onKey(e) {
      if (e.key === 'Escape' && !sending) onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose, sending])

  async function handleSend() {
    if (!message.trim() || sending) return
    setSending(true)
    setError('')
    try {
      await onSend(message.trim())
      setSent(true)
      setTimeout(onClose, 1300)
    } catch (err) {
      setError(err.message || t('admin.compliance.sendFailed'))
      setSending(false)
    }
  }

  return createPortal(
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[60] flex items-end justify-center bg-black/50 p-0 backdrop-blur-sm sm:items-center sm:p-4"
        onClick={() => !sending && onClose()}
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
              <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-amber-500/10 text-amber-600">
                <MessageSquare size={18} />
              </span>
              <div>
                <p className="font-semibold text-primary">{t('admin.compliance.requestTitle')}</p>
                <p className="text-xs text-muted">{docLabel}</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => !sending && onClose()}
              className="flex h-8 w-8 items-center justify-center rounded-lg text-muted hover:bg-background"
            >
              <X size={18} />
            </button>
          </div>

          {sent ? (
            <div className="flex flex-col items-center gap-2 px-5 py-10 text-center">
              <CheckCircle2 size={40} className="text-success" />
              <p className="font-semibold text-primary">{t('admin.compliance.sentTitle')}</p>
              <p className="text-sm text-muted">{t('admin.compliance.sentDesc')}</p>
            </div>
          ) : (
            <div className="px-5 py-4">
              {suggestion && (
                <p className="mb-2 flex items-center gap-1.5 text-xs font-medium text-accent">
                  <Sparkles size={12} />
                  {t('admin.compliance.suggestedNote')}
                </p>
              )}
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-muted">
                {t('admin.compliance.messageLabel')}
              </label>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                rows={7}
                autoFocus
                placeholder={t('admin.compliance.messagePlaceholder')}
                className="w-full resize-none rounded-xl border border-border bg-background px-3 py-2.5 text-sm text-primary outline-none focus:border-accent focus:ring-2 focus:ring-accent/20"
              />
              <p className="mt-1.5 text-xs text-muted">{t('admin.compliance.realtimeHint')}</p>
              {error && <p className="mt-2 text-sm text-error">{error}</p>}

              <div className="mt-4 flex justify-end gap-2">
                <Button variant="outline" size="sm" onClick={onClose} disabled={sending}>
                  {t('admin.cancel')}
                </Button>
                <Button size="sm" onClick={handleSend} disabled={!message.trim() || sending}>
                  {sending ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
                  {sending ? t('admin.compliance.sending') : t('admin.compliance.sendToLandlord')}
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
