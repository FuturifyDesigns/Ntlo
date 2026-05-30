import { isListingOpenForApply } from './listingOccupancy'

export function genderMatchesListing(studentGender, listingPreference) {
  const pref = listingPreference || 'any'
  if (pref === 'any') return true
  return studentGender === pref
}

export function canStudentApplyToListing(profile, listing) {
  if (!profile || profile.role !== 'student') {
    return { ok: false, reason: 'notStudent' }
  }
  if (!profile.gender) {
    return { ok: false, reason: 'genderRequired' }
  }
  if (!isListingOpenForApply(listing)) {
    return { ok: false, reason: 'unavailable' }
  }
  if (!genderMatchesListing(profile.gender, listing.gender_preference)) {
    return { ok: false, reason: 'genderMismatch', preference: listing.gender_preference }
  }
  return { ok: true }
}

export function getActiveRental(applications) {
  return (applications || []).find((a) => a.status === 'rented') || null
}

export function hasActiveRental(applications) {
  return Boolean(getActiveRental(applications))
}

export const STUDENT_GENDERS = [
  { value: 'male', labelKey: 'auth.genderMale' },
  { value: 'female', labelKey: 'auth.genderFemale' },
]
