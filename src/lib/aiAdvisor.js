import { supabase } from './supabase'
import { analyzeListing, compareListings, coachLandlordListing } from './listingAdvisor'

export const AI_ADVISOR_ENABLED = import.meta.env.VITE_AI_ADVISOR_ENABLED === 'true'

function localSummary(type, payload) {
  if (type === 'listing') {
    const analysis = analyzeListing(payload.listing, payload.context)
    return { analysis, source: 'local' }
  }
  if (type === 'compare') {
    return { comparison: compareListings(payload.listings, payload.context), source: 'local' }
  }
  if (type === 'landlord') {
    return { coach: coachLandlordListing(payload.form, payload.options), source: 'local' }
  }
  return null
}

export async function fetchAiAdvisorSummary(type, payload) {
  const local = localSummary(type, payload)

  if (!AI_ADVISOR_ENABLED) {
    return { ...local, aiText: null }
  }

  try {
    const { data, error } = await supabase.functions.invoke('ai-advisor', {
      body: { type, payload, local },
    })

    if (error || !data?.text) {
      return { ...local, aiText: null }
    }

    return { ...local, aiText: data.text, source: 'ai' }
  } catch {
    return { ...local, aiText: null }
  }
}

export function getScoreColor(score) {
  if (score >= 85) return 'text-success'
  if (score >= 70) return 'text-accent'
  if (score >= 55) return 'text-amber-600'
  return 'text-error'
}

export function getScoreRingColor(score) {
  if (score >= 85) return 'stroke-success'
  if (score >= 70) return 'stroke-accent'
  if (score >= 55) return 'stroke-amber-500'
  return 'stroke-error'
}
