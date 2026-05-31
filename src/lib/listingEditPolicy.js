import { getListingOccupancy } from './listingOccupancy'

/** Fields that change what students are applying for — locked during active tenancy or applications. */
export const MATERIAL_LISTING_FIELDS = [
  'price',
  'room_type',
  'gender_preference',
  'lat',
  'lng',
  'address',
  'area',
  'city',
  'nearest_university_id',
  'custom_university_name',
  'custom_university_city',
  'distance_to_campus',
  'amenities',
  'deposit_pula',
  'utilities_included',
]

export const ALWAYS_EDITABLE_FIELDS = [
  'title',
  'description',
  'house_rules',
  'whatsapp_number',
]

const ACTIVE_APPLICATION_STATUSES = ['submitted', 'under_review', 'changes_requested', 'accepted']

export function getListingEditPolicy(listing, { applications = [] } = {}) {
  if (!listing) {
    return { canSave: false, lockedFields: MATERIAL_LISTING_FIELDS, reason: 'unknown', messageKey: 'listingEdit.notFound' }
  }

  const occupancy = getListingOccupancy(listing)
  const activeApps = (applications || []).filter((a) => ACTIVE_APPLICATION_STATUSES.includes(a.status))
  const hasAccepted = activeApps.some((a) => a.status === 'accepted')
  const hasPending = activeApps.some((a) => ['submitted', 'under_review', 'changes_requested'].includes(a.status))

  if (occupancy === 'rented') {
    return {
      canSave: true,
      lockedFields: [...MATERIAL_LISTING_FIELDS],
      allowedFields: [...ALWAYS_EDITABLE_FIELDS],
      reason: 'rented',
      messageKey: 'listingEdit.rentedLocked',
      hintKey: 'listingEdit.rentedHint',
      activeApplications: activeApps.length,
    }
  }

  if (hasAccepted) {
    return {
      canSave: true,
      lockedFields: [...MATERIAL_LISTING_FIELDS],
      allowedFields: [...ALWAYS_EDITABLE_FIELDS],
      reason: 'acceptedTenant',
      messageKey: 'listingEdit.acceptedLocked',
      hintKey: 'listingEdit.acceptedHint',
      activeApplications: activeApps.length,
    }
  }

  if (hasPending) {
    return {
      canSave: true,
      lockedFields: [...MATERIAL_LISTING_FIELDS],
      allowedFields: [...ALWAYS_EDITABLE_FIELDS],
      reason: 'pendingApplications',
      messageKey: 'listingEdit.pendingLocked',
      hintKey: 'listingEdit.pendingHint',
      activeApplications: activeApps.length,
    }
  }

  if (occupancy === 'unavailable') {
    return {
      canSave: true,
      lockedFields: [],
      allowedFields: null,
      reason: null,
      messageKey: null,
      hintKey: 'listingEdit.unavailableHint',
      activeApplications: 0,
    }
  }

  return {
    canSave: true,
    lockedFields: [],
    allowedFields: null,
    reason: null,
    messageKey: null,
    activeApplications: 0,
  }
}

export function isFieldLocked(field, policy) {
  if (!policy?.lockedFields?.length) return false
  return policy.lockedFields.includes(field)
}

export function stripLockedFields(payload, policy) {
  if (!policy?.lockedFields?.length) return payload
  const next = { ...payload }
  for (const field of policy.lockedFields) {
    delete next[field]
  }
  return next
}

export function mapListingEditError(message) {
  if (!message) return null
  if (message.includes('LISTING_RENTED_LOCKED')) return 'rentedLocked'
  if (message.includes('LISTING_APPLICATION_LOCKED')) return 'pendingLocked'
  if (message.includes('LISTING_DELETE_RENTED')) return 'deleteRented'
  if (message.includes('LISTING_REVIEW_LOCKED')) return 'reviewLocked'
  return null
}
