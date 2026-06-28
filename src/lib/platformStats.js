import { supabase } from './supabase'

const EMPTY = {
  students: 0,
  landlords: 0,
  listings: 0,
  campuses_with_listings: 0,
}

/** Public aggregate counts only — no profile rows or PII. */
export async function fetchPublicPlatformStats() {
  const { data, error } = await supabase.rpc('get_public_platform_stats')
  if (error) throw error
  return { ...EMPTY, ...(data || {}) }
}
