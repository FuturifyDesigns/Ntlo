/** Listing occupancy: available | rented | unavailable */

export function getListingOccupancy(listing) {
  if (listing?.occupancy_status) return listing.occupancy_status
  if (listing?.available === false) return 'unavailable'
  return 'available'
}

export function isListingOpenForApply(listing) {
  return getListingOccupancy(listing) === 'available'
}

export function isListingRented(listing) {
  return getListingOccupancy(listing) === 'rented'
}
