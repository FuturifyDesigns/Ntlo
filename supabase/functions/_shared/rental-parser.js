/**
 * Shared Botswana student-rental crawler logic.
 *
 * Web-standard only (fetch, URL, RegExp) so it runs unchanged in:
 *  - Node       → scripts/sync-web-rentals.mjs
 *  - Deno/Edge  → supabase/functions/sync-web-rentals/index.ts
 *
 * Only public HTML classified pages are crawled. Facebook Marketplace and
 * closed groups are out of scope (ToS + auth wall).
 */

export const UA = 'NtloStudentHousingBot/1.0 (+https://ntlo.online; student accommodation aggregator)'

/** Keep listings that fall off page 1 for this many days so Ntlo stays stocked. */
export const KEEP_DAYS = 21

const ZIMCOMPASS_PAGES = 8

export const AMENITY_IDS = [
  'wifi', 'water', 'security', 'furnished', 'parking',
  'dstv', 'borehole', 'braai', 'laundry', 'kitchen',
]

/* ────────────────────────────── sources ────────────────────────────── */

function zimcompassCategorySources(path, label) {
  const pages = []
  for (let page = 1; page <= ZIMCOMPASS_PAGES; page += 1) {
    pages.push({
      id: `zimcompass-${path}-p${page}`,
      kind: 'zimcompass',
      label,
      url: page === 1
        ? `https://bw.zimcompass.com/${path}`
        : `https://bw.zimcompass.com/${path}?page=${page}`,
    })
  }
  return pages
}

const EZILET_SEEDS = [
  'https://ezilet.net/listing/bogatsu-ext-10-student-accommodation/',
  'https://ezilet.net/listing/mohammed-ext-10-student-accommodation/',
  'https://ezilet.net/listing/tulo-student-residence/',
  'https://ezilet.net/listing/tlokweng-student-accommodation/',
]

const EZILET_SEARCHES = [
  'https://ezilet.net/?s=gaborone+student',
  'https://ezilet.net/?s=botswana+student+accommodation',
  'https://ezilet.net/?s=university+of+botswana',
  'https://ezilet.net/?s=tlokweng+student',
  'https://ezilet.net/?s=limkokwing+botswana',
  'https://ezilet.net/?s=room+to+rent+gaborone',
  'https://ezilet.net/?s=mogoditshane+room',
]

export const SOURCES = [
  ...zimcompassCategorySources('house-share', 'ZimCompass house share'),
  ...zimcompassCategorySources('houses-for-rent', 'ZimCompass houses for rent'),
  { id: 'ezilet-botswana', kind: 'ezilet', label: 'Ezilet student accommodation' },
  { id: 'tswanahome-for-rent', kind: 'tswanahome', label: 'TswanaHome for rent', url: 'https://www.tswanahome.com/status/for-rent/' },
]

/* ────────────────────────────── matchers ────────────────────────────── */

const STUDENT_HINT = /\b(student|share|sharing|room|rooms|bed|beds|ub\b|botho|campus|university|college|bac\b|biust|limkokwing|gaborone|mogoditshane|tlokweng|gabane|palapye|francistown|ledumadumane|broadhurst|block\s*\d)\b/i
const NOISE = /\b(bmw|toyota|nissan|honda|mercedes|car diagnosis|nail technician|botswana ?post|chief|zambia|mthatha|ongwediva|namibia|messenger|office|warehouse|industrial|shop|retail|commercial)\b/i
const BW_CITIES = /\b(gaborone|francistown|palapye|maun|lobatse|selebi|serowe|molepolole|mogoditshane|tlokweng|gabane|kweneng|broadhurst|block\s*\d|ledumadumane|phase\s*\d|thito|satellite|molapo|extension\s*\d+)\b/i
const BW_MARKER = /\b(botswana|gaborone|francistown|palapye|tlokweng|mogoditshane|gabane|ub\b|university of botswana|botho|limkokwing|buan|biust)\b/i
const NON_BW = /\b(grenoble|norwich|winchester|colchester|st\.?\s*louis|uj\b|doornfontein|nsfas|ukzn|johannesburg|pretoria|cape town|namibia|zambia|mthatha)\b/i

/* ─────────────────────────── amenity detection ─────────────────────────── */

