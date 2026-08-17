/** Botswana student-rentable rooms from public classifieds — shown as external listings. */
import { isUniversityNameQuery, pickPrimaryUniversityMatch } from '../lib/universitySearch'
import { listingDedupeKey, resolveLiveCampusId } from '../lib/campusAttribution'
import { getUniversityById } from '../lib/universities'

const NOW = '2026-08-01T09:00:00.000Z'

const CAMPUS = {
  ub: {
    id: 1,
    short_name: 'University of Botswana',
    name: 'University of Botswana',
    slug: 'university-of-botswana',
    city: 'Gaborone',
    lat: -24.6576,
    lng: 25.9398,
  },
  biust: {
    id: 2,
    short_name: 'BIUST',
    name: 'Botswana International University of Science and Technology',
    slug: 'biust',
    city: 'Palapye',
    lat: -22.5972,
    lng: 27.1220,
  },
  botho: {
    id: 3,
    short_name: 'Botho University',
    name: 'Botho University',
    slug: 'botho-university',
    city: 'Gaborone',
    lat: -24.6846,
    lng: 25.8783,
  },
  limkokwing: {
    id: 4,
    short_name: 'Limkokwing',
    name: 'Limkokwing University College',
    slug: 'limkokwing',
    city: 'Gaborone',
    lat: -24.6225,
    lng: 25.8928,
  },
  baisago: {
    id: 5,
    short_name: 'Ba Isago University',
    name: 'Ba Isago University',
    slug: 'ba-isago',
    city: 'Gaborone',
    lat: -24.6570,
    lng: 25.9020,
  },
  bac: {
    id: 9,
    short_name: 'Botswana Accountancy College',
    name: 'Botswana Accountancy College',
    slug: 'botswana-accountancy-college',
    city: 'Gaborone',
    lat: -24.6576,
    lng: 25.9080,
  },
  boitekanelo: {
    id: 10,
    short_name: 'Boitekanelo college',
    name: 'Boitekanelo college',
    slug: 'boitekanelo-college',
    city: 'Tlokweng',
    lat: -24.6680,
    lng: 25.9710,
  },
}

function webListing({
  id,
  title,
  description,
  price,
  room_type = 'sharing',
  gender_preference = 'any',
  area,
  city,
  address,
  whatsapp_number,
  contact_name,
  campus = null,
  campus_ids = null,
  custom_university_name = null,
  source_label = 'Botswana student classifieds',
  source_url = 'https://bw.zimcompass.com/house-share',
  amenities = [],
  deposit_pula = null,
  utilities_included = null,
  photo_urls = [],
  distance_to_campus = null,
  lat = null,
  lng = null,
  geo_precision = null,
}) {
  const primary = campus || null
  const ids = campus_ids || (primary ? [primary.id] : [])
  return {
    id: `web-${id}`,
    landlord_id: null,
    title,
    description,
    price,
    room_type,
    gender_preference,
    address: address || `${area}, ${city}`,
    area,
    city,
    lat,
    lng,
    geo_precision,
    nearest_university_id: primary?.id ?? null,
    custom_university_name: primary ? null : custom_university_name,
    custom_university_city: primary ? null : city,
    distance_to_campus,
    campus_ids: ids,
    amenities,
    whatsapp_number,
    available: true,
    occupancy_status: 'available',
    is_verified: false,
    landlord_verified: false,
    landlord_display_name: contact_name,
    featured: false,
    verification_status: 'approved',
    listing_origin: 'external',
    external_contact_name: contact_name,
    external_source_label: source_label,
    external_source_url: source_url,
    deposit_pula,
    utilities_included,
    house_rules: 'Confirm availability, rent, and viewing with the contact on WhatsApp. Ntlo does not process payments for web listings.',
    views: 0,
    created_at: NOW,
    updated_at: NOW,
    nearest_university: primary,
    landlord: null,
    listing_photos: photo_urls.map((url, i) => ({
      id: `web-photo-${id}-${i}`,
      url,
      is_cover: i === 0,
      display_order: i,
    })),
  }
}

