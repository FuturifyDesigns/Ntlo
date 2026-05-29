import { useEffect, useRef, useState } from 'react'
import { motion, useInView } from 'framer-motion'
import { useLocale } from '../../context/LocaleContext'

function useMotionEnabled() {
  const { prefs } = useLocale()
  return !prefs.reduceMotion
}

export function AnimatedCounter({ value, duration = 1.2, className }) {
  const motionEnabled = useMotionEnabled()
  const ref = useRef(null)
  const inView = useInView(ref, { once: true })
  const [display, setDisplay] = useState(0)

  useEffect(() => {
    if (!inView) return
    const target = typeof value === 'number' ? value : 0
    if (target === 0) {
      setDisplay(0)
      return
    }
    if (!motionEnabled) {
      setDisplay(target)
      return
    }
    const start = performance.now()
    const tick = (now) => {
      const progress = Math.min((now - start) / (duration * 1000), 1)
      const eased = 1 - (1 - progress) ** 3
      setDisplay(Math.round(target * eased))
      if (progress < 1) requestAnimationFrame(tick)
    }
    requestAnimationFrame(tick)
  }, [inView, value, duration, motionEnabled])

  return (
    <span ref={ref} className={className}>
      {display.toLocaleString()}
    </span>
  )
}

export function Reveal({ children, className = '', delay = 0, y = 32 }) {
  const ref = useRef(null)
  const inView = useInView(ref, { once: true, margin: '-80px' })
  const motionEnabled = useMotionEnabled()

  if (!motionEnabled) {
    return <div className={className}>{children}</div>
  }

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.7, delay, ease: [0.22, 1, 0.36, 1] }}
      className={className}
    >
      {children}
    </motion.div>
  )
}

export function RevealText({ text, className = '', delay = 0 }) {
  const motionEnabled = useMotionEnabled()
  if (!motionEnabled) {
    return <span className={className}>{text}</span>
  }

  const words = text.split(' ')
  const ref = useRef(null)
  const inView = useInView(ref, { once: true, margin: '-60px' })

  return (
    <span ref={ref} className={className} aria-label={text}>
      {words.map((word, i) => (
        <motion.span
          key={`${word}-${i}`}
          initial={{ opacity: 0, y: 20, filter: 'blur(4px)' }}
          animate={inView ? { opacity: 1, y: 0, filter: 'blur(0px)' } : {}}
          transition={{ duration: 0.5, delay: delay + i * 0.04, ease: [0.22, 1, 0.36, 1] }}
          className="inline-block mr-[0.28em]"
        >
          {word}
        </motion.span>
      ))}
    </span>
  )
}

export function ParallaxFloat({ children, className = '', strength = 20 }) {
  const motionEnabled = useMotionEnabled()
  const ref = useRef(null)
  const [offset, setOffset] = useState({ x: 0, y: 0 })

  useEffect(() => {
    if (!motionEnabled) return
    function onMove(e) {
      if (!ref.current) return
      const rect = ref.current.getBoundingClientRect()
      const cx = rect.left + rect.width / 2
      const cy = rect.top + rect.height / 2
      const dx = (e.clientX - cx) / rect.width
      const dy = (e.clientY - cy) / rect.height
      setOffset({ x: dx * strength, y: dy * strength })
    }
    window.addEventListener('mousemove', onMove)
    return () => window.removeEventListener('mousemove', onMove)
  }, [strength, motionEnabled])

  if (!motionEnabled) {
    return <div className={className}>{children}</div>
  }

  return (
    <motion.div
      ref={ref}
      animate={{ x: offset.x, y: offset.y }}
      transition={{ type: 'spring', stiffness: 120, damping: 20 }}
      className={className}
    >
      {children}
    </motion.div>
  )
}

export default function GrainOverlay() {
  return (
    <div
      className="pointer-events-none fixed inset-0 z-[9999] opacity-[0.035] mix-blend-overlay"
      style={{
        backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
      }}
    />
  )
}