const AMENITY_RULES = [
  { id: 'wifi', re: /\b(wi-?fi|wireless internet|internet (?:included|available|access)|fibre|fiber optic|uncapped)\b/i },
  { id: 'water', re: /\b(water (?:is |and |& )?(?:included|inclusive)|includ\w* water|water\s*(?:&|and|\+)\s*(?:electricity|lights|power)|bills? included|utilities included|rent includes)\b/i },
  { id: 'security', re: /\b(security (?:guard|company|services?)|electric fence|alarm system|burglar bars?|gated (?:community|yard)|walled (?:yard|property)|motori[sz]ed gate|cctv|24[\s-]?hour security|secure yard|palisade)\b/i },
  { id: 'furnished', re: /\b(fully furnished|semi[\s-]?furnished|furnished|fitted (?:bedroom|wardrobe|cupboards?)|wardrobe|built[\s-]?in cupboards?|beds? (?:provided|included)|with (?:a )?bed)\b/i, notRe: /\bunfurnished\b/i },
  { id: 'parking', re: /\b(parking|car ?port|garage|paved yard|driveway)\b/i },
  { id: 'dstv', re: /\b(dstv|satellite (?:tv|dish)|decoder|\bdish\b)\b/i },
  { id: 'borehole', re: /\bborehole\b/i },
  { id: 'braai', re: /\b(braai|barbecue|bbq)\b/i },
  { id: 'laundry', re: /\b(laundry|washing machine|washer|tumble dryer)\b/i },
  { id: 'kitchen', re: /\b(kitchen|cooking (?:area|facilities)|stove|cooker)\b/i },
]

/** Map free-text classified copy onto Ntlo's amenity ids. */
export function detectAmenities(...texts) {
  const blob = texts.filter(Boolean).join(' ')
  if (!blob.trim()) return []
  const found = []
  for (const { id, re, notRe } of AMENITY_RULES) {
    if (notRe && notRe.test(blob)) continue
    if (re.test(blob)) found.push(id)
  }
  return found
}

/* ───────────────────────────── geocoding ───────────────────────────── */

/**
 * Area-level coordinates for Botswana student areas. Classifieds never publish
 * exact pins, so listings get an approximate marker rather than no map at all.
 */
const BW_GEO = [
  [/\bblock\s*3\b/i, -24.6459, 25.9089, 'Gaborone'],
  [/\bblock\s*5\b/i, -24.6614, 25.9042, 'Gaborone'],
  [/\bblock\s*6\b/i, -24.6706, 25.8985, 'Gaborone'],
  [/\bblock\s*7\b/i, -24.6800, 25.8880, 'Gaborone'],
  [/\bblock\s*8\b/i, -24.6486, 25.8964, 'Gaborone'],
  [/\bblock\s*9\b/i, -24.6390, 25.8880, 'Gaborone'],
  [/\bblock\s*10\b/i, -24.6300, 25.8990, 'Gaborone'],
  [/\bextension\s*(?:10|ten)\b|\bext\.?\s*10\b/i, -24.6520, 25.9250, 'Gaborone'],
  [/\bextension\s*12\b|\bext\.?\s*12\b/i, -24.6440, 25.9310, 'Gaborone'],
  [/\bextension\s*2\b|\bext\.?\s*2\b/i, -24.6480, 25.9180, 'Gaborone'],
  [/\bextension\s*4\b|\bext\.?\s*4\b/i, -24.6560, 25.9130, 'Gaborone'],
  [/\bbroadhurst\s*ext\.?\s*27\b/i, -24.6118, 25.9436, 'Gaborone'],
  [/\bbroadhurst\b/i, -24.6205, 25.9308, 'Gaborone'],
  [/\bphase\s*1\b/i, -24.6640, 25.9160, 'Gaborone'],
  [/\bphase\s*2\b/i, -24.6690, 25.9110, 'Gaborone'],
  [/\bphase\s*4\b/i, -24.6760, 25.9060, 'Gaborone'],
  [/\bnew canada\b/i, -24.6100, 25.9500, 'Gaborone'],
  [/\bold naledi\b/i, -24.6800, 25.9200, 'Gaborone'],
  [/\bbontleng\b/i, -24.6620, 25.9160, 'Gaborone'],
  [/\bwhite city\b/i, -24.6560, 25.9080, 'Gaborone'],
  [/\bthe village\b|\bvillage\b/i, -24.6580, 25.9280, 'Gaborone'],
  [/\bsebele\b/i, -24.5744, 25.9464, 'Gaborone'],
  [/\bmolapo\b/i, -24.6350, 25.9450, 'Gaborone'],
  [/\bgaborone west\b/i, -24.6520, 25.8830, 'Gaborone'],
  [/\btlokweng\b/i, -24.6669, 25.9722, 'Gaborone'],
  [/\bmogoditshane\b/i, -24.6272, 25.8656, 'Gaborone'],
  [/\bledumadumane\b/i, -24.5867, 25.8500, 'Gaborone'],
  [/\bmmopane\b/i, -24.5667, 25.8333, 'Gaborone'],
  [/\bgabane\b/i, -24.6667, 25.7833, 'Gabane'],
  [/\bkopong\b/i, -24.4667, 25.8667, 'Gaborone'],
  [/\bsatellite\b/i, -21.1550, 27.5200, 'Francistown'],
  [/\bfrancistown\b/i, -21.1700, 27.5075, 'Francistown'],
  [/\bpalapye\b/i, -22.5500, 27.1250, 'Palapye'],
  [/\bmaun\b/i, -19.9833, 23.4167, 'Maun'],
  [/\blobatse\b/i, -25.2167, 25.6667, 'Lobatse'],
  [/\bmolepolole\b/i, -24.4067, 25.4950, 'Molepolole'],
  [/\bserowe\b/i, -22.3833, 26.7167, 'Serowe'],
  [/\bselebi[\s-]?phikwe\b/i, -21.9789, 27.8478, 'Selebi-Phikwe'],
  [/\bkanye\b/i, -24.9833, 25.3500, 'Kanye'],
  [/\bmahalapye\b/i, -23.1000, 26.8167, 'Mahalapye'],
  [/\bramotswa\b/i, -24.8667, 25.8667, 'Ramotswa'],
  [/\bkasane\b/i, -17.8000, 25.1500, 'Kasane'],
  [/\bjwaneng\b/i, -24.6000, 24.7333, 'Jwaneng'],
  [/\bgaborone\b/i, -24.6282, 25.9231, 'Gaborone'],
]

