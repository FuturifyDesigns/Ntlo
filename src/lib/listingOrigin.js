/** Off-platform / web-imported listings (admin curated or classified feeds). */
export function isExternalListing(listing) {
  if (!listing) return false
  if (listing.listing_origin === 'external') return true
  if (typeof listing.id === 'string' && listing.id.startsWith('web-')) return true
  return false
}
