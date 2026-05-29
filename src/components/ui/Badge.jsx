import { cn } from '../../lib/utils'

const variants = {
  default: 'bg-background text-primary border border-border',
  accent: 'bg-accent/15 text-accent border border-accent/30',
  success: 'bg-success/10 text-success border border-success/20',
  error: 'bg-error/10 text-error border border-error/20',
  dark: 'bg-primary/80 text-white',
}

export default function Badge({ children, variant = 'default', className }) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold uppercase tracking-wide',
        variants[variant],
        className
      )}
    >
      {children}
    </span>
  )
}
