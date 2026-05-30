import { useRef, useState } from 'react'
import { Upload, FileText, CheckCircle, Loader2 } from 'lucide-react'
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

  return (
    <div className={`rounded-xl border p-4 ${uploaded ? 'border-success/40 bg-success/5' : 'border-border bg-surface'}`}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            {uploaded ? (
              <CheckCircle size={18} className="shrink-0 text-success" />
            ) : (
              <FileText size={18} className="shrink-0 text-muted" />
            )}
            <p className="font-medium text-primary">{label}</p>
          </div>
          {description && <p className="mt-1 text-sm text-muted">{description}</p>}
          {uploaded && (
            <p className="mt-2 truncate text-xs text-success">
              {uploaded.file_name || t('verification.uploaded')}
            </p>
          )}
          {error && <p className="mt-2 text-sm text-error">{error}</p>}
        </div>
        <Button
          type="button"
          variant="outline"
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
