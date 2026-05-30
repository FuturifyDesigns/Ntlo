// Critical, Botswana-aware compliance checks run over OCR-extracted text.
// References: Omang national ID (Republic of Botswana), Deeds Registry title
// deeds, local council property rates, WUC/BPC utility bills, and real-estate
// practitioner registration (Real Estate Professionals Act, 2022 / REIB).

const MONTHS = {
  jan: 0, feb: 1, mar: 2, apr: 3, may: 4, jun: 5,
  jul: 6, aug: 7, sep: 8, oct: 9, nov: 10, dec: 11,
}

function norm(text = '') {
  return text.toUpperCase().replace(/\s+/g, ' ').trim()
}

function has(text, words) {
  return words.some((w) => text.includes(w))
}

function findOmang(text) {
  // Botswana Omang number is 9 digits. Avoid matching longer digit runs.
  const m = text.replace(/[^\d ]/g, ' ').match(/(?<!\d)\d{9}(?!\d)/)
  return m ? m[0] : null
}

function parseDates(text) {
  const dates = []
  // dd/mm/yyyy, dd-mm-yyyy, dd.mm.yyyy
  const numeric = text.matchAll(/\b(\d{1,2})[/.-](\d{1,2})[/.-](\d{2,4})\b/g)
  for (const m of numeric) {
    let [, d, mo, y] = m
    y = y.length === 2 ? `20${y}` : y
    const date = new Date(Number(y), Number(mo) - 1, Number(d))
    if (!Number.isNaN(date.getTime())) dates.push(date)
  }
  // dd MMM yyyy
  const named = text.matchAll(/\b(\d{1,2})\s*([A-Z]{3})[A-Z]*\s*(\d{4})\b/gi)
  for (const m of named) {
    const mo = MONTHS[m[2].slice(0, 3).toLowerCase()]
    if (mo == null) continue
    const date = new Date(Number(m[3]), mo, Number(m[1]))
    if (!Number.isNaN(date.getTime())) dates.push(date)
  }
  return dates
}

function legibilityCheck(confidence) {
  if (confidence >= 70) return { key: 'legible', status: 'pass', severity: 'major' }
  if (confidence >= 45) return { key: 'blurry', status: 'warn', severity: 'major', meta: { conf: Math.round(confidence) } }
  return { key: 'illegible', status: 'fail', severity: 'critical', meta: { conf: Math.round(confidence) } }
}

function monthsAgo(date) {
  return (Date.now() - date.getTime()) / (1000 * 60 * 60 * 24 * 30)
}

function analyzeNationalId(text, confidence) {
  const checks = [legibilityCheck(confidence)]
  const fields = {}

  checks.push(
    has(text, ['BOTSWANA', 'REPUBLIC OF BOTSWANA'])
      ? { key: 'countryBw', status: 'pass', severity: 'critical' }
      : { key: 'countryMissing', status: 'fail', severity: 'critical' }
  )

  checks.push(
    has(text, ['IDENTITY', 'OMANG', 'ID CARD', 'NATIONAL'])
      ? { key: 'idKeyword', status: 'pass', severity: 'minor' }
      : { key: 'idKeywordMissing', status: 'warn', severity: 'minor' }
  )

  const omang = findOmang(text)
  if (omang) {
    fields.omang = omang
    checks.push({ key: 'omangFound', status: 'pass', severity: 'major', meta: { omang } })
  } else {
    checks.push({ key: 'omangMissing', status: 'warn', severity: 'major' })
  }

  const dates = parseDates(text)
  const future = dates.filter((d) => d.getTime() > Date.now())
  const past = dates.filter((d) => d.getTime() <= Date.now())
  if (future.length > 0) {
    checks.push({ key: 'notExpired', status: 'pass', severity: 'critical' })
  } else if (dates.length > 0 && past.length === dates.length) {
    checks.push({ key: 'maybeExpired', status: 'warn', severity: 'critical' })
  } else {
    checks.push({ key: 'expiryUnknown', status: 'warn', severity: 'minor' })
  }

  return finalize('national_id', checks, fields)
}

function analyzeSelfie(text, confidence) {
  const checks = [
    { key: 'faceManual', status: 'manual', severity: 'critical' },
  ]
  if (has(text, ['BOTSWANA', 'IDENTITY', 'OMANG'])) {
    checks.push({ key: 'idVisibleInSelfie', status: 'pass', severity: 'minor' })
  } else {
    checks.push({ key: 'idNotDetectedInSelfie', status: 'warn', severity: 'minor', meta: { conf: Math.round(confidence) } })
  }
  return finalize('selfie_with_id', checks, {}, 'manual')
}

function keywordDoc(docType, text, confidence, { words, presentKey, missingKey, recencyMonths } = {}) {
  const checks = [legibilityCheck(confidence)]
  checks.push(
    has(text, words)
      ? { key: presentKey, status: 'pass', severity: 'major' }
      : { key: missingKey, status: 'warn', severity: 'major' }
  )

  if (recencyMonths) {
    const dates = parseDates(text)
    if (dates.length > 0) {
      const newest = dates.reduce((a, b) => (a > b ? a : b))
      checks.push(
        monthsAgo(newest) <= recencyMonths
          ? { key: 'recent', status: 'pass', severity: 'minor' }
          : { key: 'outdated', status: 'warn', severity: 'minor', meta: { months: recencyMonths } }
      )
    } else {
      checks.push({ key: 'noDate', status: 'warn', severity: 'minor' })
    }
  }
  return finalize(docType, checks, {})
}

