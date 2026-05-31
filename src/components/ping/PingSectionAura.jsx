import { motion } from 'framer-motion'
import { useLocale } from '../../context/LocaleContext'

export default function PingSectionAura({ variant = 'blue', className = '' }) {
  const { prefs } = useLocale()
  const colors =
    variant === 'violet'
      ? 'from-violet-500/20 via-blue-500/10 to-transparent'
      : 'from-sky-400/25 via-blue-600/15 to-transparent'

  if (prefs.reduceMotion) {
    return (
      <div
        className={`pointer-events-none absolute inset-0 bg-gradient-to-br ${colors} opacity-40 ${className}`}
        aria-hidden
      />
    )
  }

  return (
    <motion.div
      className={`pointer-events-none absolute -inset-8 overflow-hidden rounded-[2rem] ${className}`}
      aria-hidden
      initial={{ opacity: 0 }}
      whileInView={{ opacity: 1 }}
      viewport={{ once: true }}
    >
      <motion.div
        className={`absolute -left-1/4 top-1/4 h-64 w-64 rounded-full bg-gradient-to-br ${colors} blur-3xl`}
        animate={{ x: [0, 40, 0], y: [0, -20, 0], scale: [1, 1.15, 1] }}
        transition={{ duration: 12, repeat: Infinity, ease: 'easeInOut' }}
      />
      <motion.div
        className={`absolute -right-1/4 bottom-0 h-72 w-72 rounded-full bg-gradient-to-tl ${colors} blur-3xl`}
        animate={{ x: [0, -30, 0], y: [0, 25, 0], scale: [1, 1.1, 1] }}
        transition={{ duration: 14, repeat: Infinity, ease: 'easeInOut', delay: 1 }}
      />
    </motion.div>
  )
}
