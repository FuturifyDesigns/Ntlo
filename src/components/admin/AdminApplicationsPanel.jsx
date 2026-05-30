import { useState } from 'react'
import { FileText, Loader2 } from 'lucide-react'
import { useTranslation } from '../../hooks/useTranslation'
import { useAdminApplications } from '../../hooks/useHousing'
import { getSignedApplicationDocUrl } from '../../lib/applicationDocs'
import Card from '../ui/Card'
import Badge from '../ui/Badge'
import Button from '../ui/Button'
import DocumentPreviewModal from './DocumentPreviewModal'

function statusVariant(status) {
  if (status === 'accepted' || status === 'rented') return 'success'
  if (status === 'rejected' || status === 'withdrawn') return 'error'
  return 'default'
}

export default function AdminApplicationsPanel() {
  const { t } = useTranslation()
  const { applications, loading } = useAdminApplications()
  const [preview, setPreview] = useState(null)

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="animate-spin text-muted" />
      </div>
    )
  }

  if (!applications.length) {
    return (
      <Card className="p-8 text-center">
        <p className="text-muted">{t('admin.noApplications')}</p>
      </Card>
    )
  }

  return (
    <>
      <p className="mb-4 text-sm text-muted">{t('admin.applicationsHint')}</p>
      <div className="space-y-4">
        {applications.map((app) => (
          <Card key={app.id} className="space-y-3 p-4">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div>
                <p className="font-semibold text-primary">{app.listing?.title}</p>
                <p className="text-sm text-muted">
                  {t('housing.student')}: {app.student?.full_name} · {t('housing.landlord')}: {app.landlord?.full_name}
                </p>
                <p className="text-xs text-muted">
                  {new Date(app.created_at).toLocaleString()}
                  {app.rented_at && ` · ${t('housing.rentedAt')}: ${new Date(app.rented_at).toLocaleString()}`}
                </p>
              </div>
              <Badge variant={statusVariant(app.status)}>{app.status}</Badge>
            </div>

            {app.intro_message && (
              <p className="rounded-lg bg-background p-3 text-sm text-muted">{app.intro_message}</p>
            )}

            {app.landlord_notes && (
              <p className="text-xs text-muted">
                <span className="font-semibold">{t('admin.landlordNotes')}:</span> {app.landlord_notes}
              </p>
            )}

            <div className="flex flex-wrap gap-2">
              {(app.documents || []).map((doc, index) => (
                <Button
                  key={doc.id}
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setPreview({ docs: app.documents, index, name: app.student?.full_name })}
                >
                  <FileText size={14} />
                  {doc.file_name || doc.doc_type}
                </Button>
              ))}
            </div>
          </Card>
        ))}
      </div>

      {preview && (
        <DocumentPreviewModal
          docs={preview.docs}
          index={preview.index}
          subjectName={preview.name}
          onClose={() => setPreview(null)}
          onIndex={(index) => setPreview((p) => ({ ...p, index }))}
          resolveUrl={(path) => getSignedApplicationDocUrl(path)}
        />
      )}
    </>
  )
}
