import { Link } from 'react-router-dom'
import { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Check, X, Sparkles, ThumbsUp, AlertTriangle, Lightbulb, Clock,
  CreditCard, Camera, Home, FileSignature, MapPin, Building2,
  Receipt, Zap, ScrollText, FileText, ScanSearch, Loader2,
  CheckCircle2, XCircle, Info, ChevronDown, MessageSquare, RotateCcw, Clock3, Eye, ShieldAlert, Trash2, ExternalLink,
} from 'lucide-react'
import { useTranslation } from '../../hooks/useTranslation'
import { useNow } from '../../hooks/useNow'
import { getScoreColor } from '../../lib/aiAdvisor'
import { isImagePath, isPdfPath, groupDocVersions, combineReadiness, ACCEPT_THRESHOLD } from '../../lib/adminAdvisor'
import { relativeTimeParts } from '../../lib/utils'
import { getSignedDocUrl } from '../../lib/verificationStorage'
import { recognizeImage } from '../../lib/ocr'
import { analyzeDocCompliance, compareOcr, VERDICT_STYLE } from '../../lib/docCompliance'
import RequestChangeModal from './RequestChangeModal'
import Button from '../ui/Button'

const DOC_ICONS = {
  national_id: CreditCard,
  selfie_with_id: Camera,
  proof_of_ownership: Home,
  proof_of_authority: FileSignature,
  proof_of_address: MapPin,
  reib_registration: Building2,
  property_rates_receipt: Receipt,
  utility_bill_property: Zap,
  title_deed_excerpt: ScrollText,
}

const FLAG_ICON = { pro: ThumbsUp, con: AlertTriangle, tip: Lightbulb }
const FLAG_COLOR = { pro: 'text-success', con: 'text-amber-600', tip: 'text-muted' }

const STATUS_STYLE = {
  readyToApprove: 'bg-success/10 text-success ring-success/20',
  listingHasProof: 'bg-success/10 text-success ring-success/20',
  needsProof: 'bg-amber-500/10 text-amber-700 ring-amber-500/20',
  listingNoProof: 'bg-amber-500/10 text-amber-700 ring-amber-500/20',
  needsReview: 'bg-amber-500/10 text-amber-700 ring-amber-500/20',
  incomplete: 'bg-error/10 text-error ring-error/20',
  nonCompliant: 'bg-error/10 text-error ring-error/20',
  awaitingResubmission: 'bg-primary/10 text-primary ring-primary/20',
}

const DOC_STATUS = {
  approved: { color: 'text-success', dot: 'bg-success' },
  rejected: { color: 'text-error', dot: 'bg-error' },
  changes_requested: { color: 'text-amber-600', dot: 'bg-amber-500' },
  pending: { color: 'text-muted', dot: 'bg-amber-500' },
}

const CHECK_ICON = { pass: CheckCircle2, warn: AlertTriangle, fail: XCircle, manual: Info }
const CHECK_COLOR = { pass: 'text-success', warn: 'text-amber-600', fail: 'text-error', manual: 'text-muted' }

function initials(name = '?') {
  return name.trim().split(/\s+/).slice(0, 2).map((w) => w[0]?.toUpperCase()).join('') || '?'
}