const SEVERITY_PENALTY = { critical: 40, major: 20, minor: 10 }
const WARN_PENALTY = { critical: 15, major: 10, minor: 5 }

function finalize(docType, checks, fields, forced) {
  let score = 100
  let hasFail = false
  let hasWarn = false
  for (const c of checks) {
    if (c.status === 'fail') {
      score -= SEVERITY_PENALTY[c.severity] || 15
      hasFail = true
    } else if (c.status === 'warn') {
      score -= WARN_PENALTY[c.severity] || 8
      hasWarn = true
    }
  }
  score = Math.max(0, Math.min(100, score))
  let verdict = forced || 'pass'
  if (!forced) {
    if (hasFail) verdict = 'fail'
    else if (hasWarn) verdict = 'warn'
  }
  return { docType, verdict, score, checks, fields, regulationKey: docType }
}

/**
 * Analyze OCR output for a given document type.
 * @returns {{ docType, verdict, score, checks, fields, regulationKey }}
 */
export function analyzeDocCompliance(docType, text, confidence) {
  const T = norm(text)
  switch (docType) {
    case 'national_id':
      return analyzeNationalId(T, confidence)
    case 'selfie_with_id':
      return analyzeSelfie(T, confidence)
    case 'proof_of_ownership':
    case 'title_deed_excerpt':
      return keywordDoc(docType, T, confidence, {
        words: ['DEED', 'TITLE', 'REGISTRAR', 'DEEDS REGISTRY', 'PLOT', 'LOT', 'CERTIFICATE', 'LAND BOARD'],
        presentKey: 'titleTermsFound',
        missingKey: 'titleTermsMissing',
      })
    case 'proof_of_authority':
      return keywordDoc(docType, T, confidence, {
        words: ['AUTHORITY', 'AUTHORISED', 'AUTHORIZED', 'AGENT', 'BEHALF', 'MANAGE', 'POWER OF ATTORNEY', 'LETTER', 'CONSENT'],
        presentKey: 'authorityTermsFound',
        missingKey: 'authorityTermsMissing',
      })
    case 'proof_of_address':
      return keywordDoc(docType, T, confidence, {
        words: ['PLOT', 'WARD', 'BLOCK', 'P O BOX', 'ADDRESS', 'GABORONE', 'FRANCISTOWN', 'MAUN'],
        presentKey: 'addressTermsFound',
        missingKey: 'addressTermsMissing',
        recencyMonths: 3,
      })
    case 'reib_registration':
      return keywordDoc(docType, T, confidence, {
        words: ['REAL ESTATE', 'REIB', 'REGISTRATION', 'PRACTITIONER', 'COUNCIL', 'CERTIFICATE'],
        presentKey: 'reibTermsFound',
        missingKey: 'reibTermsMissing',
      })
    case 'property_rates_receipt':
      return keywordDoc(docType, T, confidence, {
        words: ['RATES', 'COUNCIL', 'CITY COUNCIL', 'TOWN COUNCIL', 'RECEIPT', 'VALUATION'],
        presentKey: 'ratesTermsFound',
        missingKey: 'ratesTermsMissing',
        recencyMonths: 12,
      })
    case 'utility_bill_property':
      return keywordDoc(docType, T, confidence, {
        words: ['WUC', 'WATER UTILITIES', 'BPC', 'BOTSWANA POWER', 'ELECTRICITY', 'WATER', 'UNITS', 'ACCOUNT', 'UTILIT'],
        presentKey: 'utilityTermsFound',
        missingKey: 'utilityTermsMissing',
        recencyMonths: 3,
      })
    default:
      return finalize(docType, [legibilityCheck(confidence)], {})
  }
}

/** Rough word-overlap similarity between two OCR texts (0–1). */
export function compareOcr(prevText = '', newText = '') {
  const tokenize = (s) =>
    new Set(
      norm(s)
        .replace(/[^A-Z0-9 ]/g, ' ')
        .split(' ')
        .filter((w) => w.length >= 3)
    )
  const a = tokenize(prevText)
  const b = tokenize(newText)
  if (a.size === 0 && b.size === 0) return { similarity: 1, changed: false }
  let inter = 0
  for (const w of a) if (b.has(w)) inter += 1
  const union = a.size + b.size - inter
  const similarity = union === 0 ? 1 : inter / union
  return { similarity, changed: similarity < 0.75 }
}

export const VERDICT_STYLE = {
  pass: { color: 'text-success', dot: 'bg-success' },
  warn: { color: 'text-amber-600', dot: 'bg-amber-500' },
  fail: { color: 'text-error', dot: 'bg-error' },
  manual: { color: 'text-muted', dot: 'bg-muted' },
}
