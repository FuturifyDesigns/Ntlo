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
          className="fixed inset-0 z-[100] overflow-hidden bg-black"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.55, ease }}
          aria-hidden="true"
        >
          {/* Deep background — matches transparent logo edges */}
          <motion.div
            className="absolute inset-0 bg-[#030305]"
            animate={exiting ? { opacity: 0 } : { opacity: 1 }}
            transition={{ duration: 0.5 }}
          />
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_90%_70%_at_50%_42%,rgba(200,168,75,0.12),transparent_72%)]" />
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_55%_45%_at_50%_50%,rgba(26,26,46,0.55),transparent_75%)]" />

          {/* Floating orbs */}
          <motion.div
            className="pointer-events-none absolute left-[8%] top-[14%] h-36 w-36 rounded-full bg-accent/[0.08] blur-3xl"
            animate={
              exiting
                ? { opacity: 0, scale: 0.8 }
                : { opacity: [0.35, 0.6, 0.35], scale: [1, 1.12, 1], x: [0, 10, 0], y: [0, -6, 0] }
            }
            transition={{ duration: 4, repeat: exiting ? 0 : Infinity, ease: 'easeInOut' }}
          />
          <motion.div
            className="pointer-events-none absolute bottom-[18%] right-[8%] h-44 w-44 rounded-full bg-[#5BA3D9]/[0.07] blur-3xl"
            animate={
              exiting
                ? { opacity: 0, scale: 0.8 }
                : { opacity: [0.25, 0.5, 0.25], scale: [1, 1.15, 1], x: [0, -8, 0], y: [0, 5, 0] }
            }
            transition={{ duration: 5, repeat: exiting ? 0 : Infinity, ease: 'easeInOut', delay: 0.4 }}
          />

          {/* Top accent */}
          <motion.div
            className="absolute left-0 top-0 h-[2px] bg-gradient-to-r from-transparent via-accent/80 to-transparent"
            initial={{ scaleX: 0, opacity: 0 }}
            animate={exiting ? { scaleX: 0, opacity: 0 } : { scaleX: 1, opacity: 1 }}
            transition={{ duration: 1, delay: 0.2, ease }}
          />

          {/* Main content */}
          <div className="relative flex h-full flex-col items-center justify-center px-4 sm:px-6">
            <motion.div
              className="relative w-full max-w-[min(98vw,880px)]"
              initial={{ opacity: 0, y: 20, scale: 0.96 }}
              animate={
                exiting
                  ? { opacity: 0, y: -12, scale: 1.02 }
                  : { opacity: 1, y: 0, scale: 1 }
              }
              transition={{ duration: 0.8, ease }}
            >
              {/* Soft halo — sits behind transparent PNG */}
              <motion.div
                className="pointer-events-none absolute left-1/2 top-[42%] h-[min(52vw,420px)] w-[min(85vw,680px)] -translate-x-1/2 -translate-y-1/2 rounded-full bg-accent/[0.07] blur-[80px]"
                animate={
                  exiting
                    ? { opacity: 0 }
                    : { opacity: [0.5, 0.75, 0.5] }
                }
                transition={{ duration: 3, repeat: exiting ? 0 : Infinity, ease: 'easeInOut' }}
              />

              <motion.img
                src={`${base}splash-logo.png`}
                alt="Ntlo — Your campus home, sorted."
                className="splash-logo mx-auto h-auto w-full max-w-[min(98vw,880px)] select-none"
                width={880}
                height={440}
                draggable={false}
                fetchPriority="high"
                decoding="sync"
                animate={phase === 'hold' && !exiting ? { y: [0, -5, 0] } : { y: 0 }}
                transition={{ duration: 3.2, repeat: phase === 'hold' && !exiting ? Infinity : 0, ease: 'easeInOut' }}
              />
            </motion.div>

            {/* Loading track */}
            <motion.div
              className="mt-8 w-full max-w-[220px] sm:mt-10 sm:max-w-[260px]"
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
            className="absolute bottom-6 left-0 right-0 text-center text-[10px] font-medium tracking-[0.22em] text-white/35 uppercase sm:bottom-8 sm:text-[11px]"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: exiting ? 0 : 0.6, y: exiting ? 4 : 0 }}
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
