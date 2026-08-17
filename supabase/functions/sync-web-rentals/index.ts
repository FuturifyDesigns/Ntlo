/**
 * Daily Botswana student-rental sync.
 *
 * Crawls public Botswana classifieds, extracts student-suitable rooms with
 * photo galleries, amenities and approximate map pins, then upserts them into
 * public.web_rental_listings so ntlo.online picks them up without a redeploy.
 *
 * Invoke:  POST /functions/v1/sync-web-rentals
 * Auth:    Authorization: Bearer <service_role JWT>
 * Body:    { "budgetMs": 240000, "detailLimit": 40, "dryRun": false }
 */
import { createClient } from 'jsr:@supabase/supabase-js@2'
import {
  SOURCES,
  KEEP_DAYS,
  fetchSource,
  hydrateZimcompassDetails,
  dedupe,
} from '../_shared/rental-parser.js'

type SyncError = { source: string; error: string }

const DEFAULT_BUDGET_MS = 240_000
const PHOTO_BUCKET = 'web-rental-photos'

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body, null, 2), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })
}

/**
 * Mirror remote photos into Supabase Storage. Classified sites block hotlinking
 * and rotate URLs, so a local copy is what keeps galleries working long-term.
 */
async function mirrorPhotos(
  supabase: ReturnType<typeof createClient>,
  rows: Record<string, unknown>[],
  deadline: number,
) {
  let mirrored = 0

  for (const row of rows) {
    const urls = (row.photo_urls as string[] | undefined) ?? []
    if (!urls.length) continue
    if (Date.now() > deadline) break

    const local: string[] = []
    for (const [i, remote] of urls.entries()) {
      if (Date.now() > deadline) break
      if (!/^https?:\/\//i.test(remote)) {
        local.push(remote)
        continue
      }

      const ext = remote.split('?')[0].match(/\.(jpe?g|png|webp)$/i)?.[1]?.toLowerCase() ?? 'jpg'
      const path = `${String(row.id).replace(/[^a-zA-Z0-9_-]+/g, '-').slice(0, 80)}-${i}.${ext}`

      try {
        const res = await fetch(remote, {
          headers: {
            'User-Agent': 'NtloStudentHousingBot/1.0 (+https://ntlo.online)',
            Accept: 'image/*',
            Referer: new URL(remote).origin + '/',
          },
        })
        if (!res.ok) continue
        const buf = new Uint8Array(await res.arrayBuffer())
        if (buf.byteLength < 800) continue

        const { error } = await supabase.storage
          .from(PHOTO_BUCKET)
          .upload(path, buf, {
            contentType: res.headers.get('content-type') ?? `image/${ext}`,
            upsert: true,
          })
        if (error) continue

        const { data } = supabase.storage.from(PHOTO_BUCKET).getPublicUrl(path)
        local.push(data.publicUrl)
        mirrored += 1
      } catch {
        // Keep the remote URL as a fallback rather than losing the photo.
      }
    }

    if (local.length) row.photo_urls = local
  }

  return mirrored
}

function bearerToken(req: Request) {
  const header = req.headers.get('Authorization') || ''
  return header.replace(/^Bearer\s+/i, '').trim()
}

function jwtRole(token: string) {
  try {
    const payload = token.split('.')[1]
    if (!payload) return null
    const padded = payload.replace(/-/g, '+').replace(/_/g, '/') + '==='.slice((payload.length + 3) % 4)
    const parsed = JSON.parse(atob(padded)) as { role?: string }
    return parsed.role ?? null
  } catch {
    return null
  }
}

Deno.serve(async (req) => {
  const supabaseUrl = Deno.env.get('SUPABASE_URL')
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
  if (!supabaseUrl || !serviceKey) {
    return json({ ok: false, error: 'Missing SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY' }, 500)
  }

  // Gateway already verified the JWT signature (verify_jwt = true).
  // Only the service_role key may trigger a crawl.
  if (jwtRole(bearerToken(req)) !== 'service_role') {
    return json({ ok: false, error: 'Unauthorized' }, 401)
  }

  let options: Record<string, unknown> = {}
  try {
    options = req.method === 'POST' ? await req.json() : {}
  } catch {
    options = {}
  }

  const budgetMs = Number(options.budgetMs ?? DEFAULT_BUDGET_MS)
  const detailLimit = Number(options.detailLimit ?? 40)
  const dryRun = Boolean(options.dryRun)
  const deadline = Date.now() + budgetMs

  const supabase = createClient(supabaseUrl, serviceKey, {
    auth: { persistSession: false },
  })

  const startedAt = new Date().toISOString()
  const errors: SyncError[] = []
  const collected: Record<string, unknown>[] = []

  for (const source of SOURCES) {
    if (Date.now() > deadline) {
      errors.push({ source: source.id, error: 'skipped: time budget exhausted' })
      continue
    }
    try {
      const rows = await fetchSource(source, {
        deadline,
        onError: (url: string, err: unknown) =>
          errors.push({ source: source.id, error: `${url}: ${String((err as Error)?.message ?? err)}` }),
      })
      collected.push(...rows)
    } catch (err) {
      errors.push({ source: source.id, error: String((err as Error)?.message ?? err) })
    }
  }

  // Second pass for ZimCompass galleries — the results grid only exposes one thumbnail.
  try {
    await hydrateZimcompassDetails(collected, {
      limit: detailLimit,
      deadline,
      onError: (url: string, err: unknown) =>
        errors.push({ source: 'zimcompass-detail', error: `${url}: ${String((err as Error)?.message ?? err)}` }),
    })
  } catch (err) {
    errors.push({ source: 'zimcompass-detail', error: String((err as Error)?.message ?? err) })
  }

  const listings = dedupe(collected)

  if (dryRun) {
    return json({
      ok: true,
      dryRun: true,
      fresh_count: listings.length,
      with_photos: listings.filter((l) => (l.photo_urls as string[])?.length).length,
      with_amenities: listings.filter((l) => (l.amenities as string[])?.length).length,
      with_coords: listings.filter((l) => l.lat != null).length,
      errors,
      sample: listings.slice(0, 3),
    })
  }

  const mirrored = await mirrorPhotos(supabase, listings, deadline)

  let upserted = 0
  if (listings.length) {
    const { data, error } = await supabase.rpc('upsert_web_rentals', { p_listings: listings })
    if (error) {
      await supabase.from('web_rental_sync_runs').insert({
        started_at: startedAt,
        finished_at: new Date().toISOString(),
        fresh_count: listings.length,
        errors: [...errors, { source: 'upsert', error: error.message }],
        ok: false,
      })
      return json({ ok: false, error: error.message, errors }, 500)
    }
    upserted = Number(data ?? 0)
  }

  // Only prune once a run actually found listings, so a bad crawl can't empty the site.
  let pruned = 0
  if (listings.length > 0) {
    const { data } = await supabase.rpc('prune_web_rentals', { p_keep_days: KEEP_DAYS })
    pruned = Number(data ?? 0)
  }

  const { count: total } = await supabase
    .from('web_rental_listings')
    .select('id', { count: 'exact', head: true })

  await supabase.from('web_rental_sync_runs').insert({
    started_at: startedAt,
    finished_at: new Date().toISOString(),
    fresh_count: listings.length,
    total_count: total ?? 0,
    pruned_count: pruned,
    errors,
    ok: true,
  })

  return json({
    ok: true,
    fresh_count: listings.length,
    upserted,
    photos_mirrored: mirrored,
    pruned,
    total_count: total ?? 0,
    error_count: errors.length,
    errors: errors.slice(0, 20),
  })
})
