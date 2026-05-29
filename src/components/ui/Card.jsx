import { cn } from '../../lib/utils'

export default function Card({ children, className, hover = false, ...props }) {
  return (
    <div
      className={cn(
        'rounded-xl border border-border bg-surface shadow-sm',
        hover && 'transition-transform duration-200 hover:-translate-y-0.5 hover:shadow-md',
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
}