export default function VerificationCard({
  subject, analysis, kind, onOpenDocs, onApprove, onReject, onRequestChanges, onMarkOk, onUnmarkOk, onDelete,
}) {
  const { t } = useTranslation()
  useNow()
  const allDocs = useMemo(() => subject.docs || [], [subject.docs])
  const grouped = useMemo(() => groupDocVersions(allDocs), [allDocs])
  const currentDocs = grouped.current
  const name = kind === 'landlord' ? subject.full_name : subject.title
  const sub = kind === 'landlord'
    ? (subject.phone || '—')
    : `${subject.city} · ${subject.landlord?.full_name || '—'}`

  const [results, setResults] = useState({})
  const [scanning, setScanning] = useState(false)
  const [progress, setProgress] = useState(0)
  const [scanError, setScanError] = useState('')
  const [showReport, setShowReport] = useState(true)
  const [changeDoc, setChangeDoc] = useState(null)
  const [confirmApprove, setConfirmApprove] = useState(false)

  const scanned = Object.keys(results).length > 0
  const readiness = combineReadiness(analysis, currentDocs, results)

  const requireAllOk = kind === 'landlord'
  const okCount = currentDocs.filter((d) => d.status === 'approved').length
  const allMarkedOk = currentDocs.length > 0 && okCount === currentDocs.length
  const approveBlocked = requireAllOk && !allMarkedOk

  function handleApproveClick() {
    if (approveBlocked) return
    if (kind === 'landlord' && readiness.score < ACCEPT_THRESHOLD) {
      setConfirmApprove(true)
    } else {
      onApprove()
    }
  }

  const time = relativeTimeParts(subject.created_at)
  const timeLabel = time.unit === 'now' ? t('admin.justNow') : t(`admin.${time.unit}Ago`, { count: time.count })

  async function runScan() {
    if (scanning || allDocs.length === 0) return
    setScanning(true)
    setScanError('')
    setProgress(0)
    const imageDocs = allDocs.filter((d) => isImagePath(d.storage_path, d.file_name))
    const next = {}
    allDocs.forEach((d) => {
      if (isPdfPath(d.storage_path, d.file_name)) next[d.id] = { verdict: 'pdf', checks: [], score: null }
    })
    setResults({ ...next })
    try {
      for (let i = 0; i < imageDocs.length; i++) {
        const d = imageDocs[i]
        const url = await getSignedDocUrl(d.storage_path)
        const { text, confidence } = await recognizeImage(url, (p) =>
          setProgress((i + p) / imageDocs.length)
        )
        next[d.id] = { ...analyzeDocCompliance(d.doc_type, text, confidence), _text: text }
        setResults({ ...next })
      }
      setProgress(1)
    } catch (err) {
      setScanError(err.message || t('admin.compliance.scanError'))
    } finally {
      setScanning(false)
    }
  }

  function buildSuggestion(doc) {
    const lines = [t('admin.compliance.suggestIntro', { doc: t(`admin.docType.${doc.doc_type}`) })]
    const r = results[doc.id]
    const issues = (r?.checks || []).filter((c) => c.status === 'warn' || c.status === 'fail')
    if (issues.length) {
      lines.push('')
      issues.forEach((c) => lines.push(`• ${t(`admin.compliance.check.${c.key}`, c.meta || {})}`))
    }
    const tip = t(`admin.compliance.suggest.${doc.doc_type}`)
    if (tip && !tip.includes('admin.compliance.suggest.')) {
      lines.push('')
      lines.push(tip)
    }
    return lines.join('\n')
  }

  /** request | waiting | resubmitted */
  function changeState(doc) {
    if (grouped.resubmittedTypes.has(doc.doc_type)) return 'resubmitted'
    if (doc.status === 'changes_requested') return 'waiting'
    return 'request'
  }

  function MarkOkButton({ doc, compact }) {
    if (!onMarkOk || doc.status === 'changes_requested') return null
    const isOk = doc.status === 'approved'
    if (isOk) {
      return (
        <button
          type="button"
          onClick={() => onUnmarkOk?.(doc.id)}
          title={t('admin.markOkUndo')}
          className={
            compact
              ? 'flex h-7 items-center gap-1 rounded-lg border border-success/40 bg-success/10 px-2 text-[10px] font-semibold text-success'
              : 'inline-flex shrink-0 items-center gap-1 rounded-md border border-success/40 bg-success/10 px-2 py-1 text-[11px] font-semibold text-success'
          }
        >
          <CheckCircle2 size={compact ? 12 : 11} />
          {t('admin.markedOk')}
        </button>
      )
    }
    return (
      <button
        type="button"
        onClick={() => onMarkOk(doc.id)}
        title={t('admin.markOk')}
        className={
          compact
            ? 'flex h-7 items-center gap-1 rounded-lg border border-border px-2 text-[10px] font-semibold text-muted hover:border-success/40 hover:text-success'
            : 'inline-flex shrink-0 items-center gap-1 rounded-md border border-border px-2 py-1 text-[11px] font-semibold text-muted hover:border-success/40 hover:text-success'
        }
      >
        <Check size={compact ? 12 : 11} />
        {t('admin.markOk')}
      </button>
    )
  }

  function ChangeAction({ doc, index, compact }) {
    if (!onRequestChanges) return null
    const state = changeState(doc)
    if (state === 'waiting') {
      return compact ? (
        <span
          title={t('admin.compliance.waitingResubmission')}
          className="flex h-7 items-center gap-1 rounded-lg border border-amber-500/40 bg-amber-500/5 px-2 text-[10px] font-semibold text-amber-600"
        >
          <Clock3 size={12} />
        </span>
      ) : (
        <span className="inline-flex shrink-0 items-center gap-1 rounded-md border border-amber-500/40 bg-amber-500/5 px-2 py-1 text-[11px] font-semibold text-amber-600">
          <Clock3 size={11} />
          {t('admin.compliance.waitingResubmission')}
        </span>
      )
    }
    if (state === 'resubmitted') {
      const viewBtn = (
        <button
          type="button"
          onClick={() => onOpenDocs([doc], 0, name)}
          title={t('admin.compliance.viewResubmission')}
          className={
            compact
              ? 'flex h-7 items-center gap-1 rounded-lg border border-primary/30 bg-primary/5 px-2 text-[10px] font-semibold text-primary'
              : 'inline-flex shrink-0 items-center gap-1 rounded-md border border-primary/30 bg-primary/5 px-2 py-1 text-[11px] font-semibold text-primary'
          }
        >
          <Eye size={compact ? 12 : 11} />
          {!compact && t('admin.compliance.viewResubmission')}
        </button>
      )
      if (compact) return viewBtn
      return (
        <div className="flex shrink-0 items-center gap-1.5">
          {viewBtn}
          <button
            type="button"
            onClick={() => setChangeDoc(doc)}
            className="inline-flex items-center gap-1 rounded-md border border-border px-2 py-1 text-[11px] font-semibold text-muted hover:border-amber-500/40 hover:text-amber-600"
          >
            <MessageSquare size={11} />
            {t('admin.compliance.requestChanges')}
          </button>
        </div>
      )
    }
    return (
      <button
        type="button"
        onClick={() => setChangeDoc(doc)}
        title={t('admin.compliance.requestChanges')}
        className={
          compact
            ? 'flex h-7 w-7 items-center justify-center rounded-lg border border-border text-muted hover:border-amber-500/40 hover:text-amber-600'
            : 'inline-flex shrink-0 items-center gap-1 rounded-md border border-border px-2 py-1 text-[11px] font-semibold text-muted hover:border-amber-500/40 hover:text-amber-600'
        }
      >
        <MessageSquare size={compact ? 13 : 11} />
        {!compact && t('admin.compliance.requestChanges')}
      </button>
    )
  }

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="overflow-hidden rounded-2xl border border-border bg-surface shadow-sm"
    >
      <div className="flex flex-wrap items-start justify-between gap-4 p-4 sm:p-5">
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-primary/10 font-display text-sm font-bold text-primary">
            {initials(name)}
          </div>
          <div className="min-w-0">
            <p className="truncate font-semibold text-primary">{name}</p>
            <p className="truncate text-sm text-muted">{sub}</p>
          </div>
        </div>

        <div className="flex flex-col items-end gap-1.5">
          <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ring-1 ${STATUS_STYLE[readiness.status] || STATUS_STYLE.incomplete}`}>
            <Sparkles size={12} />
            {t(`admin.adv.status.${readiness.status}`)}
            {readiness.scanned && <span className="opacity-70">· {t('admin.compliance.scannedTag')}</span>}
          </span>
          <span className="flex items-center gap-1 text-[11px] text-muted">
            <Clock size={11} />
            {timeLabel}
            <span className="text-border">·</span>
            <span className={`font-semibold ${getScoreColor(readiness.score)}`}>
              {readiness.score} {t('admin.adv.readinessLabel')}
            </span>
          </span>
        </div>
      </div>

      {/* AI recommendation */}
      <div className="mx-4 mb-4 rounded-xl border border-accent/20 bg-accent/5 p-3 sm:mx-5">
        <p className="mb-1 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-accent">
          <Sparkles size={12} />
          {t('admin.adv.recommendedAction')}
        </p>
        <p className="text-sm leading-relaxed text-primary">{t(`admin.adv.recommend.${analysis.recommendKey}`)}</p>
        {analysis.flags.length > 0 && (
          <ul className="mt-2.5 space-y-1.5">
            {analysis.flags.map((f, i) => {
              const Icon = FLAG_ICON[f.severity] || Lightbulb
              return (
                <li key={i} className={`flex items-start gap-1.5 text-xs ${FLAG_COLOR[f.severity]}`}>
                  <Icon size={13} className="mt-0.5 shrink-0" />
                  <span>{t(`admin.adv.flag.${f.key}`, f.meta || {})}</span>
                </li>
              )
            })}
          </ul>
        )}
      </div>

      {/* Documents */}
      <div className="px-4 pb-4 sm:px-5">
        <div className="mb-2 flex items-center justify-between gap-2">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted">
            {t('admin.documents')} {currentDocs.length > 0 && `(${currentDocs.length})`}
          </p>
          {allDocs.length > 0 && (
            <button
              type="button"
              onClick={runScan}
              disabled={scanning}
              className="inline-flex items-center gap-1.5 rounded-lg border border-accent/30 bg-accent/5 px-2.5 py-1 text-xs font-semibold text-accent transition-colors hover:bg-accent/10 disabled:opacity-60"
            >
              {scanning ? <Loader2 size={13} className="animate-spin" /> : <ScanSearch size={13} />}
              {scanning
                ? t('admin.compliance.scanning', { pct: Math.round(progress * 100) })
                : scanned ? t('admin.compliance.rescan') : t('admin.compliance.run')}
            </button>
          )}
        </div>

        {currentDocs.length === 0 ? (
          <p className="rounded-lg border border-dashed border-border px-3 py-4 text-center text-sm text-muted">
            {t('admin.noDocuments')}
          </p>
        ) : (
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            {currentDocs.map((doc, i) => {
              const Icon = DOC_ICONS[doc.doc_type] || FileText
              const result = results[doc.id]
              const vStyle = result && VERDICT_STYLE[result.verdict]
              const isResubmitted = grouped.resubmittedTypes.has(doc.doc_type)
              const ds = DOC_STATUS[doc.status] || DOC_STATUS.pending
              return (
                <div
                  key={doc.id}
                  className="flex items-center gap-3 rounded-xl border border-border bg-background px-3 py-2.5"
                >
                  <button
                    type="button"
                    onClick={() => onOpenDocs(currentDocs, i, name)}
                    className="group flex min-w-0 flex-1 items-center gap-3 text-left"
                  >
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-surface ring-1 ring-border group-hover:ring-accent/30">
                      <Icon size={16} className="text-accent" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="flex items-center gap-1.5">
                        <span className="truncate text-sm font-medium text-primary">
                          {t(`admin.docType.${doc.doc_type}`)}
                        </span>
                        {isResubmitted && (
                          <span className="inline-flex shrink-0 items-center gap-0.5 rounded-full bg-primary/10 px-1.5 py-0.5 text-[9px] font-bold uppercase text-primary">
                            <RotateCcw size={9} />
                            {t('admin.compliance.resubmittedTag')}
                          </span>
                        )}
                      </span>
                      <span className="block truncate text-xs text-muted">{doc.file_name}</span>
                    </span>
                    {result ? (
                      <span className={`inline-flex shrink-0 items-center gap-1 rounded-full px-1.5 py-0.5 text-[10px] font-semibold ${vStyle?.color}`}>
                        <span className={`h-1.5 w-1.5 rounded-full ${vStyle?.dot}`} />
                        {result.verdict === 'pdf'
                          ? t('admin.compliance.verdict.pdf')
                          : t(`admin.compliance.verdict.${result.verdict}`)}
                      </span>
                    ) : doc.status !== 'pending' ? (
                      <span className={`inline-flex shrink-0 items-center gap-1 text-[10px] font-semibold ${ds.color}`}>
                        <span className={`h-1.5 w-1.5 rounded-full ${ds.dot}`} />
                        {t(`admin.docState.${doc.status}`)}
                      </span>
                    ) : (
                      <span className={`h-2 w-2 shrink-0 rounded-full ${ds.dot}`} title={doc.status} />
                    )}
                  </button>
                  <div className="flex shrink-0 items-center gap-1">
                    <MarkOkButton doc={doc} compact />
                    <ChangeAction doc={doc} index={i} compact />
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {scanError && <p className="mt-2 text-xs text-error">{t('admin.compliance.scanError')}</p>}

        {/* Compliance report */}
        <AnimatePresence initial={false}>
          {scanned && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mt-3 overflow-hidden rounded-xl border border-border bg-background"
            >
              <button
                type="button"
                onClick={() => setShowReport((s) => !s)}
                className="flex w-full items-center justify-between gap-2 px-3 py-2.5 text-left"
              >
                <span className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-primary">
                  <ScanSearch size={14} className="text-accent" />
                  {t('admin.compliance.report')}
                </span>
                <ChevronDown size={16} className={`text-muted transition-transform ${showReport ? 'rotate-180' : ''}`} />
              </button>

              {showReport && (
                <div className="space-y-3 border-t border-border px-3 py-3">
                  {currentDocs.map((doc, docIndex) => {
                    const result = results[doc.id]
                    if (!result) return null
                    const vStyle = VERDICT_STYLE[result.verdict] || VERDICT_STYLE.manual
                    // Resubmission comparison
                    const prev = grouped.previousByType[doc.doc_type]
                    const prevResult = prev && results[prev.id]
                    let compare = null
                    if (prevResult?._text && result._text) {
                      compare = compareOcr(prevResult._text, result._text)
                    }
                    return (
                      <div key={doc.id} className="rounded-lg border border-border bg-surface p-3">
                        <div className="mb-1.5 flex items-center justify-between gap-2">
                          <p className="text-sm font-semibold text-primary">{t(`admin.docType.${doc.doc_type}`)}</p>
                          <span className={`flex items-center gap-1 text-xs font-semibold ${vStyle.color}`}>
                            <span className={`h-1.5 w-1.5 rounded-full ${vStyle.dot}`} />
                            {result.verdict === 'pdf'
                              ? t('admin.compliance.verdict.pdf')
                              : t(`admin.compliance.verdict.${result.verdict}`)}
                            {typeof result.score === 'number' && ` · ${result.score}`}
                          </span>
                        </div>

                        {compare && (
                          <p className={`mb-1.5 flex items-center gap-1.5 text-xs font-medium ${compare.changed ? 'text-success' : 'text-amber-600'}`}>
                            <RotateCcw size={12} />
                            {compare.changed
                              ? t('admin.compliance.changedVsPrev', { pct: Math.round((1 - compare.similarity) * 100) })
                              : t('admin.compliance.similarToPrev')}
                          </p>
                        )}

                        {result.verdict === 'pdf' ? (
                          <p className="text-xs text-muted">{t('admin.compliance.pdfNote')}</p>
                        ) : (
                          <ul className="space-y-1">
                            {result.checks.map((c, i) => {
                              const Icon = CHECK_ICON[c.status] || Info
                              return (
                                <li key={i} className={`flex items-start gap-1.5 text-xs ${CHECK_COLOR[c.status]}`}>
                                  <Icon size={13} className="mt-0.5 shrink-0" />
                                  <span>{t(`admin.compliance.check.${c.key}`, c.meta || {})}</span>
                                </li>
                              )
                            })}
                          </ul>
                        )}
                        <div className="mt-2 flex items-center justify-between gap-2 border-t border-border pt-1.5">
                          <p className="text-[11px] italic text-muted">
                            {t(`admin.compliance.reg.${result.regulationKey || doc.doc_type}`)}
                          </p>
                          <div className="flex shrink-0 items-center gap-1.5">
                            <MarkOkButton doc={doc} />
                            <ChangeAction doc={doc} index={docIndex} />
                          </div>
                        </div>
                      </div>
                    )
                  })}
                  <p className="text-[11px] text-muted">{t('admin.compliance.disclaimer')}</p>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Approve gate + low-score warning */}
      <AnimatePresence initial={false}>
        {confirmApprove && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden border-t border-amber-500/30 bg-amber-500/5"
          >
            <div className="flex items-start gap-2 px-4 py-3 sm:px-5">
              <ShieldAlert size={18} className="mt-0.5 shrink-0 text-amber-600" />
              <div className="flex-1">
                <p className="text-sm font-semibold text-amber-700">
                  {t('admin.adv.lowScoreTitle', { score: readiness.score, threshold: ACCEPT_THRESHOLD })}
                </p>
                <p className="mt-0.5 text-xs text-amber-700/90">{t('admin.adv.lowScoreDesc')}</p>
                <div className="mt-2 flex gap-2">
                  <Button size="sm" variant="danger" onClick={() => { setConfirmApprove(false); onApprove() }}>
                    {t('admin.adv.approveAnyway')}
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => setConfirmApprove(false)}>
                    {t('admin.cancel')}
                  </Button>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Actions */}
      <div className="border-t border-border bg-background/50 px-4 py-3 sm:px-5">
        {requireAllOk && currentDocs.length > 0 && (
          <p className={`mb-2 flex items-center gap-1.5 text-xs ${allMarkedOk ? 'text-success' : 'text-muted'}`}>
            {allMarkedOk ? <CheckCircle2 size={13} /> : <Info size={13} />}
            {t('admin.adv.markProgress', { ok: okCount, total: currentDocs.length })}
          </p>
        )}
        <div className="flex flex-wrap gap-2">
          {kind === 'listing' && (
            <Button
              size="sm"
              variant="outline"
              as={Link}
              to={`/listings/${subject.id}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 sm:flex-none"
            >
              <ExternalLink size={14} />
              {t('admin.viewListing')}
            </Button>
          )}
          <Button
            size="sm"
            className="flex-1 sm:flex-none"
            onClick={handleApproveClick}
            disabled={approveBlocked}
          >
            <Check size={14} />
            {kind === 'listing' ? t('admin.verifyListing') : t('admin.approve')}
          </Button>
          <Button size="sm" variant="danger" className="flex-1 sm:flex-none" onClick={onReject}>
            <X size={14} />
            {t('admin.reject')}
          </Button>
          {kind === 'listing' && onDelete && (
            <Button size="sm" variant="outline" className="flex-1 sm:flex-none" onClick={onDelete}>
              <Trash2 size={14} />
              {t('admin.deleteListing')}
            </Button>
          )}
        </div>
      </div>

      {changeDoc && (
        <RequestChangeModal
          docLabel={t(`admin.docType.${changeDoc.doc_type}`)}
          suggestion={buildSuggestion(changeDoc)}
          onSend={(note) => onRequestChanges(changeDoc.id, note)}
          onClose={() => setChangeDoc(null)}
        />
      )}
    </motion.div>
  )
}
