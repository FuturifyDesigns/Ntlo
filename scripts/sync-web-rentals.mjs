/**
 * Fetches public Botswana house-share classifieds and writes a student rental feed.
 * Used by CI cron + local: node scripts/sync-web-rentals.mjs
 */
import { mkdirSync, writeFileSync, readFileSync, existsSync, readdirSync, unlinkSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = join(__dirname, '..')
const OUT = join(ROOT, 'public', 'data', 'web-rentals-feed.json')
const PHOTO_DIR = join(ROOT, 'public', 'data', 'web-rental-photos')
const PHOTO_PUBLIC_PREFIX = '/data/web-rental-photos'

const SOURCES = [
  {
    id: 'zimcompass-house-share',
    label: 'ZimCompass house share',
    url: 'https://bw.zimcompass.com/house-share',
  },
]

const STUDENT_HINT = /\b(student|share|sharing|room|rooms|bed|beds|ub\b|botho|campus|university|college|bac\b|biust|limkokwing|gaborone|mogoditshane|tlokweng|gabane|palapye|francistown|ledumadumane|broadhurst|block\s*\d)\b/i
const NOISE = /\b(bmw|toyota|nissan|honda|mercedes|car diagnosis|nail technician|botswana ?post|chief|zambia|mthatha|ongwediva|namibia|messenger)\b/i
const BW_CITIES = /\b(gaborone|francistown|palapye|maun|lobatse|selebi|serowe|molepolole|mogoditshane|tlokweng|gabane|kweneng|broadhurst|block\s*\d|ledumadumane|phase\s*\d|thito|satellite|molapo)\b/i

function stripTags(html) {
  return String(html || '')
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&#39;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/\s+/g, ' ')
    .trim()
}

function extractPhone(text) {
  const raw = String(text || '')
  const intl = raw.match(/(?:\+?267[\s-]*)?(7[1-9]\d{6})\b/)
  if (!intl) return null
  const national = intl[1]
  return `267${national}`
}

function extractPrice(priceText, detailsText) {
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

function guessCity(locationText, detailsText) {
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

function guessArea(locationText, detailsText, city) {
  const blob = `${locationText || ''} ${detailsText || ''}`
  const block = blob.match(/Block\s*\d+/i)
  if (block) return block[0]
  const known = blob.match(/\b(Ledumadumane|Broadhurst(?:\s*Ext\.?\s*\d+)?|Phase\s*\d+|Tlokweng|Mogoditshane|Gabane|New Canada|Thito|Satellite|Molapo|Extension\s*\d+)\b/i)
  if (known) return known[1]
  return city
}

function guessCampuses(area, city, details) {
  const blob = `${area} ${city} ${details}`.toLowerCase()
  const ids = new Set()
  if (blob.includes('botho') || blob.includes('block 7') || blob.includes('enco')) ids.add(3)
  if (blob.includes('limkokwing') || blob.includes('block 7')) ids.add(4)
  if (blob.includes('bac') || blob.includes('accountancy')) ids.add(9)
  if (blob.includes('biust') || blob.includes('palapye')) ids.add(2)
  if (blob.includes('boitekanelo') || blob.includes('tlokweng')) ids.add(10)
  if (blob.includes('buan') || blob.includes('ledumadumane') || blob.includes('sebele')) ids.add(8)
  if (blob.includes('francistown')) return { campus_ids: [], custom_university_name: 'University of Botswana — Francistown Campus' }
  if (blob.includes('ub') || blob.includes('extension 10') || blob.includes('block 5') || blob.includes('gaborone')) ids.add(1)
  if (!ids.size && city === 'Gaborone') ids.add(1)
  return { campus_ids: [...ids], custom_university_name: null }
}

function isStudentRentable(title, details, location) {
  const blob = `${title} ${details} ${location}`
  if (NOISE.test(blob)) return false
  if (!STUDENT_HINT.test(blob) && !BW_CITIES.test(blob)) return false
  if (!/\b(room|share|bed|house|apartment|flat|sq\b|servant|student)\b/i.test(blob)) return false
  return true
}

function parseZimcompass(html, source) {
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

    const city = guessCity(location, details)
    // Skip obvious non-Botswana leftovers
    if (/namibia|zambia|mthatha|ongwediva/i.test(`${location} ${details}`)) continue

    const area = guessArea(location, details, city)
    const campus = guessCampuses(area, city, details)
    const photo = img
      ? (img.startsWith('http') ? img : `https://bw.zimcompass.com${img.startsWith('/') ? '' : '/'}${img}`)
      : null
    const sourceUrl = href
      ? (href.startsWith('http') ? href : `https://bw.zimcompass.com${href.startsWith('/') ? '' : '/'}${href}`)
      : source.url

    const slug = `${phone}-${title.toLowerCase().replace(/[^a-z0-9]+/g, '-').slice(0, 40)}`
    out.push({
      id: `auto-${slug}`.replace(/-+$/g, ''),
      title: title.length > 8 ? title : `Student room share — ${area}`,
      description: `${details}\n\nStudent-friendly Botswana rental from a public classifieds post. Confirm availability, rent, and viewing on WhatsApp before visiting or paying.`,
      price,
      room_type: /single|servant|sq\b/i.test(`${title} ${details}`) ? 'single' : 'sharing',
      gender_preference: /female only|ladies only|girls only/i.test(details) ? 'female' : /male only|gents only/i.test(details) ? 'male' : 'any',
      area,
      city,
      address: location || `${area}, ${city}`,
      whatsapp_number: phone,
      contact_name: seller || 'Contact',
      campus_ids: campus.campus_ids,
      custom_university_name: campus.custom_university_name,
      source_label: source.label,
      source_url: sourceUrl,
      photo_urls: photo && !/user-silhouette|placeholder/i.test(photo) ? [photo] : [],
      deposit_pula: (() => {
        const m = details.match(/security(?:\s*deposit)?\s*P?\s*([\d,]+)/i)
        return m ? Number(m[1].replace(/,/g, '')) : null
      })(),
      utilities_included: /including (bills|water|electricity)|bills included/i.test(details) ? 'included' : null,
      fetched_at: new Date().toISOString(),
    })
  }
  return out
}

async function fetchSource(source) {
  const res = await fetch(source.url, {
    headers: {
      'User-Agent': 'NtloStudentHousingBot/1.0 (+https://ntlo.online; student accommodation aggregator)',
      Accept: 'text/html',
    },
  })
  if (!res.ok) throw new Error(`${source.id} HTTP ${res.status}`)
  const html = await res.text()
  if (source.id.startsWith('zimcompass')) return parseZimcompass(html, source)
  return []
}

function dedupe(listings) {
  const seen = new Set()
  const out = []
  for (const row of listings) {
    const key = `${row.whatsapp_number}|${row.price}|${(row.title || '').slice(0, 24).toLowerCase()}`
    if (seen.has(key)) continue
    seen.add(key)
    out.push(row)
  }
  return out
}

function photoExt(url, contentType) {
  const fromUrl = String(url || '').split('?')[0].match(/\.(jpe?g|png|webp|gif)$/i)
  if (fromUrl) return `.${fromUrl[1].toLowerCase().replace('jpeg', 'jpg')}`
  if (/png/i.test(contentType || '')) return '.png'
  if (/webp/i.test(contentType || '')) return '.webp'
  if (/gif/i.test(contentType || '')) return '.gif'
  return '.jpg'
}

function safePhotoName(listingId, index, ext) {
  const base = String(listingId || `photo-${index}`)
    .replace(/[^a-zA-Z0-9_-]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80)
  return `${base}-${index}${ext}`
}

/** Download remote covers into public/ so CSP img-src 'self' can load them on ntlo.online. */
async function mirrorPhotos(listings) {
  mkdirSync(PHOTO_DIR, { recursive: true })
  const kept = new Set()

  for (const row of listings) {
    const urls = Array.isArray(row.photo_urls) ? row.photo_urls : []
    const local = []
    for (let i = 0; i < urls.length; i += 1) {
      const remote = urls[i]
      if (!remote || !/^https?:\/\//i.test(remote)) continue
      if (remote.startsWith(PHOTO_PUBLIC_PREFIX) || remote.startsWith('/data/')) {
        local.push(remote)
        kept.add(remote.split('/').pop())
        continue
      }
      try {
        let res = null
        for (let attempt = 0; attempt < 3; attempt += 1) {
          try {
            res = await fetch(remote, {
              headers: {
                'User-Agent': 'NtloStudentHousingBot/1.0 (+https://ntlo.online)',
                Accept: 'image/*',
                Referer: 'https://bw.zimcompass.com/',
              },
            })
            if (res.ok) break
          } catch (err) {
            if (attempt === 2) throw err
            await new Promise((r) => setTimeout(r, 400 * (attempt + 1)))
          }
        }
        if (!res?.ok) {
          console.warn(`photo skip ${row.id}: HTTP ${res?.status || 'fail'}`)
          continue
        }
        const ext = photoExt(remote, res.headers.get('content-type'))
        const name = safePhotoName(row.id, i, ext)
        const buf = Buffer.from(await res.arrayBuffer())
        if (buf.length < 800) {
          console.warn(`photo skip ${row.id}: too small`)
          continue
        }
        writeFileSync(join(PHOTO_DIR, name), buf)
        kept.add(name)
        local.push(`${PHOTO_PUBLIC_PREFIX}/${name}`)
      } catch (err) {
        console.warn(`photo skip ${row.id}:`, err.message || err)
      }
    }
    row.photo_urls = local
    if (urls.length && !local.length) {
      // Keep remote URL as last resort if download failed (needs CSP allowlist).
      row.photo_urls = urls.filter((u) => /^https?:\/\//i.test(u))
    }
  }

  // Drop stale mirrored files from previous runs
  try {
    for (const file of readdirSync(PHOTO_DIR)) {
      if (!kept.has(file)) unlinkSync(join(PHOTO_DIR, file))
    }
  } catch { /* ignore */ }

  return listings
}

async function main() {
  const collected = []
  const errors = []
  for (const source of SOURCES) {
    try {
      const rows = await fetchSource(source)
      collected.push(...rows)
      console.log(`${source.id}: ${rows.length} student-like listings`)
    } catch (err) {
      errors.push({ source: source.id, error: String(err.message || err) })
      console.error(`${source.id}:`, err.message || err)
    }
  }

  let listings = dedupe(collected)
  const payload = {
    updated_at: new Date().toISOString(),
    source_count: SOURCES.length,
    listing_count: listings.length,
    errors,
    listings,
  }

  mkdirSync(dirname(OUT), { recursive: true })

  // Keep previous listings if a fetch fails hard and we got nothing new
  if (listings.length === 0 && existsSync(OUT)) {
    try {
      const prev = JSON.parse(readFileSync(OUT, 'utf8'))
      if (prev?.listings?.length) {
        payload.listings = prev.listings
        payload.listing_count = prev.listings.length
        payload.stale = true
        payload.note = 'Kept previous feed because this run found 0 listings'
      }
    } catch { /* ignore */ }
  }

  payload.listings = await mirrorPhotos(payload.listings)
  payload.listing_count = payload.listings.length
  payload.photos_mirrored = payload.listings.reduce((n, row) => n + (row.photo_urls?.length || 0), 0)

  writeFileSync(OUT, `${JSON.stringify(payload, null, 2)}\n`)
  console.log(`Wrote ${payload.listing_count} listings (${payload.photos_mirrored} photos) → public/data/web-rentals-feed.json`)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
