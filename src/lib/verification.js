/** Landlord identity documents (sign-up / account verification) */
export const LANDLORD_DOC_TYPES = [
  {
    id: 'national_id',
    required: true,
    labelKey: 'verification.docs.nationalId',
    descKey: 'verification.docs.nationalIdDesc',
    accept: 'image/*,.pdf',
  },
  {
    id: 'selfie_with_id',
    required: true,
    labelKey: 'verification.docs.selfieWithId',
    descKey: 'verification.docs.selfieWithIdDesc',
    accept: 'image/*',
  },
  {
    id: 'proof_of_ownership',
    required: false,
    labelKey: 'verification.docs.proofOfOwnership',
    descKey: 'verification.docs.proofOfOwnershipDesc',
    accept: 'image/*,.pdf',
    group: 'property_rights',
  },
  {
    id: 'proof_of_authority',
    required: false,
    labelKey: 'verification.docs.proofOfAuthority',
    descKey: 'verification.docs.proofOfAuthorityDesc',
    accept: 'image/*,.pdf',
    group: 'property_rights',
  },
  {
    id: 'proof_of_address',
    required: false,
    labelKey: 'verification.docs.proofOfAddress',
    descKey: 'verification.docs.proofOfAddressDesc',
    accept: 'image/*,.pdf',
  },
  {
    id: 'reib_registration',
    required: false,
    labelKey: 'verification.docs.reibRegistration',
    descKey: 'verification.docs.reibRegistrationDesc',
    accept: 'image/*,.pdf',
  },
]

/** Per-listing property proof (when publishing a room) */
export const LISTING_DOC_TYPES = [
  {
    id: 'property_rates_receipt',
    required: false,
    labelKey: 'verification.docs.propertyRates',
    descKey: 'verification.docs.propertyRatesDesc',
    accept: 'image/*,.pdf',
  },
  {
    id: 'utility_bill_property',
    required: false,
    labelKey: 'verification.docs.utilityBill',
    descKey: 'verification.docs.utilityBillDesc',
    accept: 'image/*,.pdf',
  },
  {
    id: 'title_deed_excerpt',
    required: false,
    labelKey: 'verification.docs.titleDeed',
    descKey: 'verification.docs.titleDeedDesc',
    accept: 'image/*,.pdf',
  },
]

export function landlordDocsComplete(uploadedTypes) {
  const set = new Set(uploadedTypes)
  const hasPropertyProof = set.has('proof_of_ownership') || set.has('proof_of_authority')
  return set.has('national_id') && set.has('selfie_with_id') && hasPropertyProof
}

export function getPostAuthPath(profile, fallback = '/') {
  if (!profile) return '/student'
  if (profile.is_banned) return '/login?banned=1'
  if (profile.role === 'admin') return '/admin'
  if (profile.role === 'landlord') {
    if (profile.verification_status !== 'approved') return '/landlord/verify'
    return fallback === '/' || fallback === '/login' ? '/landlord' : fallback
  }
  return fallback === '/' || fallback === '/login' ? '/student' : fallback
}

export function landlordCanList(profile) {
  return profile?.role === 'landlord' && profile?.verification_status === 'approved' && !profile?.is_banned
}
