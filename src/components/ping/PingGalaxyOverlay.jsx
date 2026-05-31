import { motion, AnimatePresence } from 'framer-motion'
import { usePingTransition } from '../../context/PingTransitionContext'
import { useTranslation } from '../../hooks/useTranslation'
import PingIcon from './PingIcon'

export default function PingGalaxyOverlay() {
  const { transitionActive } = usePingTransition()
  const { t } = useTranslation()

  return (
    <AnimatePresence>
      {transitionActive && (
        <motion.div
          className="pointer-events-none fixed inset-0 z-[200] flex items-center justify-center overflow-hidden bg-[#010104]"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
        >
          <motion.div
            className="ping-galaxy-wave ping-galaxy-wave--deep absolute inset-y-[-10%] left-0 w-[240vw] skew-x-[-8deg]"
            initial={{ x: '-115%' }}
            animate={{ x: '-8%' }}
            transition={{ duration: 0.95, ease: [0.16, 1, 0.3, 1] }}
          />

          <motion.div
            className="ping-galaxy-wave ping-galaxy-wave--mid absolute inset-y-[-5%] left-0 w-[240vw] skew-x-[-6deg]"
            initial={{ x: '-125%' }}
            animate={{ x: '-12%' }}
            transition={{ duration: 1.05, ease: [0.22, 1, 0.36, 1], delay: 0.04 }}
          />

          <motion.div
            className="ping-galaxy-wave ping-galaxy-wave--bright absolute inset-y-0 left-0 w-[240vw] skew-x-[-4deg]"
            initial={{ x: '-135%' }}
            animate={{ x: '-18%' }}
            transition={{ duration: 1.15, ease: [0.19, 1, 0.22, 1], delay: 0.08 }}
          />

          <motion.div
            className="relative z-10 flex flex-col items-center px-6 text-center"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.35, ease: [0.22, 1, 0.36, 1] }}
          >
            <PingIcon size="xl" />
            <p className="mt-4 font-display text-4xl font-bold text-white sm:text-5xl">Ping</p>
            <p className="mt-2 text-lg text-white/80 sm:text-xl">
              {t('ping.tagline')}{' '}
              <span className="font-semibold text-sky-400">{t('ping.taglineHighlight')}</span>
            </p>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