/**
 * Resolve an approximate map pin from area/address text.
 * Returns null when nothing matches so the UI keeps its "no pin" state.
 */
export function geocodeArea(...texts) {
  const blob = texts.filter(Boolean).join(' ')
  if (!blob.trim()) return null
  for (const [re, lat, lng, city] of BW_GEO) {
    if (re.test(blob)) return { lat, lng, city, precision: 'area' }
  }
  return null
}

/* ───────────────────────────── html helpers ───────────────────────────── */

export function stripTags(html) {
  return String(html || '')
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&#0?39;/g, "'")
    .replace(/&rsquo;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/&#8211;/g, '-')
    .replace(/\s+/g, ' ')
    .trim()
}

const IMAGE_NOISE = /(logo|icon|avatar|placeholder|silhouette|sprite|favicon|banner|gravatar|loading|blank|spacer|pixel|calendar|arrow|star|flag|badge|button|btn-|share|marker|whatsapp|envelope|default|no-image|noimage|watermark|thumb-default)/i

/** Theme and plugin bundles are never listing photos, whatever they are named. */
const HARD_CHROME_PATH = /\/(themes?|plugins?|node_modules|vendor)\//i

/** Site chrome lives in asset folders; real listing photos live in upload/media paths. */
const CHROME_PATH = /\/(images|img|assets|static|templates?|skin|css|js)\//i
const CONTENT_PATH = /(upload|product|propert|gallery|media|photo|attachment)/i

/** Object storage these classifieds offload their photos to. */
const IMAGE_CDNS = /(linodeobjects|cloudfront|amazonaws|digitaloceanspaces|\.wp\.com|cloudinary|imgix|backblazeb2|storage\.googleapis)/i

/** Third-party embeds that are never listing photos. */
const FOREIGN_HOSTS = /(facebook|fbcdn|twitter|twimg|instagram|googletagmanager|doubleclick|google-analytics|youtube|ytimg|linkedin|pinterest)/i

/**
 * The registrable-ish brand token of a host, so bw.zimcompass.com and
 * zimcompass.ap-south-1.linodeobjects.com are recognised as the same operator.
 */
function brandToken(host) {
  const parts = String(host || '').toLowerCase().split('.').filter((p) => p && p.length > 3 && p !== 'www')
  return parts.length ? parts.sort((a, b) => b.length - a.length)[0] : ''
}

/**
 * Pull a photo gallery off any detail page: <img src>, lazy-loaded data-src,
 * srcset candidates and og:image.
 *
 * Accepts the page host, any host sharing its brand token, and known image
 * CDNs — classifieds routinely offload photos to separate object storage.
 */
export function extractGallery(html, pageUrl, { limit = 8 } = {}) {
  let host = ''
  try {
    host = new URL(pageUrl).host
  } catch {
    host = ''
  }
  const brand = brandToken(host)

  const hostAllowed = (candidateHost) => {
    if (!host) return true
    if (candidateHost === host) return true
    if (FOREIGN_HOSTS.test(candidateHost)) return false
    if (brand && candidateHost.toLowerCase().includes(brand)) return true
    return IMAGE_CDNS.test(candidateHost)
  }

  const candidates = []
  const push = (raw) => {
    if (!raw) return
    let url = String(raw).trim().split(/\s+/)[0]
    if (!url || url.startsWith('data:')) return
    try {
      url = new URL(url, pageUrl).toString()
    } catch {
      return
    }
    if (!/\.(jpe?g|png|webp)(\?|$)/i.test(url)) return
    if (IMAGE_NOISE.test(url)) return
    const parsed = new URL(url)
    if (!hostAllowed(parsed.host)) return
    if (HARD_CHROME_PATH.test(parsed.pathname)) return
    if (CHROME_PATH.test(parsed.pathname) && !CONTENT_PATH.test(parsed.pathname)) return
    candidates.push(url.split('?')[0])
  }

  for (const m of html.matchAll(/<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/gi)) push(m[1])
  for (const m of html.matchAll(/<img[^>]+?(?:data-src|data-lazy-src|data-original|src)=["']([^"']+)["']/gi)) push(m[1])
  for (const m of html.matchAll(/(?:data-)?srcset=["']([^"']+)["']/gi)) {
    for (const part of m[1].split(',')) push(part.trim())
  }

  // WordPress serves -300x200 / -scaled variants of one photo; keep the original.
  const variantSuffix = /(?:-scaled)?(?:-\d{2,4}x\d{2,4})?(\.(?:jpe?g|png|webp))$/i
  const isResized = (url) => /-\d{2,4}x\d{2,4}\.(?:jpe?g|png|webp)$/i.test(url)

  const byBase = new Map()
  for (const url of candidates) {
    const base = url.replace(variantSuffix, '$1')
    const prev = byBase.get(base)
    if (!prev) {
      byBase.set(base, url)
      continue
    }
    // Full-size beats a resized crop; between equals prefer the shorter URL.
    if (isResized(prev) && !isResized(url)) byBase.set(base, url)
    else if (isResized(prev) === isResized(url) && url.length < prev.length) byBase.set(base, url)
  }

  return [...new Set([...byBase.values()])].slice(0, limit)
}

export function extractPhone(text) {
  const raw = String(text || '')
  const intl = raw.match(/(?:\+?267[\s-]*)?(7[1-9]\d{6})\b/)
  if (!intl) return null
  return `267${intl[1]}`
}

export function extractPrice(priceText, detailsText) {
  const blob = `${priceText || ''} ${detailsText || ''}`
  const bwp = blob.match(/BWP\s*([\d,]+)/i)
  if (bwp) {
    const n = Number(bwp[1].replace(/,/g, ''))
    if (n >= 400 && n <= 8000) return n
  }
  const p = blob.match(/(?:^|[^\d])P\s*([\d,]+)/i) || blob.match(/\b([\d]{3,4})\s*(?:\/\s*mo|rent|share)/i)
  if (p) {
    const n = Number(p[1].replace(/,/g, ''))
    if (n >= 400 && n <= 8000) return n
  }
  const share = blob.match(/share(?:\s+is)?\s*P?\s*([\d,]+)/i)
  if (share) {
    const n = Number(share[1].replace(/,/g, ''))
    if (n >= 400 && n <= 8000) return n
  }
  return null
}

export function extractDeposit(text) {
  const m = String(text || '').match(/security(?:\s*deposit)?\s*(?:is\s*)?P?\s*([\d,]+)/i)
  if (!m) return null
  const n = Number(m[1].replace(/,/g, ''))
  return Number.isFinite(n) && n > 0 && n <= 20000 ? n : null
}

export function guessCity(locationText, detailsText) {
  const blob = `${locationText || ''} ${detailsText || ''}`.toLowerCase()
  if (blob.includes('francistown')) return 'Francistown'
  if (blob.includes('palapye')) return 'Palapye'
  if (blob.includes('gabane')) return 'Gabane'
  if (blob.includes('mogoditshane')) return 'Gaborone'
  if (blob.includes('tlokweng')) return 'Gaborone'
  if (blob.includes('kweneng')) return 'Gaborone'
  if (blob.includes('gaborone') || BW_CITIES.test(blob)) return 'Gaborone'
  return 'Gaborone'
}

export function guessArea(locationText, detailsText, city) {
  const blob = `${locationText || ''} ${detailsText || ''}`
  const block = blob.match(/Block\s*\d+/i)
  if (block) return block[0]
  const known = blob.match(/\b(Ledumadumane|Broadhurst(?:\s*Ext\.?\s*\d+)?|Phase\s*\d+|Tlokweng|Mogoditshane|Gabane|New Canada|Thito|Satellite|Molapo|Mmopane|Sebele|Extension\s*\d+)\b/i)
  if (known) return known[1]
  return city
}

export function guessCampuses(area, city, details) {
  const blob = `${area} ${city} ${details}`.toLowerCase()
  const ids = new Set()
  if (blob.includes('botho') || blob.includes('block 7') || blob.includes('enco')) ids.add(3)
  if (blob.includes('limkokwing') || blob.includes('block 7')) ids.add(4)
  if (blob.includes('bac') || blob.includes('accountancy')) ids.add(9)
  if (blob.includes('biust') || blob.includes('palapye')) ids.add(2)
  if (blob.includes('boitekanelo') || blob.includes('tlokweng')) ids.add(10)
  if (blob.includes('buan') || blob.includes('ledumadumane') || blob.includes('sebele')) ids.add(8)
  if (blob.includes('francistown')) {
    return { campus_ids: [], custom_university_name: 'University of Botswana — Francistown Campus' }
  }
  if (blob.includes('ub') || blob.includes('extension 10') || blob.includes('block 5') || blob.includes('gaborone')) ids.add(1)
  if (!ids.size && city === 'Gaborone') ids.add(1)
  return { campus_ids: [...ids], custom_university_name: null }
}

export function isStudentRentable(title, details, location) {
  const blob = `${title} ${details} ${location}`
  if (NOISE.test(blob)) return false
  if (!STUDENT_HINT.test(blob) && !BW_CITIES.test(blob)) return false
  if (!/\b(room|share|bed|house|apartment|flat|sq\b|servant|student)\b/i.test(blob)) return false
  return true
}

export function listingKey(row) {
  const pricePart = row.price_on_request || row.price == null ? 'poa' : row.price
  return `${String(row.whatsapp_number || '').replace(/\D/g, '')}|${pricePart}|${String(row.title || '').slice(0, 24).toLowerCase()}`
}

function slugify(phone, title) {
  return `${phone}-${String(title).toLowerCase().replace(/[^a-z0-9]+/g, '-').slice(0, 40)}`.replace(/-+$/g, '')
}

/** Attach amenities + approximate coordinates to a parsed row. */
export function enrich(row, ...contextTexts) {
  const blob = [row.title, row.description, row.address, row.area, ...contextTexts].filter(Boolean).join(' ')
  const geo = geocodeArea(row.address, row.area, row.city, row.title)
  return {
    ...row,
    // Union so re-enriching an existing row never drops what an earlier crawl found.
    amenities: [...new Set([...(row.amenities || []), ...detectAmenities(blob)])],
    lat: row.lat ?? geo?.lat ?? null,
    lng: row.lng ?? geo?.lng ?? null,
    geo_precision: row.geo_precision ?? (geo ? geo.precision : null),
  }
}

/* ────────────────────────────── fetching ────────────────────────────── */

export async function fetchHtml(url, { timeoutMs = 20000 } = {}) {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), timeoutMs)
  try {
    const res = await fetch(url, {
      headers: { 'User-Agent': UA, Accept: 'text/html,application/xhtml+xml' },
      signal: controller.signal,
    })
    if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`)
    return await res.text()
  } finally {
    clearTimeout(timer)
  }
}

/* ────────────────────────────── parsers ────────────────────────────── */

export function parseZimcompass(html, source) {
  const articles = [...html.matchAll(/<article class="listing">([\s\S]*?)<\/article>/gi)]
  const out = []
  for (const [, body] of articles) {
    const title = stripTags((body.match(/<h3 class="heading">([\s\S]*?)<\/h3>/i) || [])[1] || '')
    const priceText = stripTags((body.match(/<p class="price">([\s\S]*?)<\/p>/i) || [])[1] || '')
    const details = stripTags((body.match(/<p class="details">([\s\S]*?)<\/p>/i) || [])[1] || '')
    const seller = stripTags((body.match(/Private Seller:\s*([^<]+)/i) || [])[1] || 'Contact')
    const location = stripTags((body.match(/<div class="location">([\s\S]*?)<\/div>/i) || [])[1] || '')
    const img = ((body.match(/<img[^>]+src="([^"]+)"[^>]*class="[^"]*img-fluid/i) || body.match(/<img[^>]+class="[^"]*img-fluid[^"]*"[^>]+src="([^"]+)"/i) || [])[1] || '').trim()
    const href = ((body.match(/<a[^>]+href="([^"]+)"[^>]*>\s*<h3/i) || body.match(/href="(\/[^"]+)"/i) || [])[1] || '').trim()

    if (!isStudentRentable(title, details, location)) continue
    const phone = extractPhone(`${details} ${title}`)
    if (!phone) continue
    const price = extractPrice(priceText, details)
    if (!price) continue
    if (/namibia|zambia|mthatha|ongwediva/i.test(`${location} ${details}`)) continue

    const city = guessCity(location, details)
    const area = guessArea(location, details, city)
    const campus = guessCampuses(area, city, details)
    const photo = img
      ? (img.startsWith('http') ? img : `https://bw.zimcompass.com${img.startsWith('/') ? '' : '/'}${img}`)
      : null
    const sourceUrl = href
      ? (href.startsWith('http') ? href : `https://bw.zimcompass.com${href.startsWith('/') ? '' : '/'}${href}`)
      : source.url

    const now = new Date().toISOString()
    out.push(enrich({
      id: `auto-${slugify(phone, title)}`,
      title: title.length > 8 ? title : `Student room share — ${area}`,
      description: details || title,
      price,
      price_on_request: false,
      room_type: /single|servant|sq\b/i.test(`${title} ${details}`) ? 'single' : 'sharing',
      gender_preference: /female only|ladies only|girls only/i.test(details)
        ? 'female'
        : /male only|gents only/i.test(details) ? 'male' : 'any',
      area,
      city,
      address: location || `${area}, ${city}`,
      whatsapp_number: phone,
      contact_name: seller || 'Contact',
      campus_ids: campus.campus_ids,
      custom_university_name: campus.custom_university_name,
      source_label: source.label,
      source_url: sourceUrl,
      detail_url: sourceUrl !== source.url ? sourceUrl : null,
      photo_urls: photo && !IMAGE_NOISE.test(photo) ? [photo] : [],
      deposit_pula: extractDeposit(details),
      utilities_included: /including (bills|water|electricity)|bills included/i.test(details) ? 'included' : null,
      fetched_at: now,
      last_seen_at: now,
    }, location))
  }
  return out
}

