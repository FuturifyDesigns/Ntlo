import { motion, AnimatePresence } from 'framer-motion'
import { usePingTransition } from '../../context/PingTransitionContext'

export default function PingGalaxyOverlay() {
  const { transitionActive } = usePingTransition()

  return (
    <AnimatePresence>
      {transitionActive && (
        <motion.div
          className="pointer-events-none fixed inset-0 z-[200] overflow-hidden"
          initial={{ opacity: 1 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.35, delay: 0.15 }}
        >
          <motion.div
            className="absolute inset-0 bg-[#020208]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.2 }}
          />

          <motion.div
            className="ping-galaxy-wave absolute inset-y-0 left-0 w-[220vw]"
            initial={{ x: '-120%' }}
            animate={{ x: '0%' }}
            transition={{ duration: 0.85, ease: [0.22, 1, 0.36, 1] }}
          />

          <motion.div
            className="ping-galaxy-wave ping-galaxy-wave--soft absolute inset-y-0 left-0 w-[220vw]"
            initial={{ x: '-130%' }}
            animate={{ x: '-5%' }}
            transition={{ duration: 1.05, ease: [0.16, 1, 0.3, 1], delay: 0.05 }}
          />

          <motion.div
            className="absolute inset-0"
            style={{
              background:
                'radial-gradient(circle at 70% 50%, rgba(56, 189, 248, 0.35) 0%, transparent 45%), radial-gradient(circle at 30% 70%, rgba(37, 99, 235, 0.25) 0%, transparent 40%)',
            }}
            initial={{ opacity: 0, scale: 0.6 }}
            animate={{ opacity: 1, scale: 1.2 }}
            transition={{ duration: 0.9, ease: 'easeOut' }}
          />

          {[0, 1, 2, 3, 4].map((i) => (
            <motion.span
              key={i}
              className="ping-galaxy-star absolute block rounded-full bg-white"
              style={{
                width: 2 + (i % 3),
                height: 2 + (i % 3),
                top: `${12 + i * 16}%`,
                left: `${20 + i * 14}%`,
              }}
              initial={{ opacity: 0, scale: 0 }}
              animate={{ opacity: [0, 1, 0.6], scale: [0, 1.4, 1] }}
              transition={{ duration: 0.8, delay: 0.15 + i * 0.06 }}
            />
          ))}
        </motion.div>
      )}
    </AnimatePresence>
  )
}
