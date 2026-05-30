import { Navigate } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'
import { profileNeedsSetup } from '../../lib/oauthStorage'
import { getPostAuthPath } from '../../lib/verification'
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
    return <Navigate to={getPostAuthPath(profile)} replace />
  }

  return children
}
