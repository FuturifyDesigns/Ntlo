import { supabase } from './supabase'

const BUCKET = 'verification-docs'

export async function uploadVerificationDoc({ userId, listingId, docType, file }) {
  const folder = listingId ? `${userId}/listings/${listingId}` : userId
  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_')
  const path = `${folder}/${docType}/${Date.now()}-${safeName}`

  const { error: uploadError } = await supabase.storage
    .from(BUCKET)
    .upload(path, file, { upsert: false, contentType: file.type || undefined })

  if (uploadError) throw uploadError

  const { data, error } = await supabase
    .from('verification_documents')
    .insert({
      user_id: userId,
      listing_id: listingId || null,
      doc_type: docType,
      storage_path: path,
      file_name: file.name,
      status: 'pending',
    })
    .select()
    .single()

  if (error) throw error
  return data
}

export async function getSignedDocUrl(storagePath, expiresIn = 3600) {
  const { data, error } = await supabase.storage
    .from(BUCKET)
    .createSignedUrl(storagePath, expiresIn)
  if (error) throw error
  return data.signedUrl
}

export async function fetchUserVerificationDocs(userId) {
  const { data, error } = await supabase
    .from('verification_documents')
    .select('*')
    .eq('user_id', userId)
    .is('listing_id', null)
    .order('created_at', { ascending: false })
  if (error) throw error
  return data || []
}

export async function fetchListingVerificationDocs(listingId) {
  const { data, error } = await supabase
    .from('verification_documents')
    .select('*')
    .eq('listing_id', listingId)
    .order('created_at', { ascending: false })
  if (error) throw error
  return data || []
}

export async function submitLandlordVerification(userId) {
  const { error } = await supabase
    .from('profiles')
    .update({ verification_status: 'pending' })
    .eq('id', userId)
    .eq('role', 'landlord')
  if (error) throw error
}
