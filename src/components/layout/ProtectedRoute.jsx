import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'
import { profileNeedsSetup } from '../../lib/oauthStorage'
import { Skeleton } from '../ui/Skeleton'

export default function ProtectedRoute({ children, role }) {
  const { user, profile, loading } = useAuth()
  const location = useLocation()

  if (loading) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-12">
        <Skeleton className="h-8 w-48 mb-6" />
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

  if (profileNeedsSetup(profile)) {
    return <Navigate to="/complete-profile" replace />
  }

  if (role && profile?.role !== role) {
    const redirect = profile?.role === 'landlord' ? '/landlord' : '/student'
    return <Navigate to={redirect} replace />
  }

  return children
}
