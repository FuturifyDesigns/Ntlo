import { Navigate } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'
import { profileNeedsSetup } from '../../lib/oauthStorage'
import { Skeleton } from '../ui/Skeleton'

export default function OAuthSetupRoute({ children }) {
  const { user, profile, loading } = useAuth()

  if (loading) {
    return (
      <div className="mx-auto max-w-md px-4 py-12">
        <Skeleton className="mx-auto mb-4 h-16 w-48" />
        <Skeleton className="h-64 w-full" />
      </div>
    )
  }

  if (!user) {
    return <Navigate to="/register" replace />
  }

  if (!profileNeedsSetup(profile)) {
    const destination = profile?.role === 'landlord' ? '/landlord' : '/student'
    return <Navigate to={destination} replace />
  }

  return children
}
