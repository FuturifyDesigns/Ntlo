import { useEffect, useState, useCallback } from 'react'
import { createPortal } from 'react-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { X, ChevronLeft, ChevronRight, ExternalLink, Loader2, FileText, AlertTriangle } from 'lucide-react'
import { getSignedDocUrl } from '../../lib/verificationStorage'
import { isImagePath, isPdfPath } from '../../lib/adminAdvisor'
import { useTranslation } from '../../hooks/useTranslation'
import Badge from '../ui/Badge'

export default function DocumentPreviewModal({ docs, index, subjectName, onClose, onIndex, resolveUrl }) {
  const { t } = useTranslation()
  const [url, setUrl] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  const doc = docs?.[index] || null
  const total = docs?.length || 0
  const getUrl = resolveUrl || getSignedDocUrl

  const go = useCallback(
    (delta) => {
      if (!total) return
      const next = (index + delta + total) % total
      onIndex(next)
    },
    [index, total, onIndex]
  )

  useEffect(() => {
    let active = true
    if (!doc) return undefined
    setLoading(true)
    setError(false)
    setUrl('')
    getUrl(doc.storage_path)
      .then((signed) => active && setUrl(signed))
      .catch(() => active && setError(true))
      .finally(() => active && setLoading(false))
    return () => {
      active = false
    }
  }, [doc, getUrl])

  useEffect(() => {
    function onKey(e) {
      if (e.key === 'Escape') onClose()
      if (e.key === 'ArrowRight') go(1)
      if (e.key === 'ArrowLeft') go(-1)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose, go])

  if (!doc || typeof document === 'undefined') return null

  const isImage = isImagePath(doc.storage_path, doc.file_name)
  const isPdf = isPdfPath(doc.storage_path, doc.file_name)
  const typeLabel = t(`admin.docType.${doc.doc_type}`)

  return createPortal(
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-[120] flex flex-col bg-primary/80 backdrop-blur-sm"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
      >
        <div className="flex items-center justify-between gap-3 px-4 py-3 text-white sm:px-6" onClick={(e) => e.stopPropagation()}>
          <div className="min-w-0">
            <p className="truncate font-display text-base font-semibold">{typeLabel}</p>
            <p className="truncate text-xs text-white/60">
              {subjectName ? `${subjectName} · ` : ''}{doc.file_name}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {url && (
              <a
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 rounded-lg border border-white/20 px-3 py-1.5 text-xs font-semibold text-white hover:bg-white/10"
              >
                <ExternalLink size={14} />
                <span className="hidden sm:inline">{t('admin.openInTab')}</span>
              </a>
            )}
            <button
              type="button"
              onClick={onClose}
              className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-white/20 text-white hover:bg-white/10"
              aria-label={t('admin.close')}
            >
              <X size={18} />
            </button>
          </div>
        </div>

        <div className="relative flex flex-1 items-center justify-center overflow-hidden px-2 pb-2 sm:px-12" onClick={(e) => e.stopPropagation()}>
          {total > 1 && (
            <button
              type="button"
              onClick={() => go(-1)}
              className="absolute left-2 z-10 inline-flex h-11 w-11 items-center justify-center rounded-full bg-white/10 text-white backdrop-blur hover:bg-white/20 sm:left-4"
              aria-label={t('admin.prev')}
            >
              <ChevronLeft size={22} />
            </button>
          )}

          <motion.div
            key={doc.id}
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.2 }}
            className="flex h-full max-h-[78vh] w-full max-w-4xl items-center justify-center overflow-hidden rounded-xl bg-surface"
          >
            {loading ? (
              <div className="flex flex-col items-center gap-3 text-muted">
                <Loader2 size={32} className="animate-spin text-accent" />
                <p className="text-sm">{t('admin.loadingDoc')}</p>
              </div>
            ) : error ? (
              <div className="flex flex-col items-center gap-3 px-6 text-center text-error">
                <AlertTriangle size={32} />
                <p className="text-sm">{t('admin.docLoadError')}</p>
              </div>
            ) : isImage ? (
              <img src={url} alt={typeLabel} className="max-h-full max-w-full object-contain" />
            ) : isPdf ? (
              <iframe src={url} title={typeLabel} className="h-full w-full" />
            ) : (
              <div className="flex flex-col items-center gap-3 px-6 text-center text-muted">
                <FileText size={32} />
                <p className="text-sm">{t('admin.cannotPreview')}</p>
                <a
                  href={url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-primary"
                >
                  <ExternalLink size={14} />
                  {t('admin.openInTab')}
                </a>
              </div>
            )}
          </motion.div>

          {total > 1 && (
            <button
              type="button"
              onClick={() => go(1)}
              className="absolute right-2 z-10 inline-flex h-11 w-11 items-center justify-center rounded-full bg-white/10 text-white backdrop-blur hover:bg-white/20 sm:right-4"
              aria-label={t('admin.next')}
            >
              <ChevronRight size={22} />
            </button>
          )}
        </div>

        <div className="flex items-center justify-center gap-3 px-4 py-3" onClick={(e) => e.stopPropagation()}>
          <Badge variant="dark">{t('admin.docOf', { current: index + 1, total })}</Badge>
        </div>
      </motion.div>
    </AnimatePresence>,
    document.body
  )
}