export const WEB_RENTALS = [
  webListing({
    id: 'ub-ext10-female',
    title: 'Student room share near UB — Extension 10',
    description:
      'Student-friendly room share in Extension 10, Gaborone — short trip to University of Botswana. Ideal for students needing a shared room with basic utilities. Confirm current rent and vacancy on WhatsApp before visiting.',
    price: 1400,
    area: 'Extension 10',
    city: 'Gaborone',
    address: 'Extension 10, Gaborone',
    whatsapp_number: '26771557655',
    contact_name: 'Frank',
    campus: CAMPUS.ub,
    campus_ids: [CAMPUS.ub.id, 7],
    amenities: ['kitchen'],
    distance_to_campus: 1.2,
  }),
  webListing({
    id: 'ub-ext10-alt',
    title: 'Shared student room Block 5 — near campus routes',
    description:
      'Looking for students (two females or two males) to share a room in Block 5, Gaborone. Two single beds. Rent P1,400. Good option for UB / city campus students. Finder\'s fee may apply — ask on WhatsApp.',
    price: 1400,
    area: 'Block 5',
    city: 'Gaborone',
    whatsapp_number: '26774819458',
    contact_name: 'Botswana',
    campus: CAMPUS.ub,
    campus_ids: [CAMPUS.ub.id, CAMPUS.botho.id, CAMPUS.limkokwing.id],
    amenities: ['kitchen'],
    distance_to_campus: 2.5,
  }),
  webListing({
    id: 'ub-phase2',
    title: 'Student room Phase 2 near BTC — Gaborone',
    description:
      'Room in a 4-bedroom house in Phase 2 near BTC. Shared bathroom/kitchen/sitting room. Suitable for university students. Available now — confirm on WhatsApp.',
    price: 1300,
    area: 'Phase 2',
    city: 'Gaborone',
    address: 'Phase 2 near BTC',
    whatsapp_number: '26771487257',
    contact_name: 'Pauline',
    campus: CAMPUS.ub,
    campus_ids: [CAMPUS.ub.id, CAMPUS.botho.id],
    amenities: ['kitchen'],
    distance_to_campus: 3.5,
  }),
  webListing({
    id: 'ub-new-canada',
    title: 'Student room — New Canada (near UB side)',
    description:
      'Room in a 3-bedroom BHC house at New Canada, Gaborone. Walled yard. Popular with students looking for quieter housing outside the CBD. Rent P1,500 — ask about move-in date.',
    price: 1500,
    area: 'New Canada',
    city: 'Gaborone',
    whatsapp_number: '26776001754',
    contact_name: 'Boineelo',
    campus: CAMPUS.ub,
    campus_ids: [CAMPUS.ub.id, 8],
    distance_to_campus: 6,
  }),
  webListing({
    id: 'botho-block7',
    title: 'Student house share Block 7 — near Botho / Enco',
    description:
      'Share a house in Block 7 next to Enco / Botho University area. Your share P2,000 + ~P1,000 security. Built for students who need to be close to Botho and Gaborone campuses. Confirm vacancy before paying anything.',
    price: 2000,
    area: 'Block 7',
    city: 'Gaborone',
    address: 'Block 7 near Enco / Botho',
    whatsapp_number: '26772900189',
    contact_name: 'Appeal',
    campus: CAMPUS.botho,
    campus_ids: [CAMPUS.botho.id, CAMPUS.ub.id, CAMPUS.limkokwing.id],
    deposit_pula: 1000,
    distance_to_campus: 0.8,
  }),
  webListing({
    id: 'botho-block6',
    title: 'Student-friendly 2.5 share — Block 6',
    description:
      'Second-and-half to share in Block 6 behind Bonnington Junior School. Walled yard. Rent P1,250 + security. Handy for Botho, Ba Isago and UB students using Gaborone routes. Viewing available.',
    price: 1250,
    area: 'Block 6',
    city: 'Gaborone',
    address: 'Block 6 behind Bonnington Junior School',
    whatsapp_number: '26772351501',
    contact_name: 'Aubrey',
    campus: CAMPUS.botho,
    campus_ids: [CAMPUS.botho.id, CAMPUS.baisago.id, CAMPUS.ub.id],
    deposit_pula: 1250,
    distance_to_campus: 2,
  }),
  webListing({
    id: 'limkokwing-block7',
    title: 'Student room Block 7 — Limkokwing / city campuses',
    description:
      'Air-conditioned room in a fitted 3-bedroom house. Electric fence, geyser, paved yard. Strong option for Limkokwing and nearby Gaborone tertiary students. Rent P1,600 + P750 security.',
    price: 1600,
    area: 'Gaborone',
    city: 'Gaborone',
    whatsapp_number: '26773458500',
    contact_name: 'Mpho',
    campus: CAMPUS.limkokwing,
    campus_ids: [CAMPUS.limkokwing.id, CAMPUS.botho.id, CAMPUS.ub.id],
    amenities: ['security'],
    deposit_pula: 750,
    distance_to_campus: 2.2,
  }),
  webListing({
    id: 'bac-walkable',
    title: 'Student room walkable to BAC',
    description:
      'Affordable room share walkable to Botswana Accountancy College. Your share about P600 + security (payable over 2–3 months). Confirm details and availability on WhatsApp — budget-friendly for BAC students.',
    price: 600,
    area: 'Gaborone',
    city: 'Gaborone',
    address: 'Near BAC',
    whatsapp_number: '26776325612',
    contact_name: 'Tlamelo',
    campus: CAMPUS.bac,
    campus_ids: [CAMPUS.bac.id, CAMPUS.ub.id],
    distance_to_campus: 0.9,
  }),
  webListing({
    id: 'buan-ledumadumane',
    title: 'Student share Ledumadumane — near Pula Spar',
    description:
      'Room to share in Ledumadumane near Pula Spar. Rent P1,330 including water and electricity. Security P1,100. Useful for BUAN / Sebele-side students and anyone commuting into Gaborone campuses.',
    price: 1330,
    area: 'Ledumadumane',
    city: 'Gaborone',
    address: 'Ledumadumane near Pula Spar',
    whatsapp_number: '26771746344',
    contact_name: 'Elsa',
    campus: { id: 8, short_name: 'BUAN', name: 'Botswana University of Agriculture and Natural Resources', slug: 'botswana-university-of-agriculture-and-natural-resources', city: 'Gaborone' },
    campus_ids: [8, CAMPUS.ub.id],
    amenities: ['water'],
    deposit_pula: 1100,
    utilities_included: 'included',
    distance_to_campus: 4,
  }),
  webListing({
    id: 'tlokweng-students',
    title: 'Ensuite student rooms — Tlokweng (Oasis)',
    description:
      'Rooms with individual ensuites to share in Tlokweng by the main road opposite Oasis Motel. Open plan kitchen/living. Suitable for Boitekanelo and Gaborone campus students. Confirm price and vacancy on WhatsApp.',
    price: 2500,
    room_type: 'self_contained',
    area: 'Tlokweng',
    city: 'Gaborone',
    address: 'Tlokweng opposite Oasis Motel',
    whatsapp_number: '26776968183',
    contact_name: 'Lefika',
    campus: CAMPUS.boitekanelo,
    campus_ids: [CAMPUS.boitekanelo.id, CAMPUS.ub.id],
    amenities: ['kitchen', 'security'],
    distance_to_campus: 1.5,
  }),
  webListing({
    id: 'mogoditshane-students',
    title: 'Student apartment share — Mogoditshane',
    description:
      'Two-bedroom apartment to share in Mogoditshane by Tsabong robots. Your share P1,750 + security. Common choice for students who prefer Mogoditshane pricing while studying in Gaborone.',
    price: 1750,
    area: 'Mogoditshane',
    city: 'Gaborone',
    address: 'Mogoditshane by Tsabong robots',
    whatsapp_number: '26774247384',
    contact_name: 'Kristie',
    campus: CAMPUS.botho,
    campus_ids: [CAMPUS.botho.id, CAMPUS.ub.id, CAMPUS.baisago.id],
    deposit_pula: 1750,
    distance_to_campus: 8,
  }),
  webListing({
    id: 'broadhurst-student',
    title: 'Student single room — Broadhurst Ext 27',
    description:
      'Single room / servant\'s quarters Broadhurst Ext 27 near KBL and Sefalana. Rent P1,300 includes water and electricity. Extra if sharing with a partner. Solid option for ABM / city students needing a private room.',
    price: 1300,
    room_type: 'single',
    area: 'Broadhurst Ext 27',
    city: 'Gaborone',
    address: 'Broadhurst Ext 27 near KBL',
    whatsapp_number: '26776104760',
    contact_name: 'Joseph',
    campus: { id: 6, short_name: 'ABM University College', name: 'ABM University College', slug: 'abm-university', city: 'Gaborone' },
    campus_ids: [6, CAMPUS.ub.id, CAMPUS.botho.id],
    amenities: ['water'],
    deposit_pula: 1300,
    utilities_included: 'included',
    distance_to_campus: 5,
  }),
  webListing({
    id: 'broadhurst-student-2',
    title: 'Student SQ Broadhurst Ext 27 (alt contact)',
    description:
      'Servant\'s quarters Broadhurst Ext 27 near KBL / Park 27. P1,300 includes water and power. Master bedroom in main house also listed around P1,800. WhatsApp for viewing — students welcome.',
    price: 1300,
    room_type: 'single',
    area: 'Broadhurst Ext 27',
    city: 'Gaborone',
    whatsapp_number: '26778439391',
    contact_name: 'Fearles',
    campus: CAMPUS.ub,
    campus_ids: [CAMPUS.ub.id, 6, CAMPUS.botho.id],
    amenities: ['water'],
    utilities_included: 'included',
    distance_to_campus: 5,
  }),
  webListing({
    id: 'gabane-students',
    title: 'Student rooms Gabane — Route 3',
    description:
      '3-bedroom house to share in Gabane near Gabane Primary / Route 3. Fitted kitchen, electric fence, motorized gate. P1,000 per room — popular with students commuting into Gaborone.',
    price: 1000,
    area: 'Gabane',
    city: 'Gabane',
    address: 'Gabane near Gabane Primary / Route 3',
    whatsapp_number: '26771817707',
    contact_name: 'Hero',
    campus: CAMPUS.botho,
    campus_ids: [CAMPUS.botho.id, CAMPUS.ub.id, CAMPUS.baisago.id],
    amenities: ['security', 'kitchen'],
    distance_to_campus: 12,
  }),
  webListing({
    id: 'gabane-budget-student',
    title: 'Budget student share — Gabane secure yard',
    description:
      '2-bedroom house share in a secure Gabane yard. Spare room with wardrobe & curtains. Single student preferred. Share kitchen & bathroom, hot water. Near Gabane routes 1 & 3. Share P900.',
    price: 900,
    area: 'Gabane',
    city: 'Gabane',
    whatsapp_number: '26774215618',
    contact_name: 'Car',
    campus: CAMPUS.ub,
    campus_ids: [CAMPUS.ub.id, CAMPUS.botho.id],
    amenities: ['kitchen'],
    distance_to_campus: 12,
  }),
  webListing({
    id: 'thito-students',
    title: 'Student house share near Tawana Primary',
    description:
      'Share a 3-bedroom house near Tawana Primary. Fitted kitchen/bathroom, tiles, hot water. Your share P1,500 + P500 security. Open to students — confirm viewing on WhatsApp.',
    price: 1500,
    area: 'Thito',
    city: 'Gaborone',
    address: 'Near Tawana Primary',
    whatsapp_number: '26772745765',
    contact_name: 'Christopher',
    campus: CAMPUS.ub,
    campus_ids: [CAMPUS.ub.id, CAMPUS.botho.id],
    amenities: ['kitchen'],
    deposit_pula: 500,
    distance_to_campus: 4,
  }),
  webListing({
    id: 'francistown-ub-student',
    title: 'Student house Francistown — near UB Francistown',
    description:
      '3 beds to share in Francistown (Satellite area). Students at University of Botswana Francistown Campus / Clifton welcome. Call or WhatsApp to confirm rent and viewing. Botswana only.',
    price: 1200,
    area: 'Satellite',
    city: 'Francistown',
    address: 'Francistown Satellite',
    whatsapp_number: '26775400246',
    contact_name: 'Tshepo',
    custom_university_name: 'University of Botswana — Francistown Campus',
    campus_ids: [],
    amenities: ['kitchen'],
    source_label: 'Botswana student classifieds',
  }),
]

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export function isWebRentalId(id) {
  return typeof id === 'string' && (id.startsWith('web-') || id.startsWith('auto-'))
}

