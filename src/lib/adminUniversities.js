import imageCompression from 'browser-image-compression'
import { supabase } from './supabase'
import {
  geocodeCampus,
  slugifyUniversity,
  normalizeUniversityName,
} from './geocodeUniversity'
import { validateFullUniversityName } from './universityNames'
import { getGoogleGeocoder } from './googleGeocoder'
import { fetchCampusNearbyAreas } from './campusNearbyAreas'

async function resolveCampusCoords(name, city) {
  const coords = await geocodeCampus({ name, city })
  if (!coords) return null

  const geocoder = await getGoogleGeocoder()
  const nearbyAreas = geocoder
    ? await fetchCampusNearbyAreas(geocoder, coords.lat, coords.lng)
    : []

  return {
    lat: coords.lat,
    lng: coords.lng,
    formattedAddress: coords.formatted || '',
    geocodeSource: coords.source || 'google',
    nearbyAreas,
  }
}

/** Geocode a request and return an editable draft — does not publish yet. */
export async function prepareUniversityDraft(request) {
  const fullName = normalizeUniversityName(request.name)
  const city = normalizeUniversityName(request.city)
  const validationError = validateFullUniversityName(fullName)
  if (validationError) {
    throw new Error('University name must be the full official name as shown on Google Maps (include University or College).')
  }

  const resolved = await resolveCampusCoords(fullName, city)
  if (!resolved) {
    throw new Error('Could not locate this campus on Google Maps after searching across Botswana. Try again — we search many name and city variants automatically.')
  }

  return {
    requestId: request.id,
    contactEmail: request.contact_email || '',
    name: fullName,
    shortName: fullName,
    city,
    slug: slugifyUniversity(fullName),
    lat: resolved.lat,
    lng: resolved.lng,
    mapZoom: 15,
    nearbyAreas: resolved.nearbyAreas,
    formattedAddress: resolved.formattedAddress,
    geocodeSource: resolved.geocodeSource,
    imageFile: null,
    imagePreviewUrl: null,
  }
}

/** Re-run geocoding when admin edits name or city in the preview modal. */
export async function refreshUniversityDraftCoords(draft) {
  const name = normalizeUniversityName(draft.name)
  const city = normalizeUniversityName(draft.city)
  const validationError = validateFullUniversityName(name)
  if (validationError) {
    throw new Error('University name must be the full official name as shown on Google Maps (include University or College).')
  }

  const resolved = await resolveCampusCoords(name, city)
  if (!resolved) {
    throw new Error('Could not locate this campus on Google Maps. Adjust the name or city and try again.')
  }

  return {
    ...draft,
    name,
    city,
    slug: slugifyUniversity(name),
    lat: resolved.lat,
    lng: resolved.lng,
    nearbyAreas: resolved.nearbyAreas,
    formattedAddress: resolved.formattedAddress,
    geocodeSource: resolved.geocodeSource,
  }
}

/** Refresh nearby suburb names when the admin drags the map pin. */
export async function refreshNearbyAreasForPin(draft, lat, lng) {
  const geocoder = await getGoogleGeocoder()
  const nearbyAreas = geocoder ? await fetchCampusNearbyAreas(geocoder, lat, lng) : draft.nearbyAreas
  return {
    ...draft,
    lat,
    lng,
    nearbyAreas: nearbyAreas.length ? nearbyAreas : draft.nearbyAreas,
  }
}

async function uploadUniversityPhoto(slug, file) {
  const compressed = await imageCompression(file, {
    maxSizeMB: 0.35,
    maxWidthOrHeight: 1400,
    useWebWorker: true,
  })
  const fileName = `universities/${slug}/cover-${Date.now()}.jpg`
  const { error: uploadError } = await supabase.storage
    .from('listing-photos')
    .upload(fileName, compressed, { upsert: true })
  if (uploadError) throw uploadError

  const { data: { publicUrl } } = supabase.storage.from('listing-photos').getPublicUrl(fileName)
  return publicUrl
}

/** Save the reviewed draft — goes live for everyone (realtime). */
export async function publishUniversityDraft(draft) {
  const name = normalizeUniversityName(draft.name)
  const city = normalizeUniversityName(draft.city)
  const validationError = validateFullUniversityName(name)
  if (validationError) {
    throw new Error('University name must be the full official name as shown on Google Maps (include University or College).')
  }

  let imageUrl = draft.imagePreviewUrl?.startsWith('http') && !draft.imageFile
    ? draft.imagePreviewUrl
    : null

  if (draft.imageFile) {
    imageUrl = await uploadUniversityPhoto(draft.slug || slugifyUniversity(name), draft.imageFile)
  }

  const nearbyAreas = (draft.nearbyAreas || [])
    .map((a) => a.trim())
    .filter(Boolean)

  const { data, error } = await supabase.rpc('admin_create_university', {
    p_name: name,
    p_city: city,
    p_slug: draft.slug || slugifyUniversity(name),
    p_short_name: normalizeUniversityName(draft.shortName || name),
    p_lat: draft.lat,
    p_lng: draft.lng,
    p_map_zoom: draft.mapZoom ?? 15,
    p_request_id: draft.requestId,
    p_nearby_areas: nearbyAreas,
    p_image_url: imageUrl,
  })

  if (error) throw error
  return data
}

/** Build an editable draft from an existing university row. */
export function prepareUniversityEditDraft(uni) {
  return {
    id: uni.id,
    requestId: null,
    name: uni.name,
    shortName: uni.short_name || uni.name,
    city: uni.city,
    slug: uni.slug,
    lat: Number(uni.lat),
    lng: Number(uni.lng),
    mapZoom: uni.map_zoom ?? 15,
    nearbyAreas: [...(uni.nearby_areas || [])],
    formattedAddress: '',
    geocodeSource: 'saved',
    imageFile: null,
    imagePreviewUrl: uni.image_url || uni.image || null,
  }
}

/** Update an existing university — changes sync everywhere via realtime. */
export async function updateUniversityDraft(draft) {
  if (!draft.id) throw new Error('Missing university id')

  const name = normalizeUniversityName(draft.name)
  const city = normalizeUniversityName(draft.city)
  const validationError = validateFullUniversityName(name)
  if (validationError) {
    throw new Error('University name must be the full official name as shown on Google Maps (include University or College).')
  }

  const slug = slugifyUniversity(name)
  let imageUrl = draft.imagePreviewUrl?.startsWith('http') && !draft.imageFile
    ? draft.imagePreviewUrl
    : null

  if (draft.imageFile) {
    imageUrl = await uploadUniversityPhoto(slug, draft.imageFile)
  }

  const nearbyAreas = (draft.nearbyAreas || [])
    .map((a) => a.trim())
    .filter(Boolean)

  const { data, error } = await supabase.rpc('admin_update_university', {
    p_id: draft.id,
    p_name: name,
    p_city: city,
    p_slug: slug,
    p_short_name: normalizeUniversityName(draft.shortName || name),
    p_lat: draft.lat,
    p_lng: draft.lng,
    p_map_zoom: draft.mapZoom ?? 15,
    p_nearby_areas: nearbyAreas,
    p_image_url: imageUrl,
  })

  if (error) throw error
  return data
}

/** Remove a university; linked listings and student profiles are unlinked first. */
export async function deleteUniversity(id) {
  const { data, error } = await supabase.rpc('admin_delete_university', { p_id: id })
  if (error) throw error
  return data
}
