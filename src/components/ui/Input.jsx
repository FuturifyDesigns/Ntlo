import { cn } from '../../lib/utils'

export default function Input({ label, error, className, id, ...props }) {
  const inputId = id || label?.toLowerCase().replace(/\s+/g, '-')
  return (
    <div className="w-full">
      {label && (
        <label htmlFor={inputId} className="mb-1.5 block text-sm font-medium text-primary">
          {label}
        </label>
      )}
      <input
        id={inputId}
        className={cn(
          'w-full rounded-lg border border-border bg-surface px-4 py-2.5 text-sm text-primary placeholder:text-muted outline-none transition-colors focus:border-accent focus:ring-2 focus:ring-accent/20',
          error && 'border-error focus:border-error focus:ring-error/20',
          className
        )}
        {...props}
      />
      {error && <p className="mt-1 text-xs text-error">{error}</p>}
    </div>
  )
}

export function Select({ label, error, className, id, children, ...props }) {
  const selectId = id || label?.toLowerCase().replace(/\s+/g, '-')
  return (
    <div className="w-full">
      {label && (
        <label htmlFor={selectId} className="mb-1.5 block text-sm font-medium text-primary">
          {label}
        </label>
      )}
      <select
        id={selectId}
        className={cn(
          'w-full rounded-lg border border-border bg-surface px-4 py-2.5 text-sm text-primary outline-none transition-colors focus:border-accent focus:ring-2 focus:ring-accent/20',
          error && 'border-error',
          className
        )}
        {...props}
      >
        {children}
      </select>
      {error && <p className="mt-1 text-xs text-error">{error}</p>}
    </div>
  )
}

export function Textarea({ label, error, className, id, ...props }) {
  const textareaId = id || label?.toLowerCase().replace(/\s+/g, '-')
  return (
    <div className="w-full">
      {label && (
        <label htmlFor={textareaId} className="mb-1.5 block text-sm font-medium text-primary">
          {label}
        </label>
      )}
      <textarea
        id={textareaId}
        className={cn(
          'w-full rounded-lg border border-border bg-surface px-4 py-2.5 text-sm text-primary placeholder:text-muted outline-none transition-colors focus:border-accent focus:ring-2 focus:ring-accent/20 min-h-[120px] resize-y',
          error && 'border-error',
          className
        )}
        {...props}
      />
      {error && <p className="mt-1 text-xs text-error">{error}</p>}
    </div>
  )
}