/**
 * Web/feed listings use slug ids, not uuids. Postgres rejects them with 22P02,
 * so every uuid-column query must be skipped for these.
 */
export function isDatabaseListingId(id) {
  return typeof id === 'string' && UUID_RE.test(id)
}

/** Live auto-synced catalog (filled by useWebRentalsFeed). */
let liveWebCatalog = []

export function setLiveWebRentalsCatalog(rows) {
  liveWebCatalog = Array.isArray(rows) ? rows : []
}

function photoCount(row) {
  return Array.isArray(row?.listing_photos) ? row.listing_photos.length : 0
}

/** Richer row wins: gallery size first, then amenities, then a map pin. */
function richness(row) {
  return photoCount(row) * 10
    + (row?.amenities?.length || 0) * 2
    + (row?.lat != null && row?.lng != null ? 1 : 0)
}

/** Prefer live/feed rows over seed when collapsing duplicates. */
function preferListing(a, b) {
  if (!a) return b
  if (!b) return a
  const ra = richness(a)
  const rb = richness(b)
  if (rb !== ra) return rb > ra ? b : a
  // Prefer auto-synced feed ids over static seed ids
  const aLive = String(a.id || '').startsWith('auto-')
  const bLive = String(b.id || '').startsWith('auto-')
  if (aLive !== bLive) return bLive ? b : a
  return b
}

