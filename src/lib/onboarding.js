import { supabase } from './supabase'

export async function completeOnboarding() {
  const { error } = await supabase.rpc('complete_onboarding')
  if (error) throw error
}

export function needsOnboarding(profile) {
  return Boolean(profile?.id && !profile?.onboarding_completed_at)
}
