import { useEffect, useRef } from 'react'
import { useLocale } from '../../context/LocaleContext'

/** Flowing aurora ribbons — blue light strands like the Ping hero art. */
const RIBBONS = [
  { y0: 0.88, rise: 0.42, amp: 0.09, freq: 2.1, speed: 0.00022, phase: 0, width: 110, alpha: 0.22, hue: 205 },
  { y0: 0.92, rise: 0.48, amp: 0.11, freq: 1.7, speed: 0.00018, phase: 1.2, width: 140, alpha: 0.32, hue: 210 },
  { y0: 0.78, rise: 0.38, amp: 0.08, freq: 2.4, speed: 0.00026, phase: 2.4, width: 90, alpha: 0.18, hue: 198 },
  { y0: 0.95, rise: 0.52, amp: 0.13, freq: 1.5, speed: 0.00015, phase: 0.8, width: 160, alpha: 0.38, hue: 212 },
  { y0: 0.72, rise: 0.35, amp: 0.07, freq: 2.8, speed: 0.0003, phase: 3.1, width: 70, alpha: 0.14, hue: 220 },
  { y0: 0.85, rise: 0.45, amp: 0.1, freq: 1.9, speed: 0.0002, phase: 4.0, width: 120, alpha: 0.28, hue: 206 },
  { y0: 0.98, rise: 0.55, amp: 0.15, freq: 1.3, speed: 0.00012, phase: 1.8, width: 180, alpha: 0.45, hue: 208 },
]

function ribbonPoints(w, h, ribbon, t) {
  const pts = []
  const steps = 48
  for (let i = 0; i <= steps; i += 1) {
    const u = i / steps
    const x = w * (-0.08 + u * 1.16)
    const baseY = h * (ribbon.y0 - u * ribbon.rise)
    const wave =
      Math.sin(u * Math.PI * ribbon.freq + t * ribbon.speed * 8000 + ribbon.phase) *
        h *
        ribbon.amp +
      Math.sin(u * Math.PI * ribbon.freq * 0.6 + t * ribbon.speed * 5000 + ribbon.phase * 1.3) *
        h *
        ribbon.amp *
        0.45
    pts.push({ x, y: baseY + wave })
  }
  return pts
}

function drawRibbon(ctx, w, h, ribbon, t) {
  const pts = ribbonPoints(w, h, ribbon, t)
  if (pts.length < 2) return

  ctx.save()
  ctx.globalCompositeOperation = 'screen'
  ctx.lineCap = 'round'
  ctx.lineJoin = 'round'

  for (let pass = 0; pass < 3; pass += 1) {
    const widthMul = pass === 0 ? 2.8 : pass === 1 ? 1.4 : 0.55
    const alphaMul = pass === 0 ? 0.35 : pass === 1 ? 0.7 : 1
    ctx.beginPath()
    ctx.moveTo(pts[0].x, pts[0].y)
    for (let i = 1; i < pts.length; i += 1) {
      const prev = pts[i - 1]
      const curr = pts[i]
      const cpx = (prev.x + curr.x) / 2
      const cpy = (prev.y + curr.y) / 2
      ctx.quadraticCurveTo(prev.x, prev.y, cpx, cpy)
    }
    ctx.lineTo(pts[pts.length - 1].x, pts[pts.length - 1].y)

    const grad = ctx.createLinearGradient(0, h * ribbon.y0, w, h * (ribbon.y0 - ribbon.rise))
    grad.addColorStop(0, `hsla(${ribbon.hue}, 100%, 55%, 0)`)
    grad.addColorStop(0.25, `hsla(${ribbon.hue}, 95%, 58%, ${ribbon.alpha * alphaMul * 0.5})`)
    grad.addColorStop(0.55, `hsla(${ribbon.hue + 6}, 100%, 68%, ${ribbon.alpha * alphaMul})`)
    grad.addColorStop(0.8, `hsla(${ribbon.hue}, 90%, 52%, ${ribbon.alpha * alphaMul * 0.4})`)
    grad.addColorStop(1, `hsla(${ribbon.hue}, 100%, 55%, 0)`)

    ctx.strokeStyle = grad
    ctx.lineWidth = ribbon.width * widthMul
    ctx.shadowColor = `hsla(${ribbon.hue}, 100%, 65%, ${ribbon.alpha * 0.9})`
    ctx.shadowBlur = pass === 0 ? 36 : pass === 1 ? 18 : 6
    ctx.stroke()
  }

  ctx.restore()
}

function drawVeil(ctx, w, h, t) {
  const gx = w * (0.55 + Math.sin(t * 0.00008) * 0.08)
  const gy = h * (0.72 + Math.cos(t * 0.00006) * 0.04)
  const glow = ctx.createRadialGradient(gx, gy, 0, gx, gy, w * 0.65)
  glow.addColorStop(0, 'rgba(56, 189, 248, 0.14)')
  glow.addColorStop(0.35, 'rgba(37, 99, 235, 0.08)')
  glow.addColorStop(0.7, 'rgba(14, 165, 233, 0.03)')
  glow.addColorStop(1, 'rgba(0, 0, 0, 0)')
  ctx.fillStyle = glow
  ctx.fillRect(0, 0, w, h)

  const veil = ctx.createLinearGradient(w * 0.3, h, w, 0)
  veil.addColorStop(0, 'rgba(37, 99, 235, 0.06)')
  veil.addColorStop(0.5, 'rgba(56, 189, 248, 0.04)')
  veil.addColorStop(1, 'rgba(0, 0, 0, 0)')
  ctx.fillStyle = veil
  ctx.fillRect(0, 0, w, h)
}

export default function PingStrandBackground({ className = '' }) {
  const canvasRef = useRef(null)
  const { prefs } = useLocale()

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return undefined

    const ctx = canvas.getContext('2d')
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

      const time = prefs.reduceMotion ? 0 : t
      drawVeil(ctx, w, h, time)

      RIBBONS.forEach((ribbon) => drawRibbon(ctx, w, h, ribbon, time))

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
