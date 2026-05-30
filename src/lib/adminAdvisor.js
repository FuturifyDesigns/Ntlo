// Rule-based "AI" review assistant for the admin verification queue.
// No external LLM — deterministic heuristics over the uploaded documents,
// mirroring the style of listingAdvisor.js.

const LANDLORD_REQUIRED = ['national_id', 'selfie_with_id']
const PROPERTY_PROOF = ['proof_of_ownership', 'proof_of_authority']
const LANDLORD_EXTRA = ['proof_of_address', 'reib_registration']
const LISTING_PROOF = ['title_deed_excerpt', 'property_rates_receipt', 'utility_bill_property']

const DOC_WEIGHTS = {
  national_id: 30,
  selfie_with_id: 30,
  proof_of_ownership: 30,
  proof_of_authority: 30,
  proof_of_address: 5,
  reib_registration: 5,
}

function daysSince(dateStr) {
  if (!dateStr) return 0
  const ms = Date.now() - new Date(dateStr).getTime()
  return Math.max(0, Math.floor(ms / 86_400_000))
}

function presentTypes(docs = []) {
  return new Set(docs.map((d) => d.doc_type))
}

/** Analyze a pending landlord submission. */
export function analyzeLandlord(landlord) {
  const docs = landlord.docs || []
  const present = presentTypes(docs)
  const hasPropertyProof = PROPERTY_PROOF.some((t) => present.has(t))

  let score = 0
  if (present.has('national_id')) score += DOC_WEIGHTS.national_id
  if (present.has('selfie_with_id')) score += DOC_WEIGHTS.selfie_with_id
  if (hasPropertyProof) score += 30
  if (present.has('proof_of_address')) score += DOC_WEIGHTS.proof_of_address
  if (present.has('reib_registration')) score += DOC_WEIGHTS.reib_registration
  score = Math.min(100, score)

  const missingRequired = LANDLORD_REQUIRED.filter((t) => !present.has(t))
  const waitingDays = daysSince(landlord.created_at)

  let status
  let recommendKey
  if (missingRequired.length === 0 && hasPropertyProof) {
    status = 'readyToApprove'
    recommendKey = 'approve'
  } else if (missingRequired.length === 0 && !hasPropertyProof) {
    status = 'needsProof'
    recommendKey = 'proof'
  } else {
    status = 'incomplete'
    recommendKey = 'incomplete'
  }

  const flags = []
  if (!present.has('national_id')) flags.push({ key: 'missingNationalId', severity: 'con' })
  if (!present.has('selfie_with_id')) flags.push({ key: 'missingSelfie', severity: 'con' })
  if (!hasPropertyProof) flags.push({ key: 'missingPropertyProof', severity: 'con' })
  if (missingRequired.length === 0 && hasPropertyProof) flags.push({ key: 'docsComplete', severity: 'pro' })
  if (LANDLORD_EXTRA.some((t) => present.has(t))) flags.push({ key: 'hasExtraProof', severity: 'pro' })
  if (docs.length === 1) flags.push({ key: 'singleDoc', severity: 'tip' })
  if (waitingDays >= 2) flags.push({ key: 'waitingLong', severity: 'tip', meta: { days: waitingDays } })

  return { kind: 'landlord', score, status, recommendKey, flags, waitingDays, docCount: docs.length }
}

/** Analyze a pending listing submission. */
export function analyzeListing(listing) {
  const docs = listing.docs || []
  const present = presentTypes(docs)
  const hasProof = LISTING_PROOF.some((t) => present.has(t))
  const waitingDays = daysSince(listing.created_at)

  const flags = []
  if (hasProof) flags.push({ key: 'docsComplete', severity: 'pro' })
  else flags.push({ key: 'missingPropertyProof', severity: 'con' })
  if (waitingDays >= 2) flags.push({ key: 'waitingLong', severity: 'tip', meta: { days: waitingDays } })

  return {
    kind: 'listing',
    score: hasProof ? 80 : 45,
    status: hasProof ? 'listingHasProof' : 'listingNoProof',
    recommendKey: hasProof ? 'listingHasProof' : 'listingNoProof',
    flags,
    waitingDays,
    docCount: docs.length,
  }
}

const STATUS_RANK = {
  readyToApprove: 0,
  listingHasProof: 0,
  needsProof: 1,
  listingNoProof: 1,
  incomplete: 2,
}

/** Sort submissions: smart = clear the easy approvals first, then oldest. */
export function sortSubmissions(items, analyze, mode = 'smart') {
  const decorated = items.map((item) => ({ item, analysis: analyze(item) }))
  if (mode === 'newest') {
    decorated.sort((a, b) => new Date(b.item.created_at) - new Date(a.item.created_at))
  } else {
    decorated.sort((a, b) => {
      const rank = (STATUS_RANK[a.analysis.status] ?? 9) - (STATUS_RANK[b.analysis.status] ?? 9)
      if (rank !== 0) return rank
      return b.analysis.waitingDays - a.analysis.waitingDays
    })
  }
  return decorated
}

/** High-level counts for the assistant header. */
export function summarizeQueue(decorated) {
  const total = decorated.length
  const ready = decorated.filter(
    (d) => d.analysis.status === 'readyToApprove' || d.analysis.status === 'listingHasProof'
  ).length
  return { total, ready, attention: total - ready }
}

export function isImagePath(path = '', fileName = '') {
  return /\.(png|jpe?g|gif|webp|bmp|svg|heic|heif)$/i.test(fileName || path)
}

export function isPdfPath(path = '', fileName = '') {
  return /\.pdf$/i.test(fileName || path)
}
