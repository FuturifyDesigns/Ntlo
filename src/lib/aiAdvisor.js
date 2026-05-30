import { supabase } from './supabase'
import { analyzeListing, compareListings, coachLandlordListing, buildListingInsightSummary } from './listingAdvisor'

/** Enable Gemini-enhanced summaries via Supabase edge function (see SETUP.md §9) */
export const AI_ADVISOR_ENABLED = import.meta.env.VITE_AI_ADVISOR_ENABLED === 'true'

export function getListingAdvisorResult(listing, context, t) {
  const analysis = analyzeListing(listing, context)
  const insightText = buildListingInsightSummary(listing, analysis, t)
  return { analysis, insightText, source: 'advisor' }
}

export async function fetchOptionalAiEnhancement(type, payload, local) {
  if (!AI_ADVISOR_ENABLED) return null

  try {
    const { data, error } = await supabase.functions.invoke('ai-advisor', {
      body: { type, payload, local },
    })
    if (error || !data?.text) return null
    return data.text
  } catch {
    return null
  }
}

export function getCompareResult(listings, context) {
  return compareListings(listings, context)
}

export function getLandlordCoachResult(form, options) {
  return coachLandlordListing(form, options)
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
