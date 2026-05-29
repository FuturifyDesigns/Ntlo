import { motion } from 'framer-motion'
import { useLocale } from '../../context/LocaleContext'

export default function PageShell({ children, className = '' }) {
  const { prefs } = useLocale()
  const reduce = prefs.reduceMotion

  return (
    <motion.div
      initial={reduce ? false : { opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: reduce ? 0 : 0.35, ease: [0.22, 1, 0.36, 1] }}
      className={className}
    >
      {children}
    </motion.div>
  )
}
