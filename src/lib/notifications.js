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
  const { error } = await supabase
    .from('notifications')
    .update({ read_at: new Date().toISOString() })
    .eq('id', id)
  if (error) throw error
}

export async function markAllNotificationsRead() {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return
  const { error } = await supabase
    .from('notifications')
    .update({ read_at: new Date().toISOString() })
    .eq('user_id', user.id)
    .is('read_at', null)
  if (error) throw error
}

/** Route notifications to the right dashboard tab (HashRouter paths). */
export function notificationHref(notification, role) {
  if (!notification) return '/'

  const { type, link, entity_id: entityId } = notification
  const isLandlord = role === 'landlord'
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

    case 'admin_application':
      return isAdmin ? '/admin?tab=applications' : '/admin'

    case 'admin_review':
      return isAdmin ? '/admin?tab=reviews' : '/admin'

    case 'admin_verification':
      return isAdmin ? '/admin?tab=landlords' : '/admin'

    case 'review_posted':
      if (link?.startsWith('/listings/')) return link
      return '/'

    default:
      break
  }

  if (link?.startsWith('http')) return link
  if (link?.startsWith('/')) return link
  return link ? `/${link}` : '/'
}
