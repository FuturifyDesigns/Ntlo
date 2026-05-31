import { useMemo } from 'react'
import { Sparkles, ThumbsUp, AlertTriangle, Lightbulb } from 'lucide-react'
import { getListingAdvisorResult, getScoreColor, getScoreRingColor } from '../../lib/aiAdvisor'
import { useTranslation } from '../../hooks/useTranslation'
import Card from '../ui/Card'

function ScoreRing({ score }) {
  const radius = 36
  const circumference = 2 * Math.PI * radius
  const offset = circumference - (score / 100) * circumference

  return (
    <div className="relative mx-auto h-24 w-24">
      <svg className="h-24 w-24 -rotate-90" viewBox="0 0 96 96">
        <circle cx="48" cy="48" r={radius} fill="none" strokeWidth="8" className="stroke-border" />
        <circle
          cx="48"
          cy="48"
          r={radius}
          fill="none"
          strokeWidth="8"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className={getScoreRingColor(score)}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className={`font-display text-2xl font-bold ${getScoreColor(score)}`}>{score}</span>
        <span className="text-[10px] uppercase tracking-wide text-muted">/ 100</span>
      </div>
    </div>
  )
}

function InsightList({ items, icon: Icon, variant }) {
  const { t } = useTranslation()
  if (!items.length) return null

  const colors = {
    pro: 'text-success',
    con: 'text-amber-600',
    tip: 'text-muted',
  }

  return (
    <ul className="space-y-2">
      {items.map((item, i) => (
        <li key={i} className={`flex gap-2 text-sm ${colors[variant]}`}>
          <Icon size={16} className="mt-0.5 shrink-0" />
          <span>{t(`advisor.${item.key}`, item.meta || {})}</span>
        </li>
      ))}
    </ul>
  )
}

export default function ListingAdvisorPanel({ listing, studentUniversityId }) {
  const { t } = useTranslation()

  const context = useMemo(
    () => ({ studentUniversityId }),
    [studentUniversityId]
  )

  const { analysis, insightText } = useMemo(
    () => (listing ? getListingAdvisorResult(listing, context, t) : { analysis: null, insightText: '' }),
    [listing, context, t]
  )

  if (!listing || !analysis) return null

  return (
    <Card className="space-y-4 p-5">
      <div className="flex items-center gap-2">
        <Sparkles size={18} className="text-accent" />
        <h3 className="font-display font-semibold text-primary">{t('advisor.title')}</h3>
      </div>

      <p className="text-xs text-muted">{t('advisor.subtitle')}</p>

      <ScoreRing score={analysis.overall} />
      <p className="text-center text-sm font-medium text-primary">
        {t(`advisor.label.${analysis.label}`)}
      </p>

      {insightText && (
        <div className="rounded-lg border border-accent/20 bg-accent/5 p-3">
          <p className="mb-1 text-sm font-medium text-accent">
            {t('advisor.insightSummary')}
          </p>
          <p className="text-sm leading-relaxed text-primary">{insightText}</p>
        </div>
      )}

      <div className="grid grid-cols-2 gap-2 text-xs">
        {Object.entries(analysis.scores).map(([key, value]) => (
          <div key={key} className="rounded-lg bg-background px-2 py-1.5">
            <span className="text-muted">{t(`advisor.score.${key}`)}</span>
            <span className={`float-right font-semibold ${getScoreColor(value)}`}>{value}</span>
          </div>
        ))}
      </div>

      {analysis.pros.length > 0 && (
        <div>
          <p className="mb-2 text-sm font-medium text-muted">{t('advisor.pros')}</p>
          <InsightList items={analysis.pros} icon={ThumbsUp} variant="pro" />
        </div>
      )}

      {analysis.cons.length > 0 && (
        <div>
          <p className="mb-2 text-sm font-medium text-muted">{t('advisor.cons')}</p>
          <InsightList items={analysis.cons} icon={AlertTriangle} variant="con" />
        </div>
      )}

      {analysis.tips.length > 0 && (
        <div>
          <p className="mb-2 text-sm font-medium text-muted">{t('advisor.tips')}</p>
          <InsightList items={analysis.tips} icon={Lightbulb} variant="tip" />
        </div>
      )}
    </Card>
  )
}
