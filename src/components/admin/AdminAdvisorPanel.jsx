import { Sparkles, ArrowDownWideNarrow, Clock, CheckCircle2, AlertTriangle } from 'lucide-react'
import { useTranslation } from '../../hooks/useTranslation'

export default function AdminAdvisorPanel({ summary, sortMode, onSortChange }) {
  const { t } = useTranslation()
  const { total, ready, attention } = summary

  return (
    <div className="overflow-hidden rounded-2xl border border-accent/30 bg-gradient-to-br from-accent/10 via-surface to-surface">
      <div className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-accent/15 ring-1 ring-accent/30">
            <Sparkles size={20} className="text-accent" />
          </div>
          <div>
            <h3 className="font-display font-semibold text-primary">{t('admin.adv.title')}</h3>
            <p className="mt-0.5 max-w-md text-xs leading-relaxed text-muted">{t('admin.adv.subtitle')}</p>
          </div>
        </div>

        {total > 0 && (
          <div className="flex shrink-0 rounded-xl border border-border bg-background p-1">
            <button
              type="button"
              onClick={() => onSortChange('smart')}
              className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${
                sortMode === 'smart' ? 'bg-primary text-white shadow-sm' : 'text-muted hover:text-primary'
              }`}
            >
              <ArrowDownWideNarrow size={14} />
              {t('admin.adv.smartSort')}
            </button>
            <button
              type="button"
              onClick={() => onSortChange('newest')}
              className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${
                sortMode === 'newest' ? 'bg-primary text-white shadow-sm' : 'text-muted hover:text-primary'
              }`}
            >
              <Clock size={14} />
              {t('admin.adv.newestSort')}
            </button>
          </div>
        )}
      </div>

      {total === 0 ? (
        <p className="border-t border-border/60 px-5 py-3 text-sm text-muted">{t('admin.adv.queueClear')}</p>
      ) : (
        <div className="grid grid-cols-3 divide-x divide-border/60 border-t border-border/60">
          <Stat icon={Clock} value={total} text={t('admin.pending')} tone="muted" />
          <Stat icon={CheckCircle2} value={ready} text={t('admin.adv.status.readyToApprove')} tone="success" />
          <Stat icon={AlertTriangle} value={attention} text={t('admin.adv.status.incomplete')} tone="warning" />
        </div>
      )}
    </div>
  )
}

function Stat({ icon: Icon, value, text, tone }) {
  const tones = {
    muted: 'text-muted',
    success: 'text-success',
    warning: 'text-amber-600',
  }
  return (
    <div className="flex items-center gap-2.5 px-4 py-3">
      <Icon size={18} className={tones[tone]} />
      <div className="min-w-0">
        <p className="font-display text-lg font-bold leading-none text-primary">{value}</p>
        <p className="mt-1 truncate text-[11px] uppercase tracking-wide text-muted">{text}</p>
      </div>
    </div>
  )
}
