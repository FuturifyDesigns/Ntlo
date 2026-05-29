import { useState } from 'react'
import { Eye, EyeOff } from 'lucide-react'
import { cn } from '../../lib/utils'

export default function PasswordInput({ label, error, hint, required, className, id, ...props }) {
  const [show, setShow] = useState(false)
  const inputId = id || label?.toLowerCase().replace(/\s+/g, '-')

  return (
    <div className="w-full">
      {label && (
        <label htmlFor={inputId} className="mb-1.5 block text-sm font-medium text-primary">
          {label}
          {required && <span className="ml-0.5 text-error" aria-hidden="true">*</span>}
        </label>
      )}
      <div className="relative">
        <input
          id={inputId}
          type={show ? 'text' : 'password'}
          aria-invalid={Boolean(error)}
          aria-describedby={hint || error ? `${inputId}-help` : undefined}
          className={cn(
            'w-full rounded-lg border border-border bg-surface px-4 py-2.5 pr-11 text-sm text-primary placeholder:text-muted outline-none transition-colors focus:border-accent focus:ring-2 focus:ring-accent/20',
            error && 'border-error focus:border-error focus:ring-error/20',
            className
          )}
          {...props}
        />
        <button
          type="button"
          onClick={() => setShow((visible) => !visible)}
          className="absolute right-3 top-1/2 -translate-y-1/2 rounded-md p-1 text-muted transition-colors hover:text-primary"
          aria-label={show ? 'Hide password' : 'Show password'}
          tabIndex={-1}
        >
          {show ? <EyeOff size={18} aria-hidden="true" /> : <Eye size={18} aria-hidden="true" />}
        </button>
      </div>
      {error ? (
        <p id={`${inputId}-help`} className="mt-1 text-xs text-error">{error}</p>
      ) : hint ? (
        <p id={`${inputId}-help`} className="mt-1.5 text-xs text-muted">{hint}</p>
      ) : null}
    </div>
  )
}
