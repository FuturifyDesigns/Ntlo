const ICON = `${import.meta.env.BASE_URL}ping/app-icon.png?v=6`

export { ICON as PING_ICON }

const SIZES = {
  xs: 'h-7 w-7',
  sm: 'h-8 w-8 sm:h-9 sm:w-9',
  md: 'h-9 w-9 sm:h-10 sm:w-10',
  lg: 'h-12 w-12 sm:h-16 sm:w-16 md:h-[4.5rem] md:w-[4.5rem]',
  xl: 'h-20 w-20 sm:h-28 sm:w-28 md:h-32 md:w-32',
  hero: 'h-[6.5rem] w-[6.5rem] sm:h-32 sm:w-32 md:h-40 md:w-40',
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
