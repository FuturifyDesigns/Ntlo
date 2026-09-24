/**
 * Helpers for public web-imported student listings.
 * Keep only private-individual posts; hide source-site branding from the UI.
 */

const COMPANY_CONTACT = /\b(ezilet|tswanahome|tswana\s*home|agency|estate\s*agent|realty|properties|property\s*group|pty\.?\s*ltd|limited|multires|boarding\s*house|student\s*residence|accommodation\s*(?:ltd|group|services)|zimcompass|listing)\b/i

const COMPANY_TITLE = /\b(boarding\s*house|student\s*(?:house\s*)?accommodation|student\s*residence|multires|pty\.?\s*ltd|estate\s*agents?|realty|property\s*(?:group|management)|rich\s*minds|tulo\s*student|leru\s*boarding|bogatsu\s*(?:ext|student)|mohammed\s*(?:ext|student)|tt\s*student\s*house)\b/i

const PERSON_NAME = /^[A-Za-z][A-Za-z'’-]*(?:\s+[A-Za-z][A-Za-z'’-]*){0,3}$/

const ROOM_LABELS = {
  single: 'Single room',
  sharing: 'Shared room',
  self_contained: 'Self-contained room',
  cottage: 'Cottage',
  house: 'House share',
}

/** True when this row looks like a private person with a personal WhatsApp. */
export function isIndividualWebListing(row) {
  if (!row) return false
  const phone = String(row.whatsapp_number || '').replace(/\D/g, '')
  if (!/^2677[1-9]\d{6}$/.test(phone)) return false

  const contact = String(row.contact_name || row.external_contact_name || '').trim()
  if (!contact || COMPANY_CONTACT.test(contact)) return false
  if (!PERSON_NAME.test(contact) && !/^[A-Za-z]{2,}$/.test(contact)) return false

  const title = String(row.title || '')
  if (COMPANY_TITLE.test(title)) return false

  const source = `${row.source_label || ''} ${row.external_source_label || ''} ${row.source_url || ''} ${row.external_source_url || ''}`
  if (/tswanahome|ezilet\.net/i.test(source) && COMPANY_CONTACT.test(contact)) return false

  return true
}

function titleCase(words) {
  return words
    .split(/\s+/)
    .filter(Boolean)
    .map((w) => {
      if (/^(ub|bac|buan|biust)$/i.test(w)) return w.toUpperCase()
      if (w.length <= 2 && /^(in|at|to|of|on|a|an)$/i.test(w)) return w.toLowerCase()
      return w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()
    })
    .join(' ')
}

/**
 * Turn classified dump titles into clean Ntlo-facing copy.
 * Never mentions the scrape source.
 */
export function polishWebListingTitle({ title, area, city, room_type } = {}) {
  let raw = String(title || '')
    .replace(/^Student-friendly rental\s*[—–\-:]?\s*/i, '')
    .replace(/^Student room share\s*[—–\-:]\s*/i, '')
    .replace(/^(Shared|Single|Self-contained|Student) room in\s+/i, '')
    .replace(/^House share in\s+/i, '')
    .replace(/\b(?:BWP|P)\s*[\d,]+\b/gi, ' ')
    .replace(/\brent\s*[\d,]+\b/gi, ' ')
    .replace(/\bMULTIRES\b/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim()

  const uniquePlaces = []
  for (const part of [area, city].map((v) => String(v || '').trim()).filter(Boolean)) {
    const pretty = titleCase(part.toLowerCase())
    if (!uniquePlaces.some((p) => p.toLowerCase() === pretty.toLowerCase())) uniquePlaces.push(pretty)
  }
  const place = uniquePlaces.join(', ')
  const roomLabel = ROOM_LABELS[room_type] || 'Student room'
  const looksLikeDump =
    !raw
    || raw.length < 12
    || /\b(to|in|a|the|for)$/i.test(raw)
    || /^(house|room|rooms|beds?|house\s*mate)\b/i.test(raw)
    || /room (available )?for rent/i.test(raw)
    || /\d+\s*(and\s*half|beds?)\s+to/i.test(raw)
    || (/^[A-Z0-9\s\-/,.]{18,}$/.test(raw) && raw === raw.toUpperCase())

  // Prefer a clean place-based title so browse cards stay consistent and professional.
  if (place) return `${roomLabel} in ${place}`
  if (looksLikeDump) return roomLabel

  if (raw === raw.toUpperCase() && /[A-Z]/.test(raw)) {
    raw = titleCase(raw.toLowerCase())
  }

  raw = raw.replace(/\s+/g, ' ').trim()
  if (raw.length > 72) raw = `${raw.slice(0, 69).trim()}…`
  return raw || roomLabel
}

/** Photos that are usable on Ntlo (local mirror, storage, or https). */
export function sanitizeWebPhotoUrls(urls = []) {
  if (!Array.isArray(urls)) return []
  const out = []
  for (const raw of urls) {
    const url = typeof raw === 'string' ? raw.trim() : String(raw?.url || '').trim()
    if (!url) continue
    if (/logo|icon|avatar|silhouette|placeholder|sprite|favicon|pixel/i.test(url)) continue
    if (/^https?:\/\//i.test(url) || url.startsWith('/data/') || url.startsWith('/images/')) {
      out.push(url)
    }
  }
  return [...new Set(out)].slice(0, 8)
}

/** Generic public source label — never name the scrape site. */
export const WEB_LISTING_PUBLIC_SOURCE = 'Student web listing'
