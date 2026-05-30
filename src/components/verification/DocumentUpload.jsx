import { useRef, useState } from 'react'
import { Upload, FileText, CheckCircle, Loader2, AlertCircle } from 'lucide-react'
import { useTranslation } from '../../hooks/useTranslation'
import Button from '../ui/Button'

export default function DocumentUpload({
  docType,
  label,
  description,
  accept = 'image/*,.pdf',
  uploaded,
  onUpload,
  disabled = false,
}) {
  const { t } = useTranslation()
  const inputRef = useRef(null)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')

  const flagged = uploaded && ['changes_requested', 'rejected'].includes(uploaded.status)
  const approved = uploaded && uploaded.status === 'approved'

  async function handleFile(e) {
    const file = e.target.files?.[0]
    if (!file) return
    setError('')
    setUploading(true)
    try {
      await onUpload(docType, file)
    } catch (err) {
      setError(err.message || t('verification.uploadFailed'))
    } finally {
      setUploading(false)
      if (inputRef.current) inputRef.current.value = ''
    }
  }

  const borderClass = flagged
    ? 'border-amber-500/50 bg-amber-500/5'
    : uploaded
      ? 'border-success/40 bg-success/5'
      : 'border-border bg-surface'

  return (
    <div className={`rounded-xl border p-4 ${borderClass}`}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            {flagged ? (
              <AlertCircle size={18} className="shrink-0 text-amber-600" />
            ) : uploaded ? (
              <CheckCircle size={18} className="shrink-0 text-success" />
            ) : (
              <FileText size={18} className="shrink-0 text-muted" />
            )}
            <p className="font-medium text-primary">{label}</p>
          </div>
          {description && <p className="mt-1 text-sm text-muted">{description}</p>}
          {uploaded && !flagged && (
            <>
              <p className="mt-2 truncate text-xs text-muted">
                {uploaded.file_name || t('verification.uploaded')}
              </p>
              {approved && (
                <p className="mt-1 inline-flex items-center gap-1 text-xs font-semibold text-success">
                  <CheckCircle size={12} />
                  {t('verification.docApproved')}
                </p>
              )}
            </>
          )}
          {flagged && (
            <div className="mt-2 rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2">
              <p className="text-xs font-semibold text-amber-700">{t('verification.needsUpdate')}</p>
              {uploaded.admin_notes && (
                <p className="mt-1 text-xs text-amber-700/90">
                  <span className="font-medium">{t('verification.adminFeedback')}:</span> {uploaded.admin_notes}
                </p>
              )}
            </div>
          )}
          {error && <p className="mt-2 text-sm text-error">{error}</p>}
        </div>
        <Button
          type="button"
          variant={flagged ? 'accent' : 'outline'}
          size="sm"
          disabled={disabled || uploading}
          onClick={() => inputRef.current?.click()}
        >
          {uploading ? <Loader2 size={14} className="animate-spin" /> : <Upload size={14} />}
          {uploaded ? t('verification.replace') : t('verification.upload')}
        </Button>
      </div>
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        className="hidden"
        onChange={handleFile}
      />
    </div>
  )
}
