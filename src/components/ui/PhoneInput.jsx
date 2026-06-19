import { useId } from 'react'
import { cn } from '../../lib/utils'
import {
  PHONE_COUNTRIES,
  formatNationalPlaceholder,
  splitStoredPhone,
} from '../../lib/phoneNumbers'

export default function PhoneInput({
  label,
  countryCode,
  national,
  onCountryCodeChange,
  onNationalChange,
  onBlur,
  error,
  hint,
  required,
  disabled,
  className,
  id,
}) {
  const autoId = useId()
  const inputId = id || `phone-${autoId}`
  const selected = PHONE_COUNTRIES.find((c) => c.code === countryCode) || PHONE_COUNTRIES[0]

  return (
    <div className={cn('w-full', className)}>
      {label && (
        <label htmlFor={inputId} className="mb-1.5 block text-sm font-medium text-primary">
          {label}
          {required && <span className="ml-0.5 text-error" aria-hidden="true">*</span>}
        </label>
      )}
      <div className="flex gap-2">
        <div className="shrink-0">
          <label htmlFor={`${inputId}-country`} className="sr-only">Country code</label>
          <select
            id={`${inputId}-country`}
            value={selected.code}
            onChange={(e) => onCountryCodeChange?.(e.target.value)}
            disabled={disabled}
            className={cn(
              'h-[42px] rounded-lg border border-border bg-surface px-2 py-2.5 text-sm text-primary outline-none transition-colors focus:border-accent focus:ring-2 focus:ring-accent/20',
              error && 'border-error',
            )}
          >
            {PHONE_COUNTRIES.map((country) => (
              <option key={country.code} value={country.code}>
                {country.flag} +{country.code}
              </option>
            ))}
          </select>
        </div>
        <input
          id={inputId}
          type="tel"
          inputMode="numeric"
          autoComplete="tel-national"
          placeholder={formatNationalPlaceholder(selected.code)}
          value={national}
          onChange={(e) => onNationalChange?.(e.target.value)}
          onBlur={onBlur}
          disabled={disabled}
          aria-invalid={Boolean(error)}
          aria-describedby={hint || error ? `${inputId}-help` : undefined}
          className={cn(
            'min-w-0 flex-1 rounded-lg border border-border bg-surface px-4 py-2.5 text-sm text-primary placeholder:text-muted outline-none transition-colors focus:border-accent focus:ring-2 focus:ring-accent/20',
            error && 'border-error focus:border-error focus:ring-error/20',
          )}
        />
      </div>
      {error ? (
        <p id={`${inputId}-help`} className="mt-1 text-xs text-error">{error}</p>
      ) : hint ? (
        <p id={`${inputId}-help`} className="mt-1.5 text-xs text-muted">{hint}</p>
      ) : null}
    </div>
  )
}

/** Hook-friendly state from a stored phone string. */
export function phoneFieldFromStored(stored) {
  return splitStoredPhone(stored)
}
