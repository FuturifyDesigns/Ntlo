import { motion, AnimatePresence } from 'framer-motion'
import { useTranslation } from '../../hooks/useTranslation'

export default function AuthTransitionOverlay({ show, message }) {
  const { t } = useTranslation()

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.12, ease: 'easeOut' }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-primary/40 backdrop-blur-sm"
          role="status"
          aria-live="polite"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.98 }}
            transition={{ duration: 0.15, ease: 'easeOut' }}
            className="mx-4 flex max-w-sm flex-col items-center rounded-2xl border border-border bg-surface px-8 py-7 text-center shadow-xl"
          >
            <div className="mb-4 h-9 w-9 animate-spin rounded-full border-2 border-border border-t-accent" />
            <p className="font-display text-lg font-semibold text-primary">
              {message || t('auth.signingInSmooth')}
            </p>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
