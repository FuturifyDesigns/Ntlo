/** Show "recently updated" when landlord edited after initial publish window. */
export const RECENTLY_UPDATED_MS = 7 * 24 * 60 * 60 * 1000
const MIN_EDIT_GAP_MS = 15 * 60 * 1000

export function isListingRecentlyUpdated(listing) {
  if (!listing?.updated_at) return false

  const updatedAt = new Date(listing.updated_at).getTime()
  const createdAt = listing.created_at ? new Date(listing.created_at).getTime() : 0

  if (!Number.isFinite(updatedAt)) return false
  if (Date.now() - updatedAt > RECENTLY_UPDATED_MS) return false

  if (createdAt && updatedAt - createdAt < MIN_EDIT_GAP_MS) return false

  return true
}

export function listingUpdatedAtMs(listing) {
  const ts = listing?.updated_at ? new Date(listing.updated_at).getTime() : 0
  return Number.isFinite(ts) ? ts : 0
}
