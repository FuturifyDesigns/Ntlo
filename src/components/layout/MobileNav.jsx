import { Link, useLocation } from 'react-router-dom'
import { Home, Search, Heart, User, GraduationCap, Building2 } from 'lucide-react'
import { useAuth } from '../../hooks/useAuth'
import { useTranslation } from '../../hooks/useTranslation'
import { useDashboardPath } from '../../hooks/useNavLinks'
import { onboardingNavClass, useOnboardingNavHighlight } from '../../hooks/useOnboardingNavHighlight'

function MobileNavTab({ to, icon: Icon, label, active, highlighted }) {
  return (
    <Link
      to={to}
      className={`flex flex-col items-center gap-0.5 px-3 py-1 text-xs font-medium ${
        active ? 'text-accent' : 'text-muted'
      } ${highlighted ? onboardingNavClass(true) : ''}`}
    >
      <Icon size={20} className={highlighted ? 'scale-110' : ''} />
      <span className={highlighted ? 'font-bold underline decoration-accent decoration-2 underline-offset-2' : ''}>
        {label}
      </span>
    </Link>
  )
}

export default function MobileNav() {
  const location = useLocation()
  const { user, isLandlord } = useAuth()
  const { t } = useTranslation()
  const dashboardPath = useDashboardPath()

  const highlightListings = useOnboardingNavHighlight('/listings')
  const highlightStudent = useOnboardingNavHighlight('/student')
  const highlightLandlord = useOnboardingNavHighlight('/landlord')

  const tabs = [
    { to: '/', icon: Home, label: t('nav.home'), highlighted: false },
    { to: '/listings', icon: Search, label: t('nav.browse'), highlighted: highlightListings },
    { to: '/universities', icon: GraduationCap, label: t('nav.unis'), highlighted: false },
    isLandlord
      ? { to: '/landlord', icon: Building2, label: t('nav.myListings'), highlighted: highlightLandlord }
      : { to: '/student', icon: Heart, label: t('nav.saved'), highlighted: highlightStudent },
  ]

  const profileLink = user ? dashboardPath : '/login'
  const profileActive = location.pathname.includes('landlord')
    || location.pathname === '/student'
    || location.pathname === '/login'
  const profileHighlighted = isLandlord ? highlightLandlord : highlightStudent

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 border-t border-border bg-surface md:hidden" aria-label="Mobile navigation">
      <div className="flex items-center justify-around py-2">
        {tabs.map((tab) => {
          const active = location.pathname === tab.to || (tab.to !== '/' && location.pathname.startsWith(tab.to))
          return (
            <MobileNavTab
              key={tab.to}
              to={tab.to}
              icon={tab.icon}
              label={tab.label}
              active={active}
              highlighted={tab.highlighted}
            />
          )
        })}
        <Link
          to={profileLink}
          className={`flex flex-col items-center gap-0.5 px-3 py-1 text-xs font-medium ${
            profileActive ? 'text-accent' : 'text-muted'
          } ${profileHighlighted ? onboardingNavClass(true) : ''}`}
        >
          <User size={20} className={profileHighlighted ? 'scale-110' : ''} />
          <span className={profileHighlighted ? 'font-bold underline decoration-accent decoration-2 underline-offset-2' : ''}>
            {user ? t('nav.account') : t('nav.signIn')}
          </span>
        </Link>
      </div>
    </nav>
  )
}
