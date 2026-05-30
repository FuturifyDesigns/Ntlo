import { motion } from 'framer-motion'
import {
  Check, X, Sparkles, ThumbsUp, AlertTriangle, Lightbulb, Clock,
  CreditCard, Camera, Home, FileSignature, MapPin, Building2,
  Receipt, Zap, ScrollText, FileText,
} from 'lucide-react'
import { useTranslation } from '../../hooks/useTranslation'
import { getScoreColor } from '../../lib/aiAdvisor'
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
  incomplete: 'bg-error/10 text-error ring-error/20',
}

const DOC_STATUS_DOT = { approved: 'bg-success', rejected: 'bg-error', pending: 'bg-amber-500' }

function initials(name = '?') {
  return name.trim().split(/\s+/).slice(0, 2).map((w) => w[0]?.toUpperCase()).join('') || '?'
}

export default function VerificationCard({ subject, analysis, kind, onOpenDocs, onApprove, onReject }) {
  const { t } = useTranslation()
  const docs = subject.docs || []
  const name = kind === 'landlord' ? subject.full_name : subject.title
  const sub = kind === 'landlord'
    ? (subject.phone || '—')
    : `${subject.city} · ${subject.landlord?.full_name || '—'}`

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
          <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ring-1 ${STATUS_STYLE[analysis.status]}`}>
            <Sparkles size={12} />
            {t(`admin.adv.status.${analysis.status}`)}
          </span>
          <span className="flex items-center gap-1 text-[11px] text-muted">
            <Clock size={11} />
            {analysis.waitingDays === 0
              ? t('admin.justNow')
              : t('admin.daysAgo', { count: analysis.waitingDays })}
            <span className="text-border">·</span>
            <span className={`font-semibold ${getScoreColor(analysis.score)}`}>
              {analysis.score} {t('admin.adv.readinessLabel')}
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
        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted">
          {t('admin.documents')} {docs.length > 0 && `(${docs.length})`}
        </p>
        {docs.length === 0 ? (
          <p className="rounded-lg border border-dashed border-border px-3 py-4 text-center text-sm text-muted">
            {t('admin.noDocuments')}
          </p>
        ) : (
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            {docs.map((doc, i) => {
              const Icon = DOC_ICONS[doc.doc_type] || FileText
              return (
                <button
                  key={doc.id}
                  type="button"
                  onClick={() => onOpenDocs(docs, i, name)}
                  className="group flex items-center gap-3 rounded-xl border border-border bg-background px-3 py-2.5 text-left transition-colors hover:border-accent/40 hover:bg-accent/5"
                >
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-surface ring-1 ring-border group-hover:ring-accent/30">
                    <Icon size={16} className="text-accent" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-medium text-primary">
                      {t(`admin.docType.${doc.doc_type}`)}
                    </span>
                    <span className="block truncate text-xs text-muted">{doc.file_name}</span>
                  </span>
                  <span className={`h-2 w-2 shrink-0 rounded-full ${DOC_STATUS_DOT[doc.status] || 'bg-amber-500'}`} title={doc.status} />
                </button>
              )
            })}
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex gap-2 border-t border-border bg-background/50 px-4 py-3 sm:px-5">
        <Button size="sm" className="flex-1 sm:flex-none" onClick={onApprove}>
          <Check size={14} />
          {kind === 'listing' ? t('admin.verifyListing') : t('admin.approve')}
        </Button>
        <Button size="sm" variant="danger" className="flex-1 sm:flex-none" onClick={onReject}>
          <X size={14} />
          {t('admin.reject')}
        </Button>
      </div>
    </motion.div>
  )
}
