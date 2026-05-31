import { useLocation } from 'react-router-dom'
import { usePingTransition } from '../../context/PingTransitionContext'
import { useTranslation } from '../../hooks/useTranslation'
import PingAppIcon from './PingAppIcon'

const PLAY_URL = 'https://play.google.com/store/apps/details?id=com.ping.bw'

export { PLAY_URL }

export default function PingNavButton({ compact = false, onNavigate }) {
  const { goToPing } = usePingTransition()
  const { t } = useTranslation()
  const location = useLocation()
  const active = location.pathname === '/ping'

  function handleClick() {
    onNavigate?.()
    if (active) return
    goToPing()
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      aria-current={active ? 'page' : undefined}
      className={`ping-nav-btn group relative flex items-center gap-2 overflow-hidden rounded-full border border-blue-500/30 bg-gradient-to-br from-[#0a0a12] via-[#0f172a] to-[#020617] font-semibold text-white shadow-[0_0_20px_rgba(37,99,235,0.25)] transition-transform hover:scale-[1.03] active:scale-[0.98] ${
        compact ? 'px-2.5 py-1.5 text-xs' : 'px-3.5 py-2 text-sm'
      } ${active ? 'ring-2 ring-sky-400/60' : ''}`}
    >
      <span className="ping-nav-pulse pointer-events-none absolute inset-0 rounded-full" aria-hidden />
      <span className="ping-nav-pulse ping-nav-pulse--delayed pointer-events-none absolute inset-0 rounded-full" aria-hidden />
      <PingAppIcon className={compact ? 'relative z-[1] h-6 w-6' : 'relative z-[1] h-7 w-7'} />
      <span className="relative z-[1] bg-gradient-to-r from-white to-sky-200 bg-clip-text text-transparent">
        {t('nav.ping')}
      </span>
    </button>
  )
}
