import { supabase } from './supabase'

export async function fetchLandlordApplicationsForUser(landlordUserId) {
  const { data: rpcData, error: rpcError } = await supabase.rpc('get_landlord_applications')

  if (!rpcError && rpcData != null) {
    if (Array.isArray(rpcData)) {
      return { data: rpcData, error: null }
    }
    if (typeof rpcData === 'string') {
      try {
        const parsed = JSON.parse(rpcData)
        return { data: Array.isArray(parsed) ? parsed : [], error: null }
      } catch {
        /* fall through */
      }
    }
  }

  const { data: myListings, error: listingsError } = await supabase
    .from('listings')
    .select('id')
    .eq('landlord_id', landlordUserId)

  if (listingsError || !myListings?.length) {
    return { data: [], error: listingsError || rpcError }
  }

  const listingIds = myListings.map((l) => l.id)

  let { data, error } = await supabase
    .from('listing_applications')
    .select('*')
    .in('listing_id', listingIds)
    .order('created_at', { ascending: false })

  if (error || !data?.length) {
    const fallback = await supabase
      .from('listing_applications')
      .select('*')
      .eq('landlord_id', landlordUserId)
      .order('created_at', { ascending: false })
    data = fallback.data
    error = fallback.error
  }

  if (!data?.length) {
    return { data: [], error }
  }

  const [listingsRes, studentsRes, docsRes] = await Promise.all([
    supabase.from('listings').select('id, title, area, city, price, available, gender_preference, room_type').in('id', listingIds),
    supabase.from('profiles').select('id, full_name, phone, university_id, gender').in('id', [...new Set(data.map((a) => a.student_id))]),
    supabase.from('application_documents').select('id, application_id, doc_type, file_name, storage_path, created_at').in('application_id', data.map((a) => a.id)),
  ])

  const listingById = Object.fromEntries((listingsRes.data || []).map((l) => [l.id, l]))
  const studentById = Object.fromEntries((studentsRes.data || []).map((s) => [s.id, s]))
  const docsByApp = {}
  for (const doc of docsRes.data || []) {
    if (!docsByApp[doc.application_id]) docsByApp[doc.application_id] = []
    docsByApp[doc.application_id].push(doc)
  }

  return {
    data: data.map((row) => ({
      ...row,
      listing: listingById[row.listing_id] || null,
      student: studentById[row.student_id] || null,
      documents: docsByApp[row.id] || [],
    })),
    error: null,
  }
}
