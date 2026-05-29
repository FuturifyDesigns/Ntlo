import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

export default function SplashScreen({ onComplete }) {
  const [visible, setVisible] = useState(true)
  const [phase, setPhase] = useState('enter') // enter → hold → exit

  useEffect(() => {
    const t1 = setTimeout(() => setPhase('hold'), 400)
    const t2 = setTimeout(() => setPhase('exit'), 2200)
    const t3 = setTimeout(() => {
      setVisible(false)
      onComplete()
    }, 2800)

    return () => {
      clearTimeout(t1)
      clearTimeout(t2)
      clearTimeout(t3)
    }
  }, [onComplete])

  const base = import.meta.env.BASE_URL

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          className="fixed inset-0 z-[100] flex items-center justify-center overflow-hidden bg-[#F8F7F4]"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          aria-hidden="true"
        >
          {/* Soft ambient glow */}
          <div className="pointer-events-none absolute inset-0">
            <div className="absolute left-1/2 top-1/3 h-[420px] w-[420px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-accent/[0.07] blur-3xl" />
            <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-border to-transparent" />
          </div>

          <div className="relative flex flex-col items-center px-6 text-center">
            {/* Icon card */}
            <motion.div
              initial={{ opacity: 0, scale: 0.88, y: 12 }}
              animate={
                phase === 'exit'
                  ? { opacity: 0, scale: 0.96, y: -8 }
                  : { opacity: 1, scale: 1, y: 0 }
              }
              transition={{ duration: 0.65, ease: [0.22, 1, 0.36, 1] }}
              className="relative"
            >
              <div className="rounded-[28px] border border-border/80 bg-white p-5 shadow-[0_20px_60px_-12px_rgba(26,26,46,0.12)] sm:p-6">
                <img
                  src={`${base}favicon.png`}
                  alt=""
                  className="h-20 w-20 object-contain sm:h-24 sm:w-24"
                  width={96}
                  height={96}
                />
              </div>
              <motion.div
                initial={{ scaleX: 0 }}
                animate={{ scaleX: phase === 'exit' ? 0 : 1 }}
                transition={{ duration: 0.7, delay: 0.25, ease: [0.22, 1, 0.36, 1] }}
                className="mx-auto mt-5 h-0.5 w-12 origin-center rounded-full bg-accent"
              />
            </motion.div>

            {/* Wordmark */}
            <motion.div
              initial={{ opacity: 0, y: 14 }}
              animate={
                phase === 'exit'
                  ? { opacity: 0, y: -6 }
                  : phase === 'hold' || phase === 'enter'
                    ? { opacity: 1, y: 0 }
                    : { opacity: 0, y: 14 }
              }
              transition={{ duration: 0.5, delay: phase === 'enter' ? 0.15 : 0 }}
              className="mt-8"
            >
              <h1 className="font-display text-[2rem] font-bold tracking-tight text-primary sm:text-[2.25rem]">
                Ntlo
              </h1>
              <p className="mt-2 text-sm font-medium tracking-wide text-muted sm:text-base">
                Your campus home, sorted.
              </p>
            </motion.div>

            {/* Subtle loader */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: phase === 'exit' ? 0 : 1 }}
              transition={{ delay: 0.5, duration: 0.4 }}
              className="mt-10 flex items-center gap-1.5"
            >
              {[0, 1, 2].map((i) => (
                <motion.span
                  key={i}
                  className="h-1.5 w-1.5 rounded-full bg-accent/70"
                  animate={{ opacity: [0.35, 1, 0.35], scale: [0.85, 1, 0.85] }}
                  transition={{
                    duration: 1.1,
                    repeat: Infinity,
                    delay: i * 0.18,
                    ease: 'easeInOut',
                  }}
                />
              ))}
            </motion.div>
          </div>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: phase === 'exit' ? 0 : 0.45 }}
            transition={{ delay: 0.6, duration: 0.5 }}
            className="absolute bottom-8 text-[11px] font-medium tracking-[0.18em] text-muted uppercase"
          >
            Futurify Designs
          </motion.p>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
