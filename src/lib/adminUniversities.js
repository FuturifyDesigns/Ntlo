import { supabase } from './supabase'
import {
  geocodeCampus,
  slugifyUniversity,
  normalizeUniversityName,
} from './geocodeUniversity'
import { validateFullUniversityName } from './universityNames'

export async function createUniversityFromRequest(request) {
  const fullName = normalizeUniversityName(request.name)
  const city = normalizeUniversityName(request.city)
  const validationError = validateFullUniversityName(fullName)
  if (validationError) {
    throw new Error('University name must be the full official name as shown on Google Maps (include University or College).')
  }

  const coords = await geocodeCampus({ name: fullName, city })
  if (!coords) {
    throw new Error('Could not locate this campus on Google Maps after searching across Botswana. The name looks valid — try approving again in a moment, or check the spelling matches Google Maps.')
  }

  const slug = slugifyUniversity(fullName)

  const { data, error } = await supabase.rpc('admin_create_university', {
    p_name: fullName,
    p_city: city,
    p_slug: slug,
    p_short_name: fullName,
    p_lat: coords.lat,
    p_lng: coords.lng,
    p_map_zoom: 15,
    p_request_id: request.id,
  })

  if (error) throw error
  return data
}
