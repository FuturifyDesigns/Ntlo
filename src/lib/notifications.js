import { supabase } from './supabase'

export async function fetchNotifications(limit = 30) {
  const { data, error } = await supabase
    .from('notifications')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limit)
  if (error) throw error
  return data || []
}

export async function markNotificationRead(id) {
  const { error } = await supabase.rpc('mark_notification_read', {
    p_notification_id: id,
  })
  if (error) throw error
}

export async function markAllNotificationsRead() {
  const { error } = await supabase.rpc('mark_all_notifications_read')
  if (error) throw error
}

/** Route notifications to the right dashboard tab (HashRouter paths). */
export function notificationHref(notification, role) {
  if (!notification) return '/'

  const { type, link, entity_id: entityId } = notification
  const linkIsLandlord = typeof link === 'string' && link.includes('/landlord')
  const linkIsStudent = typeof link === 'string' && link.includes('/student')
  const isLandlord = role === 'landlord' || (linkIsLandlord && !linkIsStudent)
  const isAdmin = role === 'admin'

  switch (type) {
    case 'message':
      if (isLandlord) {
        return entityId ? `/landlord?tab=messages&chat=${entityId}` : '/landlord?tab=messages'
      }
      return entityId ? `/student?tab=messages&chat=${entityId}` : '/student?tab=messages'

    case 'viewing_request':
    case 'viewing_cancelled':
      return isLandlord ? '/landlord?tab=viewings' : '/student?tab=viewings'

    case 'viewing_confirmed':
    case 'viewing_declined':
      return '/student?tab=viewings'

    case 'application_submitted':
    case 'application_withdrawn':
      return isLandlord ? '/landlord?tab=applications' : '/student?tab=applications'

    case 'application_accepted':
    case 'application_rejected':
      return '/student?tab=applications'

    case 'application_changes_requested':
      if (link?.startsWith('/listings/')) return link
      return '/student?tab=applications'

    case 'listing_submitted':
      return isLandlord ? '/landlord' : '/'

    case 'listing_approved':
      if (entityId) return `/listings/${entityId}`
      return isLandlord ? '/landlord' : '/'

    case 'listing_rejected':
    case 'listing_changes_requested':
      if (entityId && isLandlord) return `/landlord/listings/${entityId}/edit`
      return isLandlord ? '/landlord' : '/'

    case 'listing_admin_removed':
      return isLandlord ? '/guidelines' : '/'

    case 'admin_listing_review':
    case 'admin_listing_removed':
      return isAdmin ? '/admin?tab=listings' : '/admin'

    case 'admin_application':
      return isAdmin ? '/admin?tab=applications' : '/admin'

    case 'admin_review':
      return isAdmin ? '/admin?tab=reviews' : '/admin'

    case 'admin_verification':
      return isAdmin ? '/admin?tab=landlords' : '/admin'

    case 'account_unbanned':
    case 'account_banned':
      return '/guidelines'

    case 'review_posted':
      if (link?.startsWith('/listings/')) return link
      if (entityId) return `/listings/${entityId}`
      return '/'

    default:
      break
  }

  if (link?.startsWith('http')) return link
  if (link === '/landlord') {
    if (type?.includes('application')) return '/landlord?tab=applications'
    if (type?.includes('viewing')) return '/landlord?tab=viewings'
    if (type?.includes('listing')) return '/landlord'
    if (type === 'message') return '/landlord?tab=messages'
    return '/landlord'
  }
  if (link?.startsWith('/listings/')) return link
  if (link?.startsWith('/')) return link
  return link ? `/${link}` : '/'
}

/** HashRouter-safe navigation to a notification target. */
export function navigateToNotification(navigate, notification, role) {
  const href = notificationHref(notification, role)
  if (href.startsWith('http')) {
    window.open(href, '_blank', 'noopener,noreferrer')
    return
  }
  const qIndex = href.indexOf('?')
  const navOptions = { state: { fromNotification: notification?.id } }
  if (qIndex === -1) {
    navigate(href, navOptions)
    return
  }
  navigate(
    { pathname: href.slice(0, qIndex), search: href.slice(qIndex) },
    navOptions
  )
}
