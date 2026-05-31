import { motion } from 'framer-motion'
import { useLocation } from 'react-router-dom'
import { usePingTransition } from '../../context/PingTransitionContext'
import { useTranslation } from '../../hooks/useTranslation'
import { useLocale } from '../../context/LocaleContext'

const PLAY_URL = 'https://play.google.com/store/apps/details?id=com.ping.bw'
const ICON = `${import.meta.env.BASE_URL}ping/app-icon.png`

export { PLAY_URL, ICON as PING_ICON }

export default function PingNavButton({ compact = false, onNavigate }) {
  const { goToPing } = usePingTransition()
  const { t } = useTranslation()
  const { prefs } = useLocale()
  const location = useLocation()
  const active = location.pathname === '/ping'

  function handleClick() {
    onNavigate?.()
    if (active) return
    goToPing()
  }

  const motionProps = prefs.reduceMotion
    ? {}
    : {
        whileHover: { scale: 1.06, y: -1 },
        whileTap: { scale: 0.96 },
        transition: { type: 'spring', stiffness: 420, damping: 22 },
      }

  return (
    <motion.button
      type="button"
      onClick={handleClick}
      aria-current={active ? 'page' : undefined}
      aria-label={t('nav.ping')}
      className={`ping-nav-btn group relative flex items-center gap-2 overflow-visible rounded-full border border-blue-500/25 bg-gradient-to-br from-[#050508] via-[#0c1222] to-[#020617] font-semibold text-white shadow-[0_0_24px_rgba(37,99,235,0.2)] ${
        compact ? 'px-2 py-1.5 text-xs' : 'px-3 py-1.5 text-sm'
      } ${active ? 'ring-2 ring-sky-400/50' : ''}`}
      {...motionProps}
    >
      <span className="ping-nav-ring pointer-events-none absolute -inset-1 rounded-full" aria-hidden />
      <span className="ping-nav-pulse pointer-events-none absolute inset-0 rounded-full" aria-hidden />
      <span className="ping-nav-pulse ping-nav-pulse--delayed pointer-events-none absolute inset-0 rounded-full" aria-hidden />
      <span className="ping-nav-shimmer pointer-events-none absolute inset-0 rounded-full opacity-0 transition-opacity duration-300 group-hover:opacity-100" aria-hidden />

      <motion.img
        src={ICON}
        alt=""
        className={`relative z-[1] rounded-xl object-cover shadow-[0_4px_20px_rgba(56,189,248,0.35)] ${compact ? 'h-8 w-8' : 'h-9 w-9'}`}
        {...(prefs.reduceMotion
          ? {}
          : {
              whileHover: { rotate: [0, -4, 4, 0], transition: { duration: 0.45 } },
            })}
      />

      {!compact && (
        <span className="relative z-[1] pr-1 bg-gradient-to-r from-white via-sky-100 to-sky-300 bg-clip-text text-transparent transition-all duration-300 group-hover:from-sky-100 group-hover:to-white">
          {t('nav.ping')}
        </span>
      )}
    </motion.button>
  )
}
