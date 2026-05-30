import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'
import { profileNeedsSetup } from '../../lib/oauthStorage'
import { Skeleton } from '../ui/Skeleton'

export default function ProtectedRoute({ children, role, requireLandlordVerified = false }) {
  const { user, profile, loading, profileLoading, isBanned } = useAuth()
  const location = useLocation()

  if (loading || (user && profileLoading)) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-12">
        <Skeleton className="mb-6 h-8 w-48" />
        <Skeleton className="h-64 w-full" />
      </div>
    )
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  const emailConfirmed = user.email_confirmed_at || user.confirmed_at
  if (!emailConfirmed) {
    return (
      <Navigate
        to="/check-email"
        state={{ email: user.email }}
        replace
      />
    )
  }

  if (isBanned || profile?.is_banned) {
    return <Navigate to="/login?banned=1" replace />
  }

  if (profileNeedsSetup(profile)) {
    return <Navigate to="/complete-profile" replace />
  }

  if (role && profile && profile.role !== role) {
    if (profile.role === 'admin') return <Navigate to="/admin" replace />
    const redirect = profile.role === 'landlord' ? '/landlord' : '/student'
    return <Navigate to={redirect} replace />
  }

  if (
    requireLandlordVerified
    && profile?.role === 'landlord'
    && profile?.verification_status !== 'approved'
  ) {
    return <Navigate to="/landlord/verify" replace />
  }

  return children
}
