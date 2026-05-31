const ICON = `${import.meta.env.BASE_URL}ping/app-icon.png?v=5`

export { ICON as PING_ICON }

const SIZES = {
  xs: 'h-7 w-7',
  sm: 'h-9 w-9',
  md: 'h-10 w-10',
  lg: 'h-16 w-16 sm:h-[4.5rem] sm:w-[4.5rem]',
  xl: 'h-28 w-28 sm:h-32 sm:w-32',
  hero: 'h-32 w-32 sm:h-40 sm:w-40',
}

export default function PingIcon({ size = 'md', className = '', glow = false }) {
  return (
    <img
      src={ICON}
      alt=""
      draggable={false}
      className={[
        'object-contain',
        SIZES[size] || SIZES.md,
        glow
          ? 'drop-shadow-[0_0_28px_rgba(56,189,248,0.55)]'
          : 'drop-shadow-[0_2px_10px_rgba(0,0,0,0.45)]',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
    />
  )
}
