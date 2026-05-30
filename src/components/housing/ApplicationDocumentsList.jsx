import { useState } from 'react'
import { FileText, ExternalLink, Loader2 } from 'lucide-react'
import { useTranslation } from '../../hooks/useTranslation'
import { APPLICATION_DOC_TYPES, getSignedApplicationDocUrl } from '../../lib/applicationDocs'
import Button from '../ui/Button'

export default function ApplicationDocumentsList({ documents, onPreview }) {
  const { t } = useTranslation()
  const [loadingId, setLoadingId] = useState(null)

  if (!documents?.length) {
    return <p className="text-xs text-muted">{t('housing.noDocuments')}</p>
  }

  async function openDoc(doc) {
    if (onPreview) {
      onPreview(doc)
      return
    }
    setLoadingId(doc.id)
    try {
      const url = await getSignedApplicationDocUrl(doc.storage_path)
      window.open(url, '_blank', 'noopener,noreferrer')
    } finally {
      setLoadingId(null)
    }
  }

  const byType = Object.fromEntries(documents.map((d) => [d.doc_type, d]))

  return (
    <div className="space-y-2">
      <p className="text-xs font-semibold uppercase tracking-wide text-muted">{t('housing.studentDocuments')}</p>
      {APPLICATION_DOC_TYPES.map(({ id, labelKey }) => {
        const doc = byType[id]
        return (
          <div key={id} className="flex items-center justify-between gap-2 rounded-lg border border-border px-3 py-2">
            <div className="flex min-w-0 items-center gap-2">
              <FileText size={14} className="shrink-0 text-muted" />
              <span className="truncate text-sm text-primary">{t(labelKey)}</span>
            </div>
            {doc ? (
              <Button type="button" variant="ghost" size="sm" disabled={loadingId === doc.id} onClick={() => openDoc(doc)}>
                {loadingId === doc.id ? <Loader2 size={14} className="animate-spin" /> : <ExternalLink size={14} />}
                {t('housing.viewDoc')}
              </Button>
            ) : (
              <span className="text-xs text-error">{t('housing.docMissing')}</span>
            )}
          </div>
        )
      })}
    </div>
  )
}
