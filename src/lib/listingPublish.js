import { supabase } from './supabase'

/** Remove a listing from the market (hard delete if never approved, soft withdraw if live). */
export async function withdrawListing(listingId) {
  const { error } = await supabase.rpc('landlord_withdraw_listing', { p_listing_id: listingId })
  if (error) throw error
}

/** Resubmit listing for admin review after changes were requested. */
export async function resubmitListingForReview(listingId) {
  const { error } = await supabase
    .from('listings')
    .update({ verification_status: 'pending', verification_notes: null })
    .eq('id', listingId)
  if (error) throw error
}
