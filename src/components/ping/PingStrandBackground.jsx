import { useEffect, useRef } from 'react'
import { useLocale } from '../../context/LocaleContext'

const STRANDS = [
  { amp: 42, freq: 0.004, speed: 0.00035, y: 0.62, width: 2.2, alpha: 0.55, hue: 205 },
  { amp: 58, freq: 0.0032, speed: 0.00028, y: 0.72, width: 3.4, alpha: 0.75, hue: 210 },
  { amp: 34, freq: 0.005, speed: 0.00042, y: 0.78, width: 1.8, alpha: 0.45, hue: 198 },
  { amp: 48, freq: 0.0038, speed: 0.00031, y: 0.85, width: 2.8, alpha: 0.65, hue: 212 },
  { amp: 26, freq: 0.006, speed: 0.00048, y: 0.68, width: 1.4, alpha: 0.35, hue: 220 },
  { amp: 52, freq: 0.0035, speed: 0.00025, y: 0.92, width: 3, alpha: 0.5, hue: 200 },
]

function drawStrand(ctx, strand, w, h, t) {
  const baseY = h * strand.y
  ctx.beginPath()
  for (let x = -40; x <= w + 40; x += 3) {
    const wave =
      Math.sin(x * strand.freq + t * strand.speed * 10000) * strand.amp +
      Math.sin(x * strand.freq * 0.5 + t * strand.speed * 7000) * (strand.amp * 0.35)
    const y = baseY + wave
    if (x === -40) ctx.moveTo(x, y)
    else ctx.lineTo(x, y)
  }
  const grad = ctx.createLinearGradient(0, baseY - strand.amp, w, baseY + strand.amp)
  grad.addColorStop(0, `hsla(${strand.hue}, 95%, 62%, 0)`)
  grad.addColorStop(0.35, `hsla(${strand.hue}, 95%, 62%, ${strand.alpha})`)
  grad.addColorStop(0.65, `hsla(${strand.hue + 8}, 100%, 72%, ${strand.alpha * 0.9})`)
  grad.addColorStop(1, `hsla(${strand.hue}, 95%, 62%, 0)`)
  ctx.strokeStyle = grad
  ctx.lineWidth = strand.width
  ctx.lineCap = 'round'
  ctx.shadowColor = `hsla(${strand.hue}, 100%, 65%, 0.8)`
  ctx.shadowBlur = 18
  ctx.stroke()
  ctx.shadowBlur = 0
}

export default function PingStrandBackground({ className = '' }) {
  const canvasRef = useRef(null)
  const { prefs } = useLocale()

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return undefined

    const ctx = canvas.getContext('2d')
    let frame = 0
    let raf = 0

    function resize() {
      const dpr = Math.min(window.devicePixelRatio || 1, 2)
      const { width, height } = canvas.getBoundingClientRect()
      canvas.width = width * dpr
      canvas.height = height * dpr
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    }

    function paint(t) {
      const w = canvas.clientWidth
      const h = canvas.clientHeight
      ctx.clearRect(0, 0, w, h)

      const glow = ctx.createRadialGradient(w * 0.72, h * 0.78, 0, w * 0.72, h * 0.78, w * 0.55)
      glow.addColorStop(0, 'rgba(37, 99, 235, 0.18)')
      glow.addColorStop(0.5, 'rgba(14, 165, 233, 0.08)')
      glow.addColorStop(1, 'rgba(0, 0, 0, 0)')
      ctx.fillStyle = glow
      ctx.fillRect(0, 0, w, h)

      STRANDS.forEach((strand) => drawStrand(ctx, strand, w, h, prefs.reduceMotion ? 0 : t))
      raf = requestAnimationFrame(paint)
    }

    resize()
    window.addEventListener('resize', resize)
    raf = requestAnimationFrame(paint)

    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('resize', resize)
    }
  }, [prefs.reduceMotion])

  return (
    <canvas
      ref={canvasRef}
      className={`pointer-events-none absolute inset-0 h-full w-full ${className}`}
      aria-hidden
    />
  )
}
