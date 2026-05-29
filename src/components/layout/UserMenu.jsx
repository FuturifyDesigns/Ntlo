import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ChevronDown, LogOut, Heart, Home } from 'lucide-react'
import { useAuth } from '../../hooks/useAuth'
import { useTranslation } from '../../hooks/useTranslation'
import { cn } from '../../lib/utils'

function getInitials(name, email) {
  if (name?.trim()) {
    return name
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map((part) => part[0])
      .join('')
      .toUpperCase()
  }
  return email?.[0]?.toUpperCase() || '?'
}

export default function UserMenu({ onNavigate, className }) {
  const { user, profile, signOut, isLandlord } = useAuth()
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)
  const rootRef = useRef(null)

  const dashboardPath = isLandlord ? '/landlord' : '/student'
  const firstName = profile?.full_name?.split(' ')[0] || t('nav.account')
  const initials = getInitials(profile?.full_name, user?.email)

  useEffect(() => {
    function handleClickOutside(event) {
      if (rootRef.current && !rootRef.current.contains(event.target)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  async function handleSignOut() {
    setOpen(false)
    onNavigate?.()
    await signOut()
    navigate('/')
  }

  function closeAndNavigate() {
    setOpen(false)
    onNavigate?.()
  }

  if (!user) return null

  return (
    <div ref={rootRef} className={cn('relative', className)}>
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="flex items-center gap-2 rounded-full border border-border bg-background py-1 pl-1 pr-2.5 transition-colors hover:border-accent/40 hover:bg-surface"
        aria-expanded={open}
        aria-haspopup="menu"
      >
        {profile?.avatar_url ? (
          <img
            src={profile.avatar_url}
            alt=""
            className="h-8 w-8 rounded-full object-cover"
          />
        ) : (
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-accent/20 text-xs font-bold text-primary">
            {initials}
          </span>
        )}
        <span className="max-w-[7rem] truncate text-sm font-semibold text-primary">{firstName}</span>
        <ChevronDown
          size={16}
          className={cn('text-muted transition-transform', open && 'rotate-180')}
        />
      </button>

      {open && (
        <div
          role="menu"
          className="absolute right-0 top-[calc(100%+0.5rem)] z-50 min-w-[12rem] overflow-hidden rounded-xl border border-border bg-surface py-1 shadow-xl"
        >
          <div className="border-b border-border px-4 py-3">
            <p className="truncate text-sm font-semibold text-primary">{profile?.full_name || firstName}</p>
            <p className="truncate text-xs text-muted">{user.email}</p>
            <p className="mt-1 text-[10px] font-semibold uppercase tracking-wider text-accent">
              {isLandlord ? t('nav.roleLandlord') : t('nav.roleStudent')}
            </p>
          </div>

          <Link
            to={dashboardPath}
            role="menuitem"
            onClick={closeAndNavigate}
            className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-primary hover:bg-background"
          >
            {isLandlord ? <Home size={16} /> : <Heart size={16} />}
            {isLandlord ? t('nav.myListings') : t('nav.saved')}
          </Link>

          <button
            type="button"
            role="menuitem"
            onClick={handleSignOut}
            className="flex w-full items-center gap-2.5 px-4 py-2.5 text-left text-sm text-error hover:bg-background"
          >
            <LogOut size={16} />
            {t('nav.signOut')}
          </button>
        </div>
      )}
    </div>
  )
}
