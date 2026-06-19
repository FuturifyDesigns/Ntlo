/** Merge a realtime listing row without letting view-count bumps refresh updated_at. */
export function mergeListingRow(prev, next) {
  if (!prev) return next
  if (!next) return prev

  const merged = { ...prev, ...next }
  const viewsOnlyBump = Number(prev.views) !== Number(next.views)
    && prev.title === next.title
    && prev.description === next.description
    && prev.price === next.price
    && prev.room_type === next.room_type
    && prev.gender_preference === next.gender_preference
    && prev.house_rules === next.house_rules
    && prev.whatsapp_number === next.whatsapp_number
    && prev.verification_status === next.verification_status
    && prev.is_verified === next.is_verified
    && prev.landlord_verified === next.landlord_verified
    && prev.verification_notes === next.verification_notes
    && prev.address === next.address
    && prev.area === next.area
    && prev.city === next.city

  if (viewsOnlyBump) {
    merged.updated_at = prev.updated_at
  }

  return merged
}
