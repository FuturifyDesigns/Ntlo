import { supabase } from './supabase'

/** Remove a failed first-time signup so the email can be used again. */
export async function abandonIncompleteSignup(client = supabase) {
  try {
    await client.rpc('abandon_incomplete_signup')
  } catch {
    // Best effort — profile may already be gone or complete.
  }
  try {
    await client.auth.signOut()
  } catch {
    // Session may already be cleared.
  }
}
