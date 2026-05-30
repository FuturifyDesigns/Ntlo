import { supabase } from './supabase'
import { uploadApplicationDoc, APPLICATION_DOC_TYPES } from './applicationDocs'

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

export async function submitApplication({ listingId, landlordId, moveInDate, durationMonths, introMessage, documents }) {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const missing = APPLICATION_DOC_TYPES.filter((t) => !documents?.[t.id])
  if (missing.length) {
    throw new Error('Please upload all required documents before submitting.')
  }

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

  try {
    for (const { id: docType } of APPLICATION_DOC_TYPES) {
      await uploadApplicationDoc({
        applicationId: data.id,
        studentId: user.id,
        docType,
        file: documents[docType],
      })
    }
  } catch (uploadErr) {
    await supabase.from('listing_applications').delete().eq('id', data.id)
    throw uploadErr
  }

  return data
}

export async function respondToApplication(applicationId, { accept, notes }) {
  const { error } = await supabase.rpc('respond_to_application', {
    p_application_id: applicationId,
    p_accept: accept,
    p_notes: notes || null,
  })
  if (error) throw error
}

export async function markApplicationRented(applicationId) {
  const { error } = await supabase.rpc('mark_application_rented', {
    p_application_id: applicationId,
  })
  if (error) throw error
}

export async function withdrawApplication(applicationId) {
  const { error } = await supabase.rpc('withdraw_application', {
    p_application_id: applicationId,
  })
  if (error) throw error
}

export async function relistListing(listingId) {
  const { error } = await supabase.rpc('relist_listing', {
    p_listing_id: listingId,
  })
  if (error) throw error
}

export function mapHousingError(message) {
  if (!message) return 'Something went wrong'
  if (message.includes('female tenants only')) return 'genderMismatchFemale'
  if (message.includes('male tenants only')) return 'genderMismatchMale'
  if (message.includes('Add your gender')) return 'genderRequired'
  if (message.includes('no longer available')) return 'unavailable'
  if (message.includes('active application')) return 'duplicateApplication'
  return message
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
