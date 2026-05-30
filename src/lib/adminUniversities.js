import { supabase } from './supabase'
import {
  geocodeCampus,
  slugifyUniversity,
  makeUniversityShortName,
} from './geocodeUniversity'

export async function createUniversityFromRequest(request) {
  const coords = await geocodeCampus({ name: request.name, city: request.city })
  if (!coords) {
    throw new Error('Could not find this campus on the map. Check the name and city, then try again.')
  }

  const slug = slugifyUniversity(request.name)
  const shortName = makeUniversityShortName(request.name)

  const { data, error } = await supabase.rpc('admin_create_university', {
    p_name: request.name.trim(),
    p_city: request.city.trim(),
    p_slug: slug,
    p_short_name: shortName,
    p_lat: coords.lat,
    p_lng: coords.lng,
    p_map_zoom: 15,
    p_request_id: request.id,
  })

  if (error) throw error
  return data
}
