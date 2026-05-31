const ICON = `${import.meta.env.BASE_URL}ping/app-icon.png?v=4`

export { ICON as PING_ICON }

const SIZES = {
  xs: 'h-7 w-7',
  sm: 'h-8 w-8',
  md: 'h-9 w-9',
  lg: 'h-14 w-14 sm:h-16 sm:w-16',
  xl: 'h-24 w-24 sm:h-28 sm:w-28',
  hero: 'h-28 w-28 sm:h-36 sm:w-36',
}

export default function PingIcon({ size = 'md', className = '' }) {
  return (
    <img
      src={ICON}
      alt=""
      draggable={false}
      className={`object-contain ${SIZES[size] || SIZES.md} ${className}`.trim()}
    />
  )
}