export function getAllWebRentals() {
  const byId = new Map()
  for (const row of [...WEB_RENTALS, ...liveWebCatalog]) {
    if (!row?.id) continue
    byId.set(row.id, row)
  }
  // Collapse same room across seed + feed (different ids, same WhatsApp + price).
  const byRoom = new Map()
  for (const row of byId.values()) {
    const key = listingDedupeKey(row) || row.id
    byRoom.set(key, preferListing(byRoom.get(key), row))
  }
  return [...byRoom.values()]
}

export function getWebRentalById(id) {
  if (!isWebRentalId(id)) return null
  return getAllWebRentals().find((l) => l.id === id) || null
}

const CAMPUS_BY_ID = Object.fromEntries(
  Object.values(CAMPUS).map((c) => [c.id, c])
)
CAMPUS_BY_ID[6] = { id: 6, short_name: 'ABM University College', name: 'ABM University College', slug: 'abm-university', city: 'Gaborone', lat: -24.6580, lng: 25.9180 }
CAMPUS_BY_ID[7] = { id: 7, short_name: 'Gaborone University College', name: 'Gaborone University College', slug: 'guc', city: 'Gaborone', lat: -24.6732, lng: 25.9221 }
CAMPUS_BY_ID[8] = { id: 8, short_name: 'BUAN', name: 'Botswana University of Agriculture and Natural Resources', slug: 'botswana-university-of-agriculture-and-natural-resources', city: 'Gaborone', lat: -24.5900, lng: 25.9410 }

