import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

const ease = [0.22, 1, 0.36, 1]

export default function SplashScreen({ onComplete }) {
  const [visible, setVisible] = useState(true)
  const [phase, setPhase] = useState('enter') // enter → hold → exit

  useEffect(() => {
    const t1 = setTimeout(() => setPhase('hold'), 700)
    const t2 = setTimeout(() => setPhase('exit'), 2600)
    const t3 = setTimeout(() => {
      setVisible(false)
      onComplete()
    }, 3200)

    return () => {
      clearTimeout(t1)
      clearTimeout(t2)
      clearTimeout(t3)
    }
  }, [onComplete])

  const base = import.meta.env.BASE_URL
  const exiting = phase === 'exit'

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          className="fixed inset-0 z-[100] overflow-hidden"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.55, ease }}
          aria-hidden="true"
        >
          {/* Background */}
          <motion.div
            className="absolute inset-0 bg-[#07070D]"
            animate={exiting ? { opacity: 0 } : { opacity: 1 }}
            transition={{ duration: 0.5 }}
          />
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_50%_40%,rgba(200,168,75,0.14),transparent_70%)]" />
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_50%_40%_at_20%_80%,rgba(91,163,217,0.08),transparent_60%)]" />

          {/* Animated grid */}
          <motion.div
            className="pointer-events-none absolute inset-0 opacity-[0.04]"
            style={{
              backgroundImage:
                'linear-gradient(rgba(200,168,75,0.8) 1px, transparent 1px), linear-gradient(90deg, rgba(200,168,75,0.8) 1px, transparent 1px)',
              backgroundSize: '48px 48px',
            }}
            initial={{ opacity: 0, scale: 1.08 }}
            animate={exiting ? { opacity: 0 } : { opacity: 0.04, scale: 1 }}
            transition={{ duration: 1.2, ease }}
          />

          {/* Floating orbs */}
          <motion.div
            className="pointer-events-none absolute left-[12%] top-[18%] h-32 w-32 rounded-full bg-accent/10 blur-3xl"
            animate={
              exiting
                ? { opacity: 0, scale: 0.8 }
                : { opacity: [0.4, 0.7, 0.4], scale: [1, 1.15, 1], x: [0, 12, 0], y: [0, -8, 0] }
            }
            transition={{ duration: 4, repeat: exiting ? 0 : Infinity, ease: 'easeInOut' }}
          />
          <motion.div
            className="pointer-events-none absolute bottom-[22%] right-[10%] h-40 w-40 rounded-full bg-[#5BA3D9]/10 blur-3xl"
            animate={
              exiting
                ? { opacity: 0, scale: 0.8 }
                : { opacity: [0.3, 0.55, 0.3], scale: [1, 1.2, 1], x: [0, -10, 0], y: [0, 6, 0] }
            }
            transition={{ duration: 5, repeat: exiting ? 0 : Infinity, ease: 'easeInOut', delay: 0.4 }}
          />

          {/* Top / bottom accent bars */}
          <motion.div
            className="absolute left-0 top-0 h-[2px] bg-gradient-to-r from-transparent via-accent to-transparent"
            initial={{ scaleX: 0, opacity: 0 }}
            animate={exiting ? { scaleX: 0, opacity: 0 } : { scaleX: 1, opacity: 1 }}
            transition={{ duration: 1, delay: 0.2, ease }}
          />
          <motion.div
            className="absolute bottom-0 left-0 h-px w-full bg-gradient-to-r from-transparent via-white/10 to-transparent"
            initial={{ opacity: 0 }}
            animate={{ opacity: exiting ? 0 : 1 }}
            transition={{ delay: 0.5, duration: 0.6 }}
          />

          {/* Main content */}
          <div className="relative flex h-full flex-col items-center justify-center px-6">
            {/* Decorative side lines */}
            <motion.div
              className="absolute left-6 top-1/2 hidden h-24 w-px origin-top bg-gradient-to-b from-transparent via-accent/40 to-transparent sm:block md:left-12"
              initial={{ scaleY: 0, opacity: 0 }}
              animate={exiting ? { scaleY: 0, opacity: 0 } : { scaleY: 1, opacity: 1 }}
              transition={{ duration: 0.9, delay: 0.35, ease }}
            />
            <motion.div
              className="absolute right-6 top-1/2 hidden h-24 w-px origin-top bg-gradient-to-b from-transparent via-accent/40 to-transparent sm:block md:right-12"
              initial={{ scaleY: 0, opacity: 0 }}
              animate={exiting ? { scaleY: 0, opacity: 0 } : { scaleY: 1, opacity: 1 }}
              transition={{ duration: 0.9, delay: 0.45, ease }}
            />

            <motion.div
              className="relative w-full max-w-[min(92vw,520px)]"
              initial={{ opacity: 0, y: 28, scale: 0.94, filter: 'blur(10px)' }}
              animate={
                exiting
                  ? { opacity: 0, y: -16, scale: 1.03, filter: 'blur(6px)' }
                  : { opacity: 1, y: 0, scale: 1, filter: 'blur(0px)' }
              }
              transition={{ duration: 0.85, ease }}
            >
              {/* Logo glow behind image */}
              <motion.div
                className="pointer-events-none absolute inset-0 -z-10 scale-90 rounded-full bg-accent/20 blur-3xl"
                animate={
                  exiting
                    ? { opacity: 0 }
                    : { opacity: [0.25, 0.45, 0.25], scale: [0.88, 0.96, 0.88] }
                }
                transition={{ duration: 2.8, repeat: exiting ? 0 : Infinity, ease: 'easeInOut' }}
              />

              <motion.img
                src={`${base}splash-logo.png`}
                alt="Ntlo — Your campus home, sorted."
                className="mx-auto w-full select-none"
                draggable={false}
                animate={phase === 'hold' && !exiting ? { y: [0, -4, 0] } : { y: 0 }}
                transition={{ duration: 3, repeat: phase === 'hold' && !exiting ? Infinity : 0, ease: 'easeInOut' }}
              />
            </motion.div>

            {/* Loading track */}
            <motion.div
              className="mt-10 w-full max-w-[200px] sm:mt-12 sm:max-w-[240px]"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: exiting ? 0 : 1, y: exiting ? 4 : 0 }}
              transition={{ delay: 0.55, duration: 0.5 }}
            >
              <div className="relative h-[2px] overflow-hidden rounded-full bg-white/10">
                <motion.div
                  className="absolute inset-y-0 left-0 w-1/3 rounded-full bg-gradient-to-r from-transparent via-accent to-transparent"
                  animate={exiting ? { x: '200%' } : { x: ['-100%', '320%'] }}
                  transition={
                    exiting
                      ? { duration: 0.4 }
                      : { duration: 1.4, repeat: Infinity, ease: 'easeInOut' }
                  }
                />
              </div>
            </motion.div>
          </div>

          {/* Footer credit */}
          <motion.p
            className="absolute bottom-7 left-0 right-0 text-center text-[10px] font-medium tracking-[0.22em] text-white/30 uppercase sm:bottom-9 sm:text-[11px]"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: exiting ? 0 : 0.55, y: exiting ? 4 : 0 }}
            transition={{ delay: 0.75, duration: 0.5 }}
          >
            Futurify Designs
          </motion.p>

          {/* Exit wipe to app background */}
          <motion.div
            className="absolute inset-0 origin-bottom bg-[#F8F7F4]"
            initial={{ scaleY: 0 }}
            animate={{ scaleY: exiting ? 1 : 0 }}
            transition={{ duration: 0.55, ease: [0.76, 0, 0.24, 1] }}
          />
        </motion.div>
      )}
    </AnimatePresence>
  )
}
