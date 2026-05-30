import { supabase } from './supabase'

export async function getOrCreateConversation(listingId) {
  const { data, error } = await supabase.rpc('get_or_create_conversation', {
    p_listing_id: listingId,
  })
  if (error) throw error
  return data
}

export async function sendMessage(conversationId, body) {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const { data, error } = await supabase
    .from('messages')
    .insert({ conversation_id: conversationId, sender_id: user.id, body: body.trim() })
    .select('*')
    .single()
  if (error) throw error
  return data
}

export async function markMessagesRead(conversationId) {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return

  await supabase
    .from('messages')
    .update({ read_at: new Date().toISOString() })
    .eq('conversation_id', conversationId)
    .neq('sender_id', user.id)
    .is('read_at', null)
}

export async function createViewingRequest({ listingId, landlordId, preferredAt, message }) {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const { data, error } = await supabase
    .from('viewing_requests')
    .insert({
      listing_id: listingId,
      student_id: user.id,
      landlord_id: landlordId,
      preferred_at: preferredAt || null,
      message: message?.trim() || null,
    })
    .select('*')
    .single()
  if (error) throw error
  return data
}

export async function updateViewingRequest(id, updates) {
  const { data, error } = await supabase
    .from('viewing_requests')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select('*')
    .single()
  if (error) throw error
  return data
}

export async function submitApplication({ listingId, landlordId, moveInDate, durationMonths, introMessage }) {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const { data, error } = await supabase
    .from('listing_applications')
    .insert({
      listing_id: listingId,
      student_id: user.id,
      landlord_id: landlordId,
      move_in_date: moveInDate || null,
      duration_months: durationMonths ? Number(durationMonths) : null,
      intro_message: introMessage?.trim() || null,
    })
    .select('*')
    .single()
  if (error) throw error
  return data
}

export async function respondToApplication(applicationId, { accept, notes, depositPula, leaseStart, leaseEnd }) {
  const { data, error } = await supabase.rpc('respond_to_application', {
    p_application_id: applicationId,
    p_accept: accept,
    p_notes: notes || null,
    p_deposit_pula: depositPula ?? null,
    p_lease_start: leaseStart || null,
    p_lease_end: leaseEnd || null,
  })
  if (error) throw error
  return data
}

export async function updateLeaseFlow(id, updates) {
  const { data, error } = await supabase
    .from('lease_flows')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select('*')
    .single()
  if (error) throw error
  return data
}

export async function toggleChecklistItem(itemId, completed, userId) {
  const { data, error } = await supabase
    .from('move_in_checklist_items')
    .update(
      completed
        ? { completed_at: new Date().toISOString(), completed_by: userId }
        : { completed_at: null, completed_by: null }
    )
    .eq('id', itemId)
    .select('*')
    .single()
  if (error) throw error
  return data
}

export function isListingVerified(listing) {
  return Boolean(listing?.is_verified && listing?.verification_status !== 'rejected')
}

export function isLandlordVerified(listing) {
  return Boolean(
    listing?.landlord_verified
    || listing?.landlord?.is_verified
  )
}