/** Convert auto-sync feed JSON rows into listing objects. */
export function feedItemToListing(item) {
  if (!item?.whatsapp_number || !item?.title) return null
  const priceOnRequest = Boolean(item.price_on_request) || item.price == null || item.price === ''
  const price = priceOnRequest ? null : Number(item.price)
  if (!priceOnRequest && (!Number.isFinite(price) || price <= 0)) return null
  const campusIds = Array.isArray(item.campus_ids) ? item.campus_ids.map(Number).filter(Boolean) : []
  const primaryId = campusIds[0] || null
  const campus = primaryId ? CAMPUS_BY_ID[primaryId] : null
  const id = String(item.id || '').startsWith('web-') || String(item.id || '').startsWith('auto-')
    ? String(item.id)
    : `auto-${item.id || item.whatsapp_number}`

  return webListing({
    id: id.replace(/^web-/, '').replace(/^auto-/, ''),
    title: item.title,
    description: item.description || item.title,
    price,
    room_type: item.room_type || 'sharing',
    gender_preference: item.gender_preference || 'any',
    area: item.area || item.city || 'Gaborone',
    city: item.city || 'Gaborone',
    address: item.address,
    whatsapp_number: String(item.whatsapp_number).replace(/\D/g, ''),
    contact_name: item.contact_name || 'Contact',
    campus,
    campus_ids: campusIds,
    custom_university_name: item.custom_university_name || null,
    source_label: item.source_label || 'Auto-synced Botswana classifieds',
    source_url: item.source_url || 'https://bw.zimcompass.com/house-share',
    amenities: item.amenities || [],
    deposit_pula: item.deposit_pula ?? null,
    utilities_included: item.utilities_included ?? null,
    photo_urls: item.photo_urls || [],
    distance_to_campus: item.distance_to_campus ?? null,
    lat: item.lat ?? null,
    lng: item.lng ?? null,
    geo_precision: item.geo_precision ?? null,
  })
}