/**
 * Second pass over ZimCompass detail pages: full gallery + richer copy, which
 * the results grid does not expose. Bounded so a run stays inside the
 * Edge Function time budget.
 */
export async function hydrateZimcompassDetails(rows, { limit = 40, deadline = null, onError } = {}) {
  const targets = rows.filter((r) => r.detail_url).slice(0, limit)
  for (const row of targets) {
    if (deadline && Date.now() > deadline) break
    try {
      const html = await fetchHtml(row.detail_url)
      const gallery = extractGallery(html, row.detail_url)
      if (gallery.length) row.photo_urls = gallery
      const plain = stripTags(html)
      if (plain.length > (row.description || '').length) {
        row.description = plain.slice(0, 600)
      }
      const amenities = detectAmenities(row.title, row.description, plain)
      if (amenities.length) row.amenities = amenities
      row.deposit_pula = row.deposit_pula ?? extractDeposit(plain)
    } catch (err) {
      onError?.(row.detail_url, err)
    }
  }
  return rows
}

export function parseEziletDetail(html, url, source) {
  const title = stripTags((html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i) || [])[1] || '')
  if (!title) return null
  const plain = stripTags(html)
  if (NON_BW.test(`${title} ${plain}`) && !BW_MARKER.test(`${title} ${url} ${plain}`)) return null
  if (!BW_MARKER.test(`${title} ${url} ${plain}`)) return null
  if (NOISE.test(plain) && !/student|accommodation|room|share/i.test(title)) return null

  const phone = extractPhone(html) || extractPhone(plain)
  if (!phone) return null

  const rentBlock = stripTags((html.match(/block-field-rent[\s\S]{0,400}/i) || [])[0] || '')
  const price = extractPrice(rentBlock, plain)
  const priceOnRequest = !price

  const suburb = stripTags((html.match(/Suburb[\s\S]{0,120}?<[^>]+>([^<]{3,80})</i) || html.match(/Suburb\s+([A-Za-z0-9 ,.-]{3,80})/i) || [])[1] || '')
  const cityRaw = stripTags((html.match(/City[\s\S]{0,80}?<[^>]+>([^<]{3,40})</i) || [])[1] || '')
  const city = guessCity(`${suburb} ${cityRaw}`, plain)
  const area = guessArea(suburb || title, plain, city)
  const campus = guessCampuses(area, city, `${title} ${plain}`)
  const desc = stripTags((html.match(/Description[\s\S]{0,40}?<(?:div|p)[^>]*>([\s\S]*?)<\/(?:div|p)>/i) || [])[1] || '')
    || plain.slice(0, 400)
  const now = new Date().toISOString()

  return enrich({
    id: `auto-ezilet-${slugify(phone, title)}`,
    title,
    description: desc || title,
    price: priceOnRequest ? null : price,
    price_on_request: priceOnRequest,
    room_type: /single|ensuite|self.?contained/i.test(`${title} ${desc}`) ? 'single' : 'sharing',
    gender_preference: /female|girl|ladies only/i.test(`${title} ${desc}`)
      ? 'female'
      : /male only|gents only/i.test(`${title} ${desc}`) ? 'male' : 'any',
    area,
    city,
    address: suburb || `${area}, ${city}`,
    whatsapp_number: phone,
    contact_name: 'Ezilet listing',
    campus_ids: campus.campus_ids,
    custom_university_name: campus.custom_university_name,
    source_label: source.label,
    source_url: url,
    detail_url: null,
    photo_urls: extractGallery(html, url),
    deposit_pula: extractDeposit(plain),
    utilities_included: /wifi|wi-fi|utilities included|bills included/i.test(desc) ? 'included' : null,
    fetched_at: now,
    last_seen_at: now,
  }, plain)
}

