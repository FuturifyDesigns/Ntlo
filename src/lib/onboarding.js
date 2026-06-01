import { supabase } from './supabase'
import { allRequiredPagesDone, getEffectiveRequiredPages } from './onboardingRoutes'

export async function completeOnboardingPage(pageKey) {
  const { data, error } = await supabase.rpc('complete_onboarding_page', { p_page: pageKey })
  if (error) throw error
  return data || {}
}

export async function completeOnboarding() {
  const { error } = await supabase.rpc('complete_onboarding')
  if (error) throw error
}

export function needsOnboarding(profile) {
  return Boolean(profile?.id && !profile?.onboarding_completed_at)
}

export function shouldFinalizeOnboarding(profile, progressPatch, options = {}) {
  if (!profile?.role) return false
  const merged = { ...(profile.onboarding_progress || {}), ...progressPatch }
  const required = getEffectiveRequiredPages(profile.role, options)
  return required.every((key) => Boolean(merged[key]))
}

export { allRequiredPagesDone }