export function filterWebRentals(filters = {}, catalog = null) {
  const {
    universityId,
    minPrice,
    maxPrice,
    roomType,
    genderPreference,
    search,
    availableOnly = false,
    verifiedOnly = false,
    landlordId,
    amenities = [],
  } = filters

  if (landlordId || verifiedOnly) return []

  let rows = [...(catalog || getAllWebRentals())]

  // Strict: selected campus must be the listing's primary university only.
  if (universityId && universityId !== 'other') {
    const uid = Number(universityId)
    const liveUni = getUniversityById(uid)
    rows = rows.filter((l) => {
      const liveId = resolveLiveCampusId(l)
      if (liveId != null && liveId === uid) return true
      if (liveUni?.slug && l.nearest_university?.slug === liveUni.slug) return true
      return Number(l.nearest_university_id) === uid
    })
  } else if (universityId === 'other') {
    rows = rows.filter((l) => !l.nearest_university_id && l.custom_university_name)
  }

  if (availableOnly) {
    rows = rows.filter((l) => l.occupancy_status === 'available')
  }
  if (minPrice) rows = rows.filter((l) => l.price != null && l.price >= Number(minPrice))
  if (maxPrice) rows = rows.filter((l) => l.price != null && l.price <= Number(maxPrice))
  if (roomType) rows = rows.filter((l) => l.room_type === roomType)
  if (genderPreference && genderPreference !== 'any') {
    rows = rows.filter((l) => l.gender_preference === genderPreference || l.gender_preference === 'any')
  }
  if (amenities?.length) {
    rows = rows.filter((l) => amenities.every((a) => (l.amenities || []).includes(a)))
  }
  if (search?.trim()) {
    const q = search.trim()
    const uniFromSearch = !universityId ? pickPrimaryUniversityMatch(q) : null
    if (uniFromSearch && isUniversityNameQuery(q, uniFromSearch)) {
      rows = rows.filter((l) => Number(l.nearest_university_id) === Number(uniFromSearch.id))
    } else {
      const needle = q.toLowerCase()
      rows = rows.filter((l) =>
        [l.title, l.area, l.city, l.address, l.description, l.custom_university_name, l.nearest_university?.name, l.nearest_university?.short_name]
          .filter(Boolean)
          .some((v) => String(v).toLowerCase().includes(needle))
      )
    }
  }

  return rows
}

/** Merge DB listings with web rentals; skip web rooms already present in DB (same WhatsApp + price). */
export function mergeWebIntoListings(dbListings, filters = {}, { page = 0, pageSize = 12, mapMode = false, sortBy = 'newest', catalog = null } = {}) {
  const dbRaw = Array.isArray(dbListings) ? dbListings : []
  // One row per room fingerprint so Browse total matches hero "live listings".
  const dbByKey = new Map()
  for (const row of dbRaw) {
    const key = listingDedupeKey(row) || (row?.id != null ? `id:${row.id}` : null)
    if (!key) continue
    dbByKey.set(key, preferListing(dbByKey.get(key), row))
  }
  const db = [...dbByKey.values()]
  const dbKeys = new Set(dbByKey.keys())

  const webByKey = new Map()
  for (const row of filterWebRentals(filters, catalog)) {
    const key = listingDedupeKey(row) || row?.id
    if (!key || dbKeys.has(key)) continue
    webByKey.set(key, preferListing(webByKey.get(key), row))
  }
  const web = [...webByKey.values()]

  let merged = [...db, ...web]

  if (sortBy === 'price_asc') merged.sort((a, b) => (a.price ?? Number.POSITIVE_INFINITY) - (b.price ?? Number.POSITIVE_INFINITY))
  else if (sortBy === 'price_desc') merged.sort((a, b) => (b.price ?? -1) - (a.price ?? -1))
  else if (sortBy === 'distance') {
    merged.sort((a, b) => (a.distance_to_campus ?? 999) - (b.distance_to_campus ?? 999))
  } else {
    merged.sort((a, b) => {
      const fa = a.featured ? 1 : 0
      const fb = b.featured ? 1 : 0
      if (fb !== fa) return fb - fa
      return String(b.created_at).localeCompare(String(a.created_at))
    })
  }

  const total = merged.length
  if (mapMode) return { listings: merged.slice(0, 200), count: total }
  const start = page * pageSize
  return { listings: merged.slice(start, start + pageSize), count: total }
}
