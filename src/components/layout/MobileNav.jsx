import { Link, useLocation } from 'react-router-dom'
import { Home, Search, Heart, User, GraduationCap, Building2 } from 'lucide-react'
import { useAuth } from '../../hooks/useAuth'
import { useTranslation } from '../../hooks/useTranslation'
import { useDashboardPath } from '../../hooks/useNavLinks'

export default function MobileNav() {
  const location = useLocation()
  const { user, isLandlord } = useAuth()
  const { t } = useTranslation()
  const dashboardPath = useDashboardPath()

  const tabs = [
    { to: '/', icon: Home, label: t('nav.home') },
    { to: '/listings', icon: Search, label: t('nav.browse') },
    { to: '/universities', icon: GraduationCap, label: t('nav.unis') },
    isLandlord
      ? { to: '/landlord', icon: Building2, label: t('nav.myListings') }
      : { to: '/student', icon: Heart, label: t('nav.saved') },
  ]

  const profileLink = user ? dashboardPath : '/login'

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 border-t border-border bg-surface md:hidden" aria-label="Mobile navigation">
      <div className="flex items-center justify-around py-2">
        {tabs.map(({ to, icon: Icon, label }) => {
          const active = location.pathname === to || (to !== '/' && location.pathname.startsWith(to))
          return (
            <Link
              key={to}
              to={to}
              className={`flex flex-col items-center gap-0.5 px-3 py-1 text-xs font-medium ${
                active ? 'text-accent' : 'text-muted'
              }`}
            >
              <Icon size={20} />
              {label}
            </Link>
          )
        })}
        <Link
          to={profileLink}
          className={`flex flex-col items-center gap-0.5 px-3 py-1 text-xs font-medium ${
            location.pathname.includes('landlord') ||
            location.pathname === '/student' ||
            location.pathname === '/login'
              ? 'text-accent'
              : 'text-muted'
          }`}
        >
          <User size={20} />
          {user ? t('nav.account') : t('nav.signIn')}
        </Link>
      </div>
    </nav>
  )
}
