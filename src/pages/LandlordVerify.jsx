import { useState, useEffect, useCallback } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Shield, Clock, XCircle, CheckCircle, AlertCircle } from 'lucide-react'
import { IconTrustedHome } from '../components/ui/Icons'
import { useAuth } from '../hooks/useAuth'
import { useTranslation } from '../hooks/useTranslation'
import { supabase } from '../lib/supabase'
import { LANDLORD_DOC_TYPES, landlordDocsComplete } from '../lib/verification'
import {
  fetchUserVerificationDocs,
  submitLandlordVerification,
  uploadVerificationDoc,
} from '../lib/verificationStorage'
import DocumentUpload from '../components/verification/DocumentUpload'
import Button from '../components/ui/Button'
import Badge from '../components/ui/Badge'
import { Skeleton } from '../components/ui/Skeleton'

export default function LandlordVerify() {
  const { user, profile, refreshProfile } = useAuth()
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [docs, setDocs] = useState([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  const loadDocs = useCallback(async ({ silent = false } = {}) => {
    if (!user) return
    if (!silent) setLoading(true)
    try {
      const data = await fetchUserVerificationDocs(user.id)
      setDocs(data)
    } finally {
      if (!silent) setLoading(false)
    }
  }, [user])

  useEffect(() => {
    loadDocs()
  }, [loadDocs])

  // Realtime: admin feedback / status changes arrive live
  useEffect(() => {
    if (!user) return undefined
    const channel = supabase
      .channel(`landlord-verify-${user.id}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'verification_documents', filter: `user_id=eq.${user.id}` },
        () => loadDocs({ silent: true })
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'profiles', filter: `id=eq.${user.id}` },
        () => refreshProfile()
      )
      .subscribe()
    return () => supabase.removeChannel(channel)
  }, [user, loadDocs, refreshProfile])


  const docsByType = docs.reduce((acc, doc) => {
    if (!acc[doc.doc_type]) acc[doc.doc_type] = doc
    return acc
  }, {})

  const uploadedTypes = Object.keys(docsByType)
  const canSubmit = landlordDocsComplete(uploadedTypes)
  const status = profile?.verification_status || 'none'
  const flaggedDocs = Object.values(docsByType).filter(
    (d) => ['changes_requested', 'rejected'].includes(d.status) && d.admin_notes
  )

  async function handleUpload(docType, file) {
    await uploadVerificationDoc({ userId: user.id, docType, file })
    await loadDocs({ silent: true })
  }

  async function handleSubmit() {
    if (!canSubmit) return
    setError('')
    setSubmitting(true)
    try {
      await submitLandlordVerification(user.id)
      await refreshProfile()
    } catch (err) {
      setError(err.message || t('verification.submitFailed'))
    } finally {
      setSubmitting(false)
    }
  }

  const STATUS_MAP = {
    none: { variant: 'default', icon: Shield, label: t('verification.statusNone') },
    pending: { variant: 'warning', icon: Clock, label: t('verification.statusPending') },
    rejected: { variant: 'error', icon: XCircle, label: t('verification.statusRejected') },
    changes_requested: { variant: 'warning', icon: AlertCircle, label: t('verification.statusChangesRequested') },
    approved: { variant: 'success', icon: CheckCircle, label: t('verification.statusApproved') },
  }
  const statusBadge = STATUS_MAP[status] || STATUS_MAP.none
  const StatusIcon = statusBadge.icon

  if (status === 'approved') {
    return (
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="mx-auto max-w-lg px-4 py-16 text-center sm:px-6"
      >
        <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-success/10">
          <IconTrustedHome className="h-9 w-9 text-success" />
        </div>
        <h1 className="font-display text-3xl font-bold text-primary">{t('verification.approvedTitle')}</h1>
        <p className="mt-3 text-muted">{t('verification.approvedDesc')}</p>
        {profile?.verification_notes?.trim() && (
          <div className="mx-auto mt-5 max-w-md rounded-xl border border-success/30 bg-success/5 px-4 py-3 text-left">
            <p className="text-xs font-semibold uppercase tracking-wide text-success">
              {t('verification.adminApprovalMessage')}
            </p>
            <p className="mt-1.5 text-sm text-primary">{profile.verification_notes}</p>
          </div>
        )}
        <div className="mt-8">
          <Button size="lg" onClick={() => navigate('/landlord')}>
            {t('verification.goToDashboard')}
          </Button>
        </div>
      </motion.div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="mx-auto max-w-2xl px-4 py-8 sm:px-6 lg:px-8"
    >
      <div className="mb-8 text-center">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-accent/10">
          <IconTrustedHome className="h-8 w-8 text-accent" />
        </div>
        <h1 className="font-display text-3xl font-bold text-primary">{t('verification.landlordTitle')}</h1>
        <p className="mt-2 text-muted">{t('verification.landlordSubtitle')}</p>
        <div className="mt-4 flex justify-center">
          <Badge variant={statusBadge.variant}>
            <StatusIcon size={14} />
            {statusBadge.label}
          </Badge>
        </div>
        {profile?.verification_notes && status === 'rejected' && (
          <p className="mt-3 rounded-lg border border-error/30 bg-error/5 px-4 py-2 text-sm text-error">
            {profile.verification_notes}
          </p>
        )}
      </div>

      {status === 'changes_requested' && (
        <div className="mb-6 rounded-xl border border-amber-500/40 bg-amber-500/5 p-4">
          <p className="flex items-center gap-2 font-semibold text-amber-700">
            <AlertCircle size={18} />
            {t('verification.changesRequestedTitle')}
          </p>
          <p className="mt-1 text-sm text-amber-700/90">{t('verification.changesRequestedDesc')}</p>
          {flaggedDocs.length > 0 && (
            <ul className="mt-3 space-y-2">
              {flaggedDocs.map((d) => (
                <li key={d.id} className="rounded-lg bg-amber-500/10 px-3 py-2 text-sm">
                  <span className="font-medium text-amber-800">
                    {t(`admin.docType.${d.doc_type}`)}:
                  </span>{' '}
                  <span className="text-amber-700/90">{d.admin_notes}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      <div className="mb-6 rounded-xl border border-border bg-surface p-4 text-sm text-muted">
        <p className="font-medium text-primary">{t('verification.whyTitle')}</p>
        <ul className="mt-2 list-inside list-disc space-y-1">
          <li>{t('verification.why1')}</li>
          <li>{t('verification.why2')}</li>
          <li>{t('verification.why3')}</li>
        </ul>
      </div>

      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => <Skeleton key={i} className="h-24 w-full" />)}
        </div>
      ) : (
        <div className="space-y-4">
          {LANDLORD_DOC_TYPES.map((doc) => (
            <DocumentUpload
              key={doc.id}
              docType={doc.id}
              label={`${t(doc.labelKey)}${doc.required ? ' *' : ''}`}
              description={t(doc.descKey)}
              accept={doc.accept}
              uploaded={docsByType[doc.id]}
              onUpload={handleUpload}
              disabled={status === 'pending'}
            />
          ))}

          <p className="text-xs text-muted">{t('verification.propertyProofNote')}</p>

          {error && <p className="text-sm text-error">{error}</p>}

          {status === 'pending' ? (
            <div className="rounded-xl border border-warning/30 bg-warning/5 p-4 text-center">
              <Clock size={24} className="mx-auto text-warning" />
              <p className="mt-2 font-medium text-primary">{t('verification.reviewPending')}</p>
              <p className="mt-1 text-sm text-muted">{t('verification.reviewPendingDesc')}</p>
            </div>
          ) : (
            <div className="flex flex-wrap gap-3 pt-2">
              <Button
                onClick={handleSubmit}
                disabled={!canSubmit || submitting}
              >
                {submitting
                  ? t('verification.submitting')
                  : status === 'changes_requested' || status === 'rejected'
                    ? t('verification.resubmit')
                    : t('verification.submitForReview')}
              </Button>
            </div>
          )}
        </div>
      )}

      <p className="mt-8 text-center text-sm text-muted">
        <Link to="/" className="text-accent hover:underline">{t('verification.backToHome')}</Link>
      </p>
    </motion.div>
  )
}
