import { motion, AnimatePresence } from 'framer-motion'
import { usePingTransition } from '../../context/PingTransitionContext'

export default function PingGalaxyOverlay() {
  const { transitionActive } = usePingTransition()

  return (
    <AnimatePresence>
      {transitionActive && (
        <motion.div
          className="pointer-events-none fixed inset-0 z-[200] overflow-hidden bg-[#010104]"
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
            className="absolute inset-0"
            style={{
              background:
                'radial-gradient(ellipse 80% 55% at 65% 50%, rgba(14, 165, 233, 0.28) 0%, transparent 55%), radial-gradient(ellipse 50% 40% at 25% 65%, rgba(37, 99, 235, 0.2) 0%, transparent 50%)',
            }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.7, delay: 0.2 }}
          />

          <motion.div
            className="absolute inset-0 bg-gradient-to-r from-transparent via-black/20 to-black/60"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.35 }}
          />
        </motion.div>
      )}
    </AnimatePresence>
  )
}
