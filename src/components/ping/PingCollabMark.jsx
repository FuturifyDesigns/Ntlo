import PingIcon from './PingIcon'

const NTLO_ICON = `${import.meta.env.BASE_URL}ntlo-icon.png`

const SIZES = {
  sm: { ping: 'sm', ntlo: 'h-8 w-8', x: 'text-sm' },
  md: { ping: 'md', ntlo: 'h-10 w-10', x: 'text-base' },
  lg: { ping: 'lg', ntlo: 'h-14 w-14 sm:h-16 sm:w-16', x: 'text-xl' },
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
