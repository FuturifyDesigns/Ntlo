/**
 * Daily Botswana student-rental aggregator (build-time fallback feed).
 *
 * The primary sync now runs as the `sync-web-rentals` Supabase Edge Function,
 * which writes straight to public.web_rental_listings so new rooms appear
 * without a redeploy. This script produces the static JSON that ships with the
 * build and is used until the Edge Function has populated the table.
 *
 * Crawl logic is shared with the Edge Function via
 * supabase/functions/_shared/rental-parser.js so both stay in step.
 *
 * Run: node scripts/sync-web-rentals.mjs
 */
import { mkdirSync, writeFileSync, readFileSync, existsSync, readdirSync, unlinkSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

import {
  SOURCES,
  KEEP_DAYS,
  fetchSource,
  hydrateZimcompassDetails,
  dedupe,
  mergeWithPrevious,
} from '../supabase/functions/_shared/rental-parser.js'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = join(__dirname, '..')
const OUT = join(ROOT, 'public', 'data', 'web-rentals-feed.json')
const PHOTO_DIR = join(ROOT, 'public', 'data', 'web-rental-photos')
const PHOTO_PUBLIC_PREFIX = '/data/web-rental-photos'

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

async function mirrorPhotos(listings) {
  mkdirSync(PHOTO_DIR, { recursive: true })
  const kept = new Set()

  for (const row of listings) {
    const urls = Array.isArray(row.photo_urls) ? row.photo_urls : []
    const local = []
    for (let i = 0; i < urls.length; i += 1) {
      const remote = urls[i]
      if (!remote) continue
      if (remote.startsWith(PHOTO_PUBLIC_PREFIX) || remote.startsWith('/data/')) {
        local.push(remote)
        kept.add(remote.split('/').pop())
        continue
      }
      if (!/^https?:\/\//i.test(remote)) continue
      try {
        let res = null
        for (let attempt = 0; attempt < 3; attempt += 1) {
          try {
            res = await fetch(remote, {
              headers: {
                'User-Agent': 'NtloStudentHousingBot/1.0 (+https://ntlo.online)',
                Accept: 'image/*',
                Referer: `${new URL(remote).origin}/`,
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
    row.photo_urls = local.length
      ? local
      : urls.filter((u) => /^https?:\/\//i.test(u) || String(u).startsWith('/'))
  }

  try {
    for (const file of readdirSync(PHOTO_DIR)) {
      if (!kept.has(file)) unlinkSync(join(PHOTO_DIR, file))
    }
  } catch { /* first run — nothing to prune */ }

  return listings
}

function loadPreviousFeed() {
  if (!existsSync(OUT)) return []
  try {
    const prev = JSON.parse(readFileSync(OUT, 'utf8'))
    return Array.isArray(prev?.listings) ? prev.listings : []
  } catch {
    return []
  }
}

async function main() {
  const collected = []
  const errors = []

  for (const source of SOURCES) {
    try {
      const rows = await fetchSource(source, {
        onError: (url, err) => console.warn(`${source.id} skip ${url}:`, err.message || err),
      })
      collected.push(...rows)
      console.log(`${source.id}: ${rows.length} student-like listings`)
    } catch (err) {
      errors.push({ source: source.id, error: String(err.message || err) })
      console.error(`${source.id}:`, err.message || err)
    }
  }

  await hydrateZimcompassDetails(collected, {
    limit: 60,
    onError: (url, err) => console.warn(`zimcompass detail skip ${url}:`, err.message || err),
  })

  const previous = loadPreviousFeed()
  const freshUnique = dedupe(collected)
  const listings = mergeWithPrevious(freshUnique, previous)

  const payload = {
    updated_at: new Date().toISOString(),
    source_count: SOURCES.length,
    sources: SOURCES.map((s) => s.id),
    keep_days: KEEP_DAYS,
    listing_count: listings.length,
    fresh_count: freshUnique.length,
    carried_count: Math.max(0, listings.length - freshUnique.length),
    errors,
    listings,
  }

  mkdirSync(dirname(OUT), { recursive: true })

  if (listings.length === 0 && previous.length) {
    payload.listings = previous
    payload.listing_count = previous.length
    payload.stale = true
    payload.note = 'Kept previous feed because this run found 0 listings'
  }

  payload.listings = await mirrorPhotos(payload.listings)
  payload.listing_count = payload.listings.length
  payload.photos_mirrored = payload.listings.reduce((n, row) => n + (row.photo_urls?.length || 0), 0)
  payload.with_amenities = payload.listings.filter((row) => row.amenities?.length).length
  payload.with_coords = payload.listings.filter((row) => row.lat != null).length

  writeFileSync(OUT, `${JSON.stringify(payload, null, 2)}\n`)
  console.log(
    `Wrote ${payload.listing_count} listings `
    + `(${payload.photos_mirrored} photos, ${payload.with_amenities} with amenities, `
    + `${payload.with_coords} with map pins, fresh=${freshUnique.length}, carried=${payload.carried_count}) `
    + `-> public/data/web-rentals-feed.json`
  )
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
