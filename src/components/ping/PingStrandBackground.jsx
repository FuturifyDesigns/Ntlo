/** Lightweight CSS aurora — no canvas loop, smooth on scroll. */
export default function PingStrandBackground({ className = '' }) {
  return (
    <div className={`ping-aurora pointer-events-none absolute inset-0 overflow-hidden ${className}`} aria-hidden>
      <div className="ping-aurora-glow" />
      <div className="ping-aurora-ribbon ping-aurora-ribbon--1" />
      <div className="ping-aurora-ribbon ping-aurora-ribbon--2" />
      <div className="ping-aurora-ribbon ping-aurora-ribbon--3" />
      <div className="ping-aurora-ribbon ping-aurora-ribbon--4" />
    </div>
  )
}
