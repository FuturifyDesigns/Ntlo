import { motion } from 'framer-motion'
import { useLocale } from '../../context/LocaleContext'

const EASE = [0.22, 1, 0.36, 1]

const viewport = { once: true, amount: 0.12, margin: '0px 0px -40px 0px' }

export function PingScrollReveal({
  children,
  className = '',
  delay = 0,
  y = 20,
}) {
  const { prefs } = useLocale()

  if (prefs.reduceMotion) {
    return <div className={className}>{children}</div>
  }

  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={viewport}
      transition={{ duration: 0.55, delay, ease: EASE }}
    >
      {children}
    </motion.div>
  )
}

export function PingScrollStagger({
  children,
  className = '',
  stagger = 0.06,
  delay = 0,
}) {
  const { prefs } = useLocale()

  if (prefs.reduceMotion) {
    return <div className={className}>{children}</div>
  }

  return (
    <motion.div
      className={className}
      initial="hidden"
      whileInView="show"
      viewport={viewport}
      variants={{
        hidden: {},
        show: { transition: { staggerChildren: stagger, delayChildren: delay } },
      }}
    >
      {children}
    </motion.div>
  )
}

export function PingScrollStaggerItem({ children, className = '', y = 16 }) {
  const { prefs } = useLocale()

  if (prefs.reduceMotion) {
    return <div className={className}>{children}</div>
  }

  return (
    <motion.div
      className={className}
      variants={{
        hidden: { opacity: 0, y },
        show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: EASE } },
      }}
    >
      {children}
    </motion.div>
  )
}

export function PingScrollLines({ lines, className = '', lineClassName = '' }) {
  const { prefs } = useLocale()

  if (prefs.reduceMotion) {
    return (
      <div className={className}>
        {lines.map((line) => (
          <div key={line} className={lineClassName}>
            {line}
          </div>
        ))}
      </div>
    )
  }

  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={viewport}
      transition={{ duration: 0.55, ease: EASE }}
    >
      {lines.map((line) => (
        <div key={line} className={lineClassName}>
          {line}
        </div>
      ))}
    </motion.div>
  )
}

export function PingScrollMedia({ children, className = '', delay = 0 }) {
  const { prefs } = useLocale()

  if (prefs.reduceMotion) {
    return <div className={className}>{children}</div>
  }

  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={viewport}
      transition={{ duration: 0.6, delay, ease: EASE }}
    >
      {children}
    </motion.div>
  )
}

/** Feature screenshots — light backgrounds blend into the dark page. */
export function PingFeatureImage({ src, alt = '', className = '' }) {
  return (
    <div className={`ping-feature-frame ${className}`}>
      <img src={src} alt={alt} className="ping-feature-img w-full object-contain" loading="lazy" />
    </div>
  )
}

/** Hero / logo assets — black backgrounds blend out. */
export function PingHeroImage({ src, alt, className = '' }) {
  return <img src={src} alt={alt} className={`ping-hero-img mx-auto w-full ${className}`} />
}
