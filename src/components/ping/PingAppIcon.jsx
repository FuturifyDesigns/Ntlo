export default function PingAppIcon({ className = 'h-7 w-7' }) {
  return (
    <svg viewBox="0 0 64 64" className={className} aria-hidden>
      <defs>
        <linearGradient id="pingIconGrad" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#38bdf8" />
          <stop offset="100%" stopColor="#1d4ed8" />
        </linearGradient>
      </defs>
      <rect width="64" height="64" rx="14" fill="url(#pingIconGrad)" />
      <circle cx="32" cy="26" r="14" fill="white" />
      <path
        d="M24 30h16v2H24v-2zm0 4h16v1.5H24V34zm2-8h12c1.1 0 2 .9 2 2v1H24v-1c0-1.1.9-2 2-2z"
        fill="#1d4ed8"
      />
      <path d="M32 42c-3.3 0-6 2.7-6 6h12c0-3.3-2.7-6-6-6z" fill="white" />
      <circle cx="32" cy="44" r="2.5" fill="#1d4ed8" />
      <text x="32" y="58" textAnchor="middle" fill="white" fontSize="9" fontWeight="700" fontFamily="system-ui,sans-serif">
        Ping
      </text>
    </svg>
  )
}
