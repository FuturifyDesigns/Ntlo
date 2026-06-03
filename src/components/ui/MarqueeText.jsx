import { useEffect, useRef, useState } from 'react'
import { useLocale } from '../../context/LocaleContext'

export default function MarqueeText({ children, className = '' }) {
  const { prefs } = useLocale()
  const containerRef = useRef(null)
  const measureRef = useRef(null)
  const [overflow, setOverflow] = useState(false)

  const label = typeof children === 'string' ? children : String(children ?? '')

  useEffect(() => {
    const measure = () => {
      const container = containerRef.current
      const text = measureRef.current
      if (!container || !text) return
      setOverflow(text.scrollWidth > container.clientWidth + 1)
    }

    measure()
    const observer = typeof ResizeObserver !== 'undefined'
      ? new ResizeObserver(measure)
      : null
    if (observer && containerRef.current) observer.observe(containerRef.current)
    window.addEventListener('resize', measure)
    return () => {
      observer?.disconnect()
      window.removeEventListener('resize', measure)
    }
  }, [label])

  const duration = `${Math.max(5, label.length * 0.28)}s`
  const showMarquee = overflow && !prefs.reduceMotion

  return (
    <span ref={containerRef} className={`relative block min-w-0 max-w-full overflow-hidden ${className}`}>
      <span
        ref={measureRef}
        className="pointer-events-none invisible absolute left-0 top-0 whitespace-nowrap"
        aria-hidden="true"
      >
        {label}
      </span>
      {showMarquee ? (
        <span
          className="marquee-track inline-flex w-max"
          style={{ '--marquee-duration': duration }}
          aria-label={label}
        >
          <span className="shrink-0 pr-8">{label}</span>
          <span className="shrink-0 pr-8" aria-hidden="true">{label}</span>
        </span>
      ) : (
        <span className={`inline-block whitespace-nowrap ${overflow ? 'truncate' : ''}`}>
          {label}
        </span>
      )}
    </span>
  )
}
