import { useTranslation } from '../../hooks/useTranslation'
import { STUDENT_GENDERS } from '../../lib/applicationRules'

export default function GenderSelect({ value, onChange, error, required = true }) {
  const { t } = useTranslation()

  return (
    <div>
      <p className="mb-2 text-sm font-medium text-primary">
        {t('auth.gender')}
        {required && <span className="text-error"> *</span>}
      </p>
      <div className="flex gap-2">
        {STUDENT_GENDERS.map(({ value: g, labelKey }) => (
          <button
            key={g}
            type="button"
            onClick={() => onChange(g)}
            className={`flex-1 rounded-lg border px-4 py-2.5 text-sm font-medium transition ${
              value === g
                ? 'border-accent bg-accent/10 text-primary'
                : 'border-border text-muted hover:border-accent/50'
            }`}
          >
            {t(labelKey)}
          </button>
        ))}
      </div>
      {error && <p className="mt-1 text-xs text-error">{error}</p>}
      {!error && (
        <p className="mt-1 text-xs text-muted">{t('auth.genderHint')}</p>
      )}
    </div>
  )
}
