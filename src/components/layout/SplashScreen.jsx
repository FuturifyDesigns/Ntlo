import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

export default function SplashScreen({ onComplete }) {
  const [visible, setVisible] = useState(true)
  const [phase, setPhase] = useState('loading') // loading → reveal → exit
  const [progress, setProgress] = useState(0)

  useEffect(() => {
    const progressInterval = setInterval(() => {
      setProgress((p) => Math.min(p + 2, 100))
    }, 50)

    const t1 = setTimeout(() => setPhase('reveal'), 600)
    const t2 = setTimeout(() => setPhase('exit'), 2600)
    const t3 = setTimeout(() => {
      clearInterval(progressInterval)
      setVisible(false)
      onComplete()
    }, 3200)

    return () => {
      clearInterval(progressInterval)
      clearTimeout(t1)
      clearTimeout(t2)
      clearTimeout(t3)
    }
  }, [onComplete])

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          className="fixed inset-0 z-[100] overflow-hidden"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        >
          {/* Apartment photo background */}
          <div className="absolute inset-0">
            <motion.img
              src={`${import.meta.env.BASE_URL}hero/bg.jpg`}
              alt=""
              className="h-full w-full object-cover"
              initial={{ scale: 1.15 }}
              animate={{ scale: phase === 'exit' ? 1.05 : 1.08 }}
              transition={{ duration: 3, ease: 'easeOut' }}
            />
            <div className="absolute inset-0 bg-primary/90" />
            <div className="absolute inset-0 bg-gradient-to-t from-primary via-primary/80 to-primary/60" />
          </div>

          {/* Gold accent lines */}
          <motion.div
            initial={{ scaleX: 0 }}
            animate={{ scaleX: phase === 'exit' ? 0 : 1 }}
            transition={{ duration: 1, delay: 0.3 }}
            className="absolute left-0 top-0 h-1 w-full origin-left bg-accent"
          />
          <motion.div
            initial={{ scaleY: 0 }}
            animate={{ scaleY: phase === 'exit' ? 0 : 1 }}
            transition={{ duration: 0.8, delay: 0.5 }}
            className="absolute left-0 top-0 h-full w-1 origin-top bg-accent/60"
          />

          {/* Content */}
          <div className="relative flex h-full flex-col items-center justify-center px-6">
            {/* Progress ring */}
            <motion.div
              initial={{ opacity: 0, scale: 0.5 }}
              animate={
                phase === 'exit'
                  ? { opacity: 0, scale: 1.2 }
                  : { opacity: 1, scale: 1 }
              }
              transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
              className="relative mb-10"
            >
              <svg className="h-28 w-28 -rotate-90 sm:h-32 sm:w-32" viewBox="0 0 120 120">
                <circle cx="60" cy="60" r="54" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="2" />
                <circle
                  cx="60"
                  cy="60"
                  r="54"
                  fill="none"
                  stroke="#C8A84B"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeDasharray={`${2 * Math.PI * 54}`}
                  strokeDashoffset={`${2 * Math.PI * 54 * (1 - progress / 100)}`}
                  style={{ transition: 'stroke-dashoffset 0.1s linear' }}
                />
              </svg>

              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.4, duration: 0.5 }}
                className="absolute inset-0 flex items-center justify-center"
              >
                <img
                  src={`${import.meta.env.BASE_URL}logo-brand.png`}
                  alt="Ntlo"
                  className="h-16 w-auto max-w-[140px] object-contain sm:h-20 sm:max-w-[160px]"
                />
              </motion.div>
            </motion.div>

            {/* Brand name + tagline */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={
                phase === 'reveal' || phase === 'exit'
                  ? phase === 'exit'
                    ? { opacity: 0, y: -12 }
                    : { opacity: 1, y: 0 }
                  : { opacity: 0, y: 16 }
              }
              transition={{ duration: 0.5 }}
              className="text-center"
            >
              <h1 className="font-display text-3xl font-bold tracking-tight text-white sm:text-4xl">
                Ntlo
              </h1>
              <p className="mt-3 font-display text-sm tracking-[0.25em] text-accent sm:text-base">
                Your campus home, sorted.
              </p>
            </motion.div>

            {/* Loading bar */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: phase === 'exit' ? 0 : 0.8 }}
              className="absolute bottom-10 left-1/2 w-48 -translate-x-1/2 sm:bottom-14 sm:w-56"
            >
              <div className="h-px w-full overflow-hidden bg-white/10">
                <motion.div
                  className="h-full bg-accent"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <p className="mt-2 text-center text-[10px] uppercase tracking-[0.2em] text-white/40">
                Loading
              </p>
            </motion.div>
          </div>

          {/* Exit curtain wipe */}
          <motion.div
            initial={{ scaleY: 0 }}
            animate={{ scaleY: phase === 'exit' ? 1 : 0 }}
            transition={{ duration: 0.55, ease: [0.76, 0, 0.24, 1] }}
            className="absolute inset-0 origin-top bg-primary"
          />
        </motion.div>
      )}
    </AnimatePresence>
  )
}