export async function fetchEzilet(source, { limit = 60, deadline = null, onError } = {}) {
  const queue = new Set(EZILET_SEEDS)

  for (const searchUrl of EZILET_SEARCHES) {
    if (deadline && Date.now() > deadline) break
    try {
      const html = await fetchHtml(searchUrl)
      const links = [...html.matchAll(/href="(https:\/\/ezilet\.net\/listing\/[^"#]+)"/gi)].map((m) => m[1])
      const botswanaPage = BW_MARKER.test(html)
      for (const href of links) {
        if (botswanaPage || BW_MARKER.test(href) || /bogatsu|mohammed|tulo|tlokweng|gaborone|botswana|ub-/i.test(href)) {
          queue.add(href)
        }
      }
    } catch (err) {
      onError?.(searchUrl, err)
    }
  }

  const out = []
  const seen = new Set()
  for (const url of queue) {
    if (seen.size >= limit) break
    if (deadline && Date.now() > deadline) break
    if (seen.has(url)) continue
    seen.add(url)
    try {
      const html = await fetchHtml(url)
      const row = parseEziletDetail(html, url, source)
      if (row) out.push(row)
      for (const href of [...html.matchAll(/href="(https:\/\/ezilet\.net\/listing\/[^"#]+)"/gi)].map((m) => m[1])) {
        if (!seen.has(href) && (BW_MARKER.test(href) || /bogatsu|mohammed|tulo|tlokweng|gaborone|botswana/i.test(href))) {
          queue.add(href)
        }
      }
    } catch (err) {
      onError?.(url, err)
    }
  }
  return out
}

export function parseTswanahomeDetail(html, url, source) {
  const title = stripTags((html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i) || [])[1] || '')
  if (!title) return null
  if (/office|warehouse|industrial|shop|retail|biz|commercial/i.test(`${title} ${url}`)) return null

  const plain = stripTags(html)
  if (NOISE.test(`${title} ${plain}`) && !STUDENT_HINT.test(`${title} ${plain}`)) return null
  if (!STUDENT_HINT.test(`${title} ${plain}`)) return null

  const price = extractPrice(plain, title)
  if (!price || price > 4500) return null // student-budget residential only

  const phones = [...new Set((html.match(/(?:\+?\s*267[\s-]*)?(7[1-9]\d{6})\b/g) || [])
    .map((p) => `267${p.replace(/\D/g, '').replace(/^267/, '')}`))]
  const phone = phones.find((p) => !p.endsWith('75159069')) || phones[0] || null
  if (!phone) return null

  const city = guessCity(title, plain)
  const area = guessArea(title, plain, city)
  const campus = guessCampuses(area, city, `${title} ${plain}`)
  const now = new Date().toISOString()

  return enrich({
    id: `auto-tswana-${slugify(phone, title)}`,
    title: /student|share|room/i.test(title) ? title : `Student-friendly rental — ${title}`,
    description: plain.slice(0, 400) || title,
    price,
    price_on_request: false,
    room_type: /single|bachelor|studio/i.test(`${title} ${plain}`) ? 'single' : 'sharing',
    gender_preference: 'any',
    area,
    city,
    address: `${area}, ${city}`,
    whatsapp_number: phone,
    contact_name: 'TswanaHome listing',
    campus_ids: campus.campus_ids,
    custom_university_name: campus.custom_university_name,
    source_label: source.label,
    source_url: url,
    detail_url: null,
    photo_urls: extractGallery(html, url),
    deposit_pula: extractDeposit(plain),
    utilities_included: /utilities included|bills included|water included/i.test(plain) ? 'included' : null,
    fetched_at: now,
    last_seen_at: now,
  }, plain)
}

export async function fetchTswanahome(source, { limit = 40, deadline = null, onError } = {}) {
  const html = await fetchHtml(source.url)
  const links = [...new Set([...html.matchAll(/href="(https:\/\/www\.tswanahome\.com\/property\/[^"#]+)"/gi)].map((m) => m[1]))]
    .filter((u) => /rent/i.test(u) && !/office|warehouse|industrial|biz|shop|retail/i.test(u))

  const out = []
  for (const url of links.slice(0, limit)) {
    if (deadline && Date.now() > deadline) break
    try {
      const detail = await fetchHtml(url)
      const row = parseTswanahomeDetail(detail, url, source)
      if (row) out.push(row)
    } catch (err) {
      onError?.(url, err)
    }
  }
  return out
}

export async function fetchSource(source, options = {}) {
  if (source.kind === 'zimcompass') {
    const html = await fetchHtml(source.url)
    return parseZimcompass(html, source)
  }
  if (source.kind === 'ezilet') return fetchEzilet(source, options)
  if (source.kind === 'tswanahome') return fetchTswanahome(source, options)
  return []
}

/* ────────────────────────────── merging ────────────────────────────── */

export function dedupe(listings) {
  const map = new Map()
  for (const row of listings) {
    const key = listingKey(row)
    if (!key || key.startsWith('|')) continue
    const prev = map.get(key)
    if (!prev) {
      map.set(key, row)
      continue
    }
    const prevPhotos = prev.photo_urls?.length || 0
    const nextPhotos = row.photo_urls?.length || 0
    const prevSeen = Date.parse(prev.last_seen_at || prev.fetched_at || 0) || 0
    const nextSeen = Date.parse(row.last_seen_at || row.fetched_at || 0) || 0
    if (nextPhotos > prevPhotos || nextSeen >= prevSeen) {
      map.set(key, {
        ...prev,
        ...row,
        fetched_at: prev.fetched_at || row.fetched_at,
        last_seen_at: row.last_seen_at || prev.last_seen_at || row.fetched_at,
        photo_urls: nextPhotos >= prevPhotos ? row.photo_urls : prev.photo_urls,
        amenities: (row.amenities?.length || 0) >= (prev.amenities?.length || 0) ? row.amenities : prev.amenities,
        lat: row.lat ?? prev.lat,
        lng: row.lng ?? prev.lng,
      })
    }
  }
  const byKey = [...map.values()]
  const byId = new Map()
  for (const row of byKey) {
    const id = String(row.id || '')
    if (!id) continue
    const prev = byId.get(id)
    if (!prev) {
      byId.set(id, row)
      continue
    }
    const prevPhotos = prev.photo_urls?.length || 0
    const nextPhotos = row.photo_urls?.length || 0
    byId.set(id, nextPhotos >= prevPhotos ? { ...prev, ...row, photo_urls: row.photo_urls, amenities: row.amenities?.length ? row.amenities : prev.amenities } : prev)
  }
  return [...byId.values()]
}

/** Merge a fresh crawl with the previous feed; drop rows unseen for KEEP_DAYS. */
export function mergeWithPrevious(fresh, previous = []) {
  const cutoff = Date.now() - KEEP_DAYS * 24 * 60 * 60 * 1000
  const freshKeys = new Set(fresh.map(listingKey))

  const carried = []
  for (const row of previous) {
    if (freshKeys.has(listingKey(row))) continue
    const seen = Date.parse(row.last_seen_at || row.fetched_at || 0) || 0
    if (seen < cutoff) continue
    // Rows saved before amenity/geo extraction existed still need enriching.
    carried.push(row.lat == null || !row.amenities ? enrich(row) : row)
  }

  return dedupe([...fresh, ...carried])
}
