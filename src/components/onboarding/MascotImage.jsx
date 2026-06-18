import { motion } from 'framer-motion'
import { getMascotSrc, isMascotPreloaded } from '../../lib/mascotAssets'

export default function MascotImage({
  pose = 'neutral',
  size = 'md',
  className = '',
  animate = true,
  alt = 'Ntlo mascot',
}) {
  const sizes = {
    sm: 'h-14 w-14',
    md: 'h-24 w-24',
    lg: 'h-32 w-32',
    xl: 'h-40 w-40',
  }

  const skipMotion = !animate || isMascotPreloaded(pose)
  const motionProps = skipMotion
    ? {}
    : {
      initial: { opacity: 0, scale: 0.92, y: 6 },
      animate: { opacity: 1, scale: 1, y: 0 },
      transition: { duration: 0.2, ease: [0.22, 1, 0.36, 1] },
    }

  return (
    <motion.img
      src={getMascotSrc(pose)}
      alt={alt}
      loading="eager"
      decoding="async"
      fetchPriority="high"
      className={`object-contain ${sizes[size] || sizes.md} ${className}`}
      draggable={false}
      {...motionProps}
    />
  )
}
