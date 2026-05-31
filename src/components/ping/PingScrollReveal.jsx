import { motion, useInView } from 'framer-motion'
import { useRef } from 'react'
import { useLocale } from '../../context/LocaleContext'

const EASE = [0.16, 1, 0.3, 1]

/** Lusion-style scroll reveal: clip mask + blur dissolve + lift. */
export function PingScrollReveal({
  children,
  className = '',
  delay = 0,
  y = 72,
  once = true,
  amount = 0.22,
}) {
  const ref = useRef(null)
  const inView = useInView(ref, { once, amount })
  const { prefs } = useLocale()

  if (prefs.reduceMotion) {
    return (
      <div ref={ref} className={className}>
        {children}
      </div>
    )
  }

  return (
    <motion.div
      ref={ref}
      className={className}
      initial={{ opacity: 0, y, filter: 'blur(12px)', clipPath: 'inset(100% 0 0 0)' }}
      animate={
        inView
          ? { opacity: 1, y: 0, filter: 'blur(0px)', clipPath: 'inset(0% 0 0 0)' }
          : { opacity: 0, y, filter: 'blur(12px)', clipPath: 'inset(100% 0 0 0)' }
      }
      transition={{ duration: 1.05, delay, ease: EASE }}
    >
      {children}
    </motion.div>
  )
}

/** Stagger inner children on scroll — good for grids and feature rows. */
export function PingScrollStagger({
  children,
  className = '',
  stagger = 0.1,
  delay = 0,
  once = true,
  amount = 0.2,
}) {
  const ref = useRef(null)
  const inView = useInView(ref, { once, amount })
  const { prefs } = useLocale()

  if (prefs.reduceMotion) {
    return (
      <div ref={ref} className={className}>
        {children}
      </div>
    )
  }

  return (
    <motion.div
      ref={ref}
      className={className}
      initial="hidden"
      animate={inView ? 'show' : 'hidden'}
      variants={{
        hidden: {},
        show: { transition: { staggerChildren: stagger, delayChildren: delay } },
      }}
    >
      {children}
    </motion.div>
  )
}

export function PingScrollStaggerItem({ children, className = '', y = 48 }) {
  const { prefs } = useLocale()

  if (prefs.reduceMotion) {
    return <div className={className}>{children}</div>
  }

  return (
    <motion.div
      className={className}
      variants={{
        hidden: { opacity: 0, y, filter: 'blur(10px)' },
        show: {
          opacity: 1,
          y: 0,
          filter: 'blur(0px)',
          transition: { duration: 0.95, ease: EASE },
        },
      }}
    >
      {children}
    </motion.div>
  )
}

/** Split heading reveal — each line slides up with mask. */
export function PingScrollLines({ lines, className = '', lineClassName = '' }) {
  const ref = useRef(null)
  const inView = useInView(ref, { once: true, amount: 0.5 })
  const { prefs } = useLocale()

  if (prefs.reduceMotion) {
    return (
      <div ref={ref} className={className}>
        {lines.map((line) => (
          <div key={line} className={lineClassName}>
            {line}
          </div>
        ))}
      </div>
    )
  }

  return (
    <div ref={ref} className={className}>
      {lines.map((line, i) => (
        <div key={line} className="overflow-hidden">
          <motion.div
            className={lineClassName}
            initial={{ y: '110%', opacity: 0 }}
            animate={inView ? { y: 0, opacity: 1 } : { y: '110%', opacity: 0 }}
            transition={{ duration: 0.9, delay: i * 0.12, ease: EASE }}
          >
            {line}
          </motion.div>
        </div>
      ))}
    </div>
  )
}

/** Image/card reveal with scale — Lusion project card feel. */
export function PingScrollMedia({ children, className = '', delay = 0 }) {
  const ref = useRef(null)
  const inView = useInView(ref, { once: true, amount: 0.25 })
  const { prefs } = useLocale()

  if (prefs.reduceMotion) {
    return (
      <div ref={ref} className={className}>
        {children}
      </div>
    )
  }

  return (
    <motion.div
      ref={ref}
      className={className}
      initial={{ opacity: 0, scale: 0.92, y: 40, filter: 'blur(8px)' }}
      animate={
        inView
          ? { opacity: 1, scale: 1, y: 0, filter: 'blur(0px)' }
          : { opacity: 0, scale: 0.92, y: 40, filter: 'blur(8px)' }
      }
      transition={{ duration: 1.1, delay, ease: EASE }}
    >
      {children}
    </motion.div>
  )
}
