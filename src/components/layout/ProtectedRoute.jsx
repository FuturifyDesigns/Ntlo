import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'
import { isBanActive, shouldBlockLogin } from '../../lib/bans'
import { isEmailVerifiedForAccess, profileNeedsSetup } from '../../lib/oauthStorage'
import { Skeleton } from '../ui/Skeleton'

export default function ProtectedRoute({ children, role, requireLandlordVerified = false }) {
  const { user, profile, loading, profileLoading } = useAuth()
  const location = useLocation()

  if (loading || (user && !profile && profileLoading)) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-5 sm:px-6 sm:py-8 lg:px-8">
        <Skeleton className="mb-6 h-9 w-56" />
        <Skeleton className="mb-4 h-5 w-40" />
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="aspect-[4/3] w-full" />
          ))}
        </div>
      </div>
    )
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  if (!isEmailVerifiedForAccess(user)) {
    return (
      <Navigate
        to="/check-email"
        state={{ email: user.email }}
        replace
      />
    )
  }

  if (shouldBlockLogin(profile)) {
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
