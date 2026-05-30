import { Link, useLocation } from 'react-router-dom'
import { Menu, X } from 'lucide-react'
import { useState } from 'react'
import { useAuth } from '../../hooks/useAuth'
import { useTranslation } from '../../hooks/useTranslation'
import { useNavLinks } from '../../hooks/useNavLinks'
import Button from '../ui/Button'
import NotificationBell from './NotificationBell'
import { usePresenceHeartbeat } from '../../hooks/usePresence'

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

  return (
    <header className="sticky top-0 z-40 border-b border-border/60 bg-surface/85 backdrop-blur-xl">
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
            <Link
              key={link.to}
              to={link.to}
              className={`relative rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
                isActive(link.to) ? 'text-primary' : 'text-muted hover:text-primary'
              }`}
            >
              {link.label}
              {isActive(link.to) && (
                <span className="absolute inset-x-3 -bottom-px h-px bg-accent" />
              )}
            </Link>
          ))}
        </nav>

        <div className="hidden items-center gap-2 md:flex">
          {user && <NotificationBell />}
          {user ? (
            <UserMenu />
          ) : (
            <Link to="/login" className="text-sm font-medium text-muted transition-colors hover:text-primary">
              {t('nav.signIn')}
            </Link>
          )}
          <Button as={Link} to={isLandlord ? '/landlord/listings/new' : '/register?role=landlord'} size="sm">
            {t('nav.listPlace')}
          </Button>
        </div>

        <div className="flex items-center gap-1 md:hidden">
          {user && <NotificationBell />}
          {user && <UserMenu onNavigate={() => setOpen(false)} />}
          <button
            className="rounded-lg p-2 text-primary"
            onClick={() => setOpen(!open)}
            aria-label="Toggle menu"
            aria-expanded={open}
          >
            {open ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      {open && (
        <div className="border-t border-border bg-surface px-4 py-4 md:hidden">
          <nav className="flex flex-col gap-1">
            {navLinks.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                onClick={() => setOpen(false)}
                className={`rounded-lg px-3 py-2.5 text-sm font-medium ${
                  isActive(link.to) ? 'bg-primary/5 text-primary' : 'text-muted hover:bg-background'
                }`}
              >
                {link.label}
              </Link>
            ))}
            {!user && (
              <Link
                to="/login"
                onClick={() => setOpen(false)}
                className="rounded-lg px-3 py-2.5 text-sm font-medium text-primary hover:bg-background"
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
