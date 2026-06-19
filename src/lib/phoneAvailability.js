import { supabase } from './supabase'

/** Server-side check — required because profile phone is not visible across accounts via RLS. */
export async function checkPhoneAvailable(phone, excludeUserId = null) {
  if (!phone?.trim()) return false

  const { data, error } = await supabase.rpc('is_phone_available', {
    p_phone: phone,
    p_exclude_user_id: excludeUserId,
  })

  if (error) throw error
  return data === true
}
