import { Link, useLocation } from 'react-router-dom'
import { Menu, X } from 'lucide-react'
import { useState } from 'react'
import { useAuth } from '../../hooks/useAuth'
import { useTranslation } from '../../hooks/useTranslation'
import { useNavLinks } from '../../hooks/useNavLinks'
import Button from '../ui/Button'
import NotificationBell from './NotificationBell'
import UserMenu from './UserMenu'
import PingNavButton from '../ping/PingNavButton'
import { usePingTransition } from '../../context/PingTransitionContext'
import { usePresenceHeartbeat } from '../../hooks/usePresence'
import { onboardingNavClass, useOnboardingNavHighlight } from '../../hooks/useOnboardingNavHighlight'

function NavbarLink({
  to, label, darkNav, active, onClick, className = '',
}) {
  const highlighted = useOnboardingNavHighlight(to)
  return (
    <Link
      to={to}
      onClick={onClick}
      className={`${className} ${onboardingNavClass(highlighted, { active, darkNav })}`}
    >
      {label}
      {active && (
        <span className="absolute inset-x-3 -bottom-px h-px bg-accent" />
      )}
    </Link>
  )
}

export default function Navbar() {
  const [open, setOpen] = useState(false)
  const { user, isLandlord } = useAuth()
  usePresenceHeartbeat()
  const { t } = useTranslation()
  const location = useLocation()
  const navLinks = useNavLinks()

  const isActive = (path) => {
    if (path === '/') return location.pathname === '/'
    return location.pathname === path || location.pathname.startsWith(`${path}/`)
  }

  const { transitionActive } = usePingTransition()
  const onPingPage = location.pathname === '/ping'
  const darkNav = onPingPage || transitionActive

  return (
    <header className={`sticky top-0 z-40 border-b ${
      darkNav
        ? 'border-white/10 bg-black'
        : 'border-border/60 bg-surface/85 backdrop-blur-xl'
    }`}>
      <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-3 sm:h-16 sm:px-6 lg:h-[4.25rem] lg:px-8">
        <Link to="/" className="flex shrink-0 items-center py-1">
          <img
            src={`${import.meta.env.BASE_URL}logo-brand.png`}
            alt="Ntlo"
            className="h-11 w-auto object-contain sm:h-14 lg:h-[4.25rem]"
          />
        </Link>

        <nav className="hidden items-center gap-0.5 md:flex" aria-label="Main navigation">
          {navLinks.map((link) => (
            <NavbarLink
              key={link.to}
              to={link.to}
              label={link.label}
              darkNav={darkNav}
              active={isActive(link.to)}
              className={`relative rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
                darkNav
                  ? isActive(link.to) ? 'text-white' : 'text-white/60 hover:text-white'
                  : isActive(link.to) ? 'text-primary' : 'text-muted hover:text-primary'
              }`}
            />
          ))}
          <div className={`ml-2 pl-2 border-l ${darkNav ? 'border-white/15' : 'border-border/60'}`}>
            <PingNavButton />
          </div>
        </nav>

        <div className="flex items-center gap-1 sm:gap-2">
          <div className="md:hidden">
            <PingNavButton compact />
          </div>
          {user && <NotificationBell />}

          <div className="hidden items-center gap-2 md:flex">
            {user ? (
              <UserMenu />
            ) : (
              <Link to="/login" className={`text-sm font-medium transition-colors ${
                darkNav ? 'text-white/70 hover:text-white' : 'text-muted hover:text-primary'
              }`}>
                {t('nav.signIn')}
              </Link>
            )}
            <Button as={Link} to={isLandlord ? '/landlord/listings/new' : '/register?role=landlord'} size="sm">
              {t('nav.listPlace')}
            </Button>
          </div>

          <div className="flex items-center gap-1 md:hidden">
            {user && <UserMenu onNavigate={() => setOpen(false)} />}
            <button
              className={`rounded-lg p-2 ${darkNav ? 'text-white' : 'text-primary'}`}
              onClick={() => setOpen(!open)}
              aria-label="Toggle menu"
              aria-expanded={open}
            >
              {open ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>
      </div>

      {open && (
        <div className={`border-t px-4 py-4 md:hidden ${
          darkNav ? 'border-white/10 bg-black' : 'border-border bg-surface'
        }`}>
          <nav className="flex flex-col gap-1">
            {navLinks.map((link) => (
              <NavbarLink
                key={link.to}
                to={link.to}
                label={link.label}
                darkNav={darkNav}
                active={isActive(link.to)}
                onClick={() => setOpen(false)}
                className={`rounded-lg px-3 py-2.5 text-sm font-medium ${
                  darkNav
                    ? isActive(link.to) ? 'bg-white/10 text-white' : 'text-white/65 hover:bg-white/5 hover:text-white'
                    : isActive(link.to) ? 'bg-primary/5 text-primary' : 'text-muted hover:bg-background'
                }`}
              />
            ))}
            <div className="px-3 py-2">
              <PingNavButton compact onNavigate={() => setOpen(false)} />
            </div>
            {!user && (
              <Link
                to="/login"
                onClick={() => setOpen(false)}
                className={`rounded-lg px-3 py-2.5 text-sm font-medium ${
                  darkNav ? 'text-white/70 hover:bg-white/5 hover:text-white' : 'text-primary hover:bg-background'
                }`}
              >
                {t('nav.signIn')}
              </Link>
            )}
            <Button
              as={Link}
              to={isLandlord ? '/landlord/listings/new' : '/register?role=landlord'}
              className="mt-2 w-full"
              onClick={() => setOpen(false)}
            >
              {t('nav.listPlace')}
            </Button>
          </nav>
        </div>
      )}
    </header>
  )
}
