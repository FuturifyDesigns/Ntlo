import { useTranslation } from '../../hooks/useTranslation'

const ITEMS = [
  'housing.reqOmangPassport',
  'housing.reqRegistration',
  'housing.reqMoveInDate',
  'housing.reqDuration',
  'housing.reqIntro',
]

export default function ApplicationRequirementsList() {
  const { t } = useTranslation()

  return (
    <div className="rounded-lg border border-border bg-background p-3">
      <p className="text-sm font-medium text-primary">{t('housing.applicationRequirementsTitle')}</p>
      <ul className="mt-2 space-y-1.5">
        {ITEMS.map((key) => (
          <li key={key} className="flex gap-2 text-xs text-muted">
            <span className="text-accent">•</span>
            <span>{t(key)}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}
