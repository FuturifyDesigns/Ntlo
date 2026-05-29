import { useMemo } from 'react'
import { useAuth } from './useAuth'
import { useTranslation } from './useTranslation'

export function useNavLinks() {
  const { user, isLandlord } = useAuth()
  const { t } = useTranslation()

  return useMemo(() => {
    const links = [
      { to: '/', label: t('nav.home') },
      { to: '/listings', label: t('nav.listings') },
      { to: '/universities', label: t('nav.universities') },
      { to: '/pricing', label: t('nav.pricing') },
    ]

    if (user && isLandlord) {
      links.push({ to: '/landlord', label: t('nav.myListings') })
    } else {
      links.push({ to: '/student', label: t('nav.saved') })
    }

    return links
  }, [user, isLandlord, t])
}

export function useDashboardPath() {
  const { user, isLandlord } = useAuth()
  if (!user) return '/login'
  return isLandlord ? '/landlord' : '/student'
}
