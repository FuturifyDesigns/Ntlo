import { createPortal } from 'react-dom'
import { Loader2 } from 'lucide-react'
import { useTranslation } from '../../hooks/useTranslation'

export default function AuthTransitionOverlay({ show, message, hint }) {
  const { t } = useTranslation()

  if (!show || typeof document === 'undefined') return null

  return createPortal(
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-primary/50 backdrop-blur-sm"
      role="status"
      aria-live="assertive"
      aria-busy="true"
    >
      <div className="mx-4 flex max-w-sm flex-col items-center rounded-2xl border border-border bg-surface px-8 py-7 text-center shadow-2xl">
        <Loader2 className="mb-4 h-10 w-10 animate-spin text-accent" aria-hidden="true" />
        <p className="font-display text-lg font-semibold text-primary">
          {message || t('auth.signingInSmooth')}
        </p>
        {hint && <p className="mt-2 text-sm text-muted">{hint}</p>}
      </div>
    </div>,
    document.body
  )
}
