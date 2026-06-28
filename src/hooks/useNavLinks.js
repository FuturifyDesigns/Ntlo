import { useMemo } from 'react'
import { useAuth } from './useAuth'
import { useTranslation } from './useTranslation'

import { landlordNeedsVerificationIntro } from '../lib/verification'

export function useNavLinks() {
  const { user, isLandlord, isAdmin } = useAuth()
  const { t } = useTranslation()

  return useMemo(() => {
    const links = [
      { to: '/', label: t('nav.home') },
      { to: '/listings', label: t('nav.listings') },
      { to: '/universities', label: t('nav.universities') },
      { to: '/pricing', label: t('nav.pricing') },
    ]

    if (user && isAdmin) {
      links.push({ to: '/admin', label: t('nav.admin') })
    } else if (user && isLandlord) {
      links.push({ to: '/landlord', label: t('nav.myListings') })
    } else {
      links.push({ to: '/student', label: t('nav.saved') })
    }

    return links
  }, [user, isLandlord, isAdmin, t])
}

export function useDashboardPath() {
  const { user, isLandlord, isAdmin, profile } = useAuth()
  if (!user) return '/login'
  if (isAdmin) return '/admin'
  if (isLandlord && landlordNeedsVerificationIntro(profile)) return '/landlord/verify'
  return isLandlord ? '/landlord' : '/student'
}
