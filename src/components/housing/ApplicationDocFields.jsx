import { useRef, useState } from 'react'
import { Upload, FileText, CheckCircle, X, Loader2 } from 'lucide-react'
import { useTranslation } from '../../hooks/useTranslation'
import { APPLICATION_DOC_TYPES } from '../../lib/applicationDocs'
import { prepareApplicationDoc, formatFileSize, UPLOAD_LIMITS } from '../../lib/compressUploadFile'
import Button from '../ui/Button'

export default function ApplicationDocFields({ files, onChange, disabled = false }) {
  const { t } = useTranslation()
  const refs = useRef({})
  const [busyType, setBusyType] = useState(null)
  const [errors, setErrors] = useState({})

  async function handleFile(docType, file) {
    if (!file) {
      onChange({ ...files, [docType]: null })
      setErrors((prev) => ({ ...prev, [docType]: '' }))
      return
    }

    setBusyType(docType)
    setErrors((prev) => ({ ...prev, [docType]: '' }))
    try {
      const prepared = await prepareApplicationDoc(file)
      onChange({ ...files, [docType]: prepared })
    } catch (err) {
      setErrors((prev) => ({ ...prev, [docType]: err.message }))
      if (refs.current[docType]) refs.current[docType].value = ''
    } finally {
      setBusyType(null)
    }
  }

  return (
    <div className="space-y-3">
      <p className="text-sm font-medium text-primary">{t('housing.requiredDocuments')}</p>
      <p className="text-xs text-muted">{t('housing.documentsHint')}</p>
      <p className="text-xs text-muted">
        {t('housing.uploadLimits', {
          imageMax: formatFileSize(UPLOAD_LIMITS.imageMaxSizeMB * 1024 * 1024),
          pdfMax: formatFileSize(UPLOAD_LIMITS.maxPdfBytes),
        })}
      </p>
      {APPLICATION_DOC_TYPES.map(({ id, labelKey, descKey }) => {
        const selected = files[id]
        const busy = busyType === id
        return (
          <div key={id} className={`rounded-lg border p-3 ${selected ? 'border-success/40 bg-success/5' : 'border-border'}`}>
            <div className="flex items-start justify-between gap-2">
              <div className="flex min-w-0 items-start gap-2">
                {busy ? (
                  <Loader2 size={16} className="mt-0.5 shrink-0 animate-spin text-muted" />
                ) : selected ? (
                  <CheckCircle size={16} className="mt-0.5 shrink-0 text-success" />
                ) : (
                  <FileText size={16} className="mt-0.5 shrink-0 text-muted" />
                )}
                <div className="min-w-0">
                  <p className="text-sm font-medium text-primary">{t(labelKey)}</p>
                  <p className="mt-0.5 text-xs text-muted">{t(descKey)}</p>
                  {selected && (
                    <p className="mt-1 truncate text-xs text-muted">
                      {selected.name} · {formatFileSize(selected.size)}
                    </p>
                  )}
                  {errors[id] && <p className="mt-1 text-xs text-error">{errors[id]}</p>}
                </div>
              </div>
              <div className="flex shrink-0 gap-1">
                {selected && (
                  <Button type="button" variant="ghost" size="sm" disabled={disabled || busy} onClick={() => handleFile(id, null)}>
                    <X size={14} />
                  </Button>
                )}
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={disabled || busy}
                  onClick={() => refs.current[id]?.click()}
                >
                  {busy ? <Loader2 size={14} className="animate-spin" /> : <Upload size={14} />}
                  {selected ? t('housing.replaceDoc') : t('housing.uploadDoc')}
                </Button>
              </div>
            </div>
            <input
              ref={(el) => { refs.current[id] = el }}
              type="file"
              accept="image/jpeg,image/png,image/webp,image/heic,.pdf"
              className="hidden"
              disabled={disabled || busy}
              onChange={(e) => handleFile(id, e.target.files?.[0] || null)}
            />
          </div>
        )
      })}
    </div>
  )
}
