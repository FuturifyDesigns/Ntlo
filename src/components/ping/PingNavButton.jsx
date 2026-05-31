import { useLocation } from 'react-router-dom'
import { usePingTransition } from '../../context/PingTransitionContext'
import { useTranslation } from '../../hooks/useTranslation'

const PLAY_URL = 'https://play.google.com/store/apps/details?id=com.ping.bw'
const ICON = `${import.meta.env.BASE_URL}ping/app-icon.png`

export { PLAY_URL, ICON as PING_ICON }

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
      aria-label={t('nav.ping')}
      className={`flex items-center gap-2 rounded-full border border-border/80 bg-background/80 font-medium text-primary transition-colors hover:border-sky-400/40 hover:bg-sky-50/80 ${
        compact ? 'px-2 py-1' : 'px-2.5 py-1.5 text-sm'
      } ${active ? 'border-sky-400/50 bg-sky-50 ring-1 ring-sky-400/30' : ''}`}
    >
      <img
        src={ICON}
        alt=""
        className={`rounded-lg object-contain ${compact ? 'h-8 w-8' : 'h-9 w-9'}`}
      />
      {!compact && <span>{t('nav.ping')}</span>}
    </button>
  )
}
