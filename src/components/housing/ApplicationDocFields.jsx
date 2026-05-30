import { useRef, useState } from 'react'
import { Upload, FileText, CheckCircle, X } from 'lucide-react'
import { useTranslation } from '../../hooks/useTranslation'
import { APPLICATION_DOC_TYPES } from '../../lib/applicationDocs'
import Button from '../ui/Button'

export default function ApplicationDocFields({ files, onChange, disabled = false }) {
  const { t } = useTranslation()
  const refs = useRef({})

  function handleFile(docType, file) {
    onChange({ ...files, [docType]: file || null })
  }

  return (
    <div className="space-y-3">
      <p className="text-sm font-medium text-primary">{t('housing.requiredDocuments')}</p>
      <p className="text-xs text-muted">{t('housing.documentsHint')}</p>
      {APPLICATION_DOC_TYPES.map(({ id, labelKey }) => {
        const selected = files[id]
        return (
          <div key={id} className={`rounded-lg border p-3 ${selected ? 'border-success/40 bg-success/5' : 'border-border'}`}>
            <div className="flex items-center justify-between gap-2">
              <div className="flex min-w-0 items-center gap-2">
                {selected ? (
                  <CheckCircle size={16} className="shrink-0 text-success" />
                ) : (
                  <FileText size={16} className="shrink-0 text-muted" />
                )}
                <div className="min-w-0">
                  <p className="text-sm font-medium text-primary">{t(labelKey)}</p>
                  {selected && (
                    <p className="truncate text-xs text-muted">{selected.name}</p>
                  )}
                </div>
              </div>
              <div className="flex shrink-0 gap-1">
                {selected && (
                  <Button type="button" variant="ghost" size="sm" disabled={disabled} onClick={() => handleFile(id, null)}>
                    <X size={14} />
                  </Button>
                )}
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={disabled}
                  onClick={() => refs.current[id]?.click()}
                >
                  <Upload size={14} />
                  {selected ? t('housing.replaceDoc') : t('housing.uploadDoc')}
                </Button>
              </div>
            </div>
            <input
              ref={(el) => { refs.current[id] = el }}
              type="file"
              accept="image/*,.pdf"
              className="hidden"
              disabled={disabled}
              onChange={(e) => handleFile(id, e.target.files?.[0] || null)}
            />
          </div>
        )
      })}
    </div>
  )
}
