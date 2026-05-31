/** True when landlord picked a campus (including valid "other" university). */
export function isListingUniversityReady({
  universityId,
  customUniversityName,
  customUniversityCity,
}) {
  if (!universityId) return false
  if (universityId === 'other') {
    return Boolean(customUniversityName?.trim() && customUniversityCity?.trim())
  }
  return true
}
