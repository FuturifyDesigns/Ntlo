import PingIcon from './PingIcon'

const NTLO_ICON = `${import.meta.env.BASE_URL}ntlo-icon.png`

const SIZES = {
  xs: { ping: 'xs', ntlo: 'h-6 w-6', x: 'text-xs' },
  sm: { ping: 'sm', ntlo: 'h-7 w-7 sm:h-8 sm:w-8', x: 'text-sm' },
  md: { ping: 'md', ntlo: 'h-9 w-9 sm:h-10 sm:w-10', x: 'text-base' },
  lg: { ping: 'lg', ntlo: 'h-12 w-12 sm:h-14 sm:w-14 md:h-16 md:w-16', x: 'text-lg sm:text-xl' },
}

export default function PingCollabMark({ size = 'md', className = '', glow = false }) {
  const s = SIZES[size] || SIZES.md

  return (
    <div className={`flex items-center gap-2 sm:gap-3 ${className}`.trim()} aria-label="Ntlo × Ping">
      <img
        src={NTLO_ICON}
        alt="Ntlo"
        className={`shrink-0 rounded-xl object-contain shadow-[0_4px_16px_rgba(0,0,0,0.35)] ${s.ntlo}`}
      />
      <span className={`font-display font-semibold text-white/45 ${s.x}`} aria-hidden>
        ×
      </span>
      <PingIcon size={s.ping} glow={glow} />
    </div>
  )
}
