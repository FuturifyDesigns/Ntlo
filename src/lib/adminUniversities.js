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
    throw new Error('Could not find this campus on the map. Check the full name and city match Google Maps, then try again.')
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
