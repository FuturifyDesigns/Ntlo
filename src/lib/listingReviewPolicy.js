/** Admin verification gate for landlord listing actions. */

export function getListingVerificationStatus(listing) {
  return listing?.verification_status || 'pending'
}

export function isListingApproved(listing) {
  return getListingVerificationStatus(listing) === 'approved'
}

export function isListingUnderReview(listing) {
  return ['pending', 'changes_requested'].includes(getListingVerificationStatus(listing))
}

export function listingNeedsResubmit(listing) {
  return ['changes_requested', 'rejected'].includes(getListingVerificationStatus(listing))
}

export function canLandlordMarkOccupancy(listing) {
  return isListingApproved(listing) && getListingVerificationStatus(listing) !== 'withdrawn'
}

export function getListingLandlordActions(listing) {
  const status = getListingVerificationStatus(listing)
  return {
    status,
    approved: status === 'approved',
    underReview: isListingUnderReview(listing),
    needsResubmit: listingNeedsResubmit(listing),
    canMarkOccupancy: canLandlordMarkOccupancy(listing),
    canEdit: true,
    canWithdraw: status !== 'withdrawn',
    editLabelKey: listingNeedsResubmit(listing) ? 'listingReview.fixAndResubmit' : 'dashboard.edit',
  }
}
