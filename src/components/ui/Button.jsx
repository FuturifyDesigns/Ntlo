import { cn } from '../../lib/utils'

const variants = {
  primary: 'bg-primary text-white hover:bg-primary/90 shadow-sm',
  accent: 'bg-accent text-primary hover:bg-accent/90 shadow-sm',
  outline: 'border border-border bg-surface text-primary hover:bg-background',
  ghost: 'text-primary hover:bg-background',
  whatsapp: 'bg-whatsapp text-white hover:bg-[#20bd5a]',
  danger: 'bg-error text-white hover:bg-error/90',
}

const sizes = {
  sm: 'px-3 py-1.5 text-sm',
  md: 'px-5 py-2.5 text-sm',
  lg: 'px-6 py-3 text-base',
}

export default function Button({
  children,
  variant = 'primary',
  size = 'md',
  className,
  as: Component = 'button',
  ...props
}) {
  return (
    <Component
      className={cn(
        'inline-flex items-center justify-center gap-2 rounded-lg font-semibold transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed',
        variants[variant],
        sizes[size],
        className
      )}
      {...props}
    >
      {children}
    </Component>
  )
}
