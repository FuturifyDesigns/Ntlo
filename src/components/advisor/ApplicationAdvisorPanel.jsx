import { useMemo } from 'react'
import { Sparkles, ThumbsUp, AlertTriangle, Lightbulb } from 'lucide-react'
import { analyzeApplication } from '../../lib/applicationAdvisor'
import { useTranslation } from '../../hooks/useTranslation'

function InsightList({ items, icon: Icon, variant }) {
  const { t } = useTranslation()
  if (!items.length) return null
  const colors = {
    pro: 'text-success',
    con: 'text-error',
    tip: 'text-accent',
  }
  return (
    <ul className="space-y-1.5">
      {items.map((item, i) => (
        <li key={i} className={`flex gap-2 text-xs ${colors[variant]}`}>
          <Icon size={14} className="mt-0.5 shrink-0" />
          <span>{t(item.key, item.meta || {})}</span>
        </li>
      ))}
    </ul>
  )
}

export default function ApplicationAdvisorPanel({ application }) {
  const { t } = useTranslation()
  const analysis = useMemo(() => analyzeApplication(application), [application])

  if (!analysis) return null

  return (
    <div className="rounded-lg border border-accent/25 bg-accent/5 p-3">
      <div className="mb-2 flex items-center gap-2">
        <Sparkles size={16} className="text-accent" />
        <p className="text-sm font-semibold text-primary">{t('applicationAdvisor.title')}</p>
        <span className="ml-auto rounded-full bg-surface px-2 py-0.5 text-xs font-bold text-primary">
          {analysis.score}/100
        </span>
      </div>
      <p className="mb-3 text-xs text-muted">{t(`applicationAdvisor.label.${analysis.label}`)}</p>
      <div className="grid gap-3 sm:grid-cols-3">
        <div>
          <p className="mb-1 text-sm font-medium text-muted">{t('advisor.pros')}</p>
          <InsightList items={analysis.pros} icon={ThumbsUp} variant="pro" />
        </div>
        <div>
          <p className="mb-1 text-sm font-medium text-muted">{t('advisor.cons')}</p>
          <InsightList items={analysis.cons} icon={AlertTriangle} variant="con" />
        </div>
        <div>
          <p className="mb-1 text-sm font-medium text-muted">{t('advisor.tips')}</p>
          <InsightList items={analysis.tips} icon={Lightbulb} variant="tip" />
        </div>
      </div>
    </div>
  )
}
