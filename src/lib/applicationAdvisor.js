import { analyzeListing } from './listingAdvisor'

const REASON_LABELS = {
  found_other_room: 'applicationAdvisor.reason.foundOther',
  plans_changed: 'applicationAdvisor.reason.plansChanged',
  listing_not_suitable: 'applicationAdvisor.reason.notSuitable',
  schedule_conflict: 'applicationAdvisor.reason.scheduleConflict',
  found_alternative: 'applicationAdvisor.reason.foundAlternative',
  no_longer_available: 'applicationAdvisor.reason.noLongerAvailable',
  other: 'applicationAdvisor.reason.other',
}

export function analyzeApplication(application) {
  if (!application) return null

  const listing = application.listing
  const student = application.student
  const docs = application.documents || []
  const listingAnalysis = listing ? analyzeListing(listing) : null

  let score = 50
  const pros = []
  const cons = []
  const tips = []

  const hasOmang = docs.some((d) => d.doc_type === 'omang_or_passport' || d.doc_type === 'student_id')
  const hasRegistration = docs.some((d) => d.doc_type === 'registration_proof' || d.doc_type === 'student_card')

  if (hasOmang && hasRegistration) {
    score += 20
    pros.push({ key: 'applicationAdvisor.pro.docsComplete' })
  } else {
    score -= 15
    cons.push({ key: 'applicationAdvisor.con.missingDocs' })
    tips.push({ key: 'applicationAdvisor.tip.requestDocs' })
  }

  if (application.intro_message && application.intro_message.length >= 40) {
    score += 10
    pros.push({ key: 'applicationAdvisor.pro.goodIntro' })
  } else if (!application.intro_message) {
    cons.push({ key: 'applicationAdvisor.con.noIntro' })
  }

  if (application.move_in_date) {
    pros.push({ key: 'applicationAdvisor.pro.moveInSet', meta: { date: application.move_in_date } })
    score += 5
  } else {
    tips.push({ key: 'applicationAdvisor.tip.askMoveIn' })
  }

  if (application.duration_months >= 6) {
    score += 5
    pros.push({ key: 'applicationAdvisor.pro.longStay', meta: { months: application.duration_months } })
  }

  if (student?.gender && listing?.gender_preference && listing.gender_preference !== 'any') {
    if (student.gender === listing.gender_preference) {
      score += 8
      pros.push({ key: 'applicationAdvisor.pro.genderMatch' })
    } else {
      score -= 20
      cons.push({ key: 'applicationAdvisor.con.genderMismatch' })
    }
  }

  if (listingAnalysis) {
    if (listingAnalysis.overall >= 75) {
      pros.push({ key: 'applicationAdvisor.pro.strongListing', meta: { score: listingAnalysis.overall } })
    }
    if (listingAnalysis.overall < 55) {
      tips.push({ key: 'applicationAdvisor.tip.verifyListing' })
    }
  }

  if (application.status === 'submitted') {
    tips.push({ key: 'applicationAdvisor.tip.respondSoon' })
  }

  score = Math.max(0, Math.min(100, score))

  let label = 'fair'
  if (score >= 78) label = 'strong'
  else if (score >= 58) label = 'fair'
  else label = 'weak'

  return {
    score,
    label,
    pros,
    cons,
    tips,
    listingScore: listingAnalysis?.overall ?? null,
  }
}

export { REASON_LABELS }
