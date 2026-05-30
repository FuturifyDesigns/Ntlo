import { calculateDistance, formatPrice } from './utils'
import { getUniversityById } from './universities'
import { getUniversityDisplayName } from './universityNames'
import { getListingPosition } from './googleMaps'

/** Typical monthly student rent in Pula (Botswana market rough guide) */
const PRICE_GUIDE = {
  sharing: { budget: 900, typical: 1400, premium: 2200 },
  single: { budget: 1500, typical: 2400, premium: 3800 },
  self_contained: { budget: 2200, typical: 3200, premium: 5000 },
  cottage: { budget: 2800, typical: 4000, premium: 6500 },
  house: { budget: 3500, typical: 5500, premium: 9000 },
}

function scoreDistance(km) {
  if (km == null) return 55
  if (km <= 0.5) return 100
  if (km <= 1.5) return 92
  if (km <= 3) return 80
  if (km <= 5) return 65
  if (km <= 8) return 48
  return 32
}

function scorePrice(price, roomType) {
  const guide = PRICE_GUIDE[roomType] || PRICE_GUIDE.single
  if (price <= guide.budget) return 95
  if (price <= guide.typical) return 82
  if (price <= guide.premium) return 62
  return 38
}

function scoreTrust(listing) {
  let score = 50
  if (listing.is_verified) score += 30
  if (listing.landlord?.is_verified) score += 20
  return Math.min(100, score)
}

function scoreAmenities(amenities = []) {
  const wanted = ['wifi', 'water', 'security', 'furnished']
  const hits = wanted.filter((a) => amenities.includes(a)).length
  return 40 + hits * 15
}

function scoreLocationPrecision(listing) {
  const pos = getListingPosition(listing)
  if (!pos) return 40
  return pos.approximate ? 60 : 100
}

export function analyzeListing(listing, context = {}) {
  const { studentUniversityId } = context
  const uni = listing.nearest_university || getUniversityById(listing.nearest_university_id)
  const campusId = studentUniversityId || listing.nearest_university_id

  let distanceKm = listing.distance_to_campus
  if (distanceKm == null && campusId && uni?.lat && listing.lat && listing.lng) {
    const campus = getUniversityById(campusId)
    if (campus) {
      distanceKm = calculateDistance(Number(listing.lat), Number(listing.lng), campus.lat, campus.lng)
    }
  }

  const distanceScore = scoreDistance(distanceKm)
  const priceScore = scorePrice(listing.price, listing.room_type)
  const trustScore = scoreTrust(listing)
  const amenityScore = scoreAmenities(listing.amenities)
  const locationScore = scoreLocationPrecision(listing)

  const weights = { distance: 0.3, price: 0.25, trust: 0.2, amenities: 0.15, location: 0.1 }
  const overall = Math.round(
    distanceScore * weights.distance
    + priceScore * weights.price
    + trustScore * weights.trust
    + amenityScore * weights.amenities
    + locationScore * weights.location
  )

  const pros = []
  const cons = []
  const tips = []

  if (distanceKm != null && distanceKm <= 2) {
    pros.push({ key: 'nearCampus', priority: 1 })
  } else if (distanceKm != null && distanceKm > 6) {
    cons.push({ key: 'farCampus', priority: 1, meta: { km: distanceKm.toFixed(1) } })
  }

  const guide = PRICE_GUIDE[listing.room_type] || PRICE_GUIDE.single
  if (listing.price <= guide.typical) {
    pros.push({ key: 'goodPrice', priority: 2 })
  } else if (listing.price > guide.premium) {
    cons.push({ key: 'highPrice', priority: 2 })
  }

  if (listing.is_verified || listing.landlord?.is_verified) {
    pros.push({ key: 'verified', priority: 1 })
  } else {
    tips.push({ key: 'askVerification' })
  }

  if (listing.amenities?.includes('wifi')) pros.push({ key: 'hasWifi', priority: 3 })
  if (!listing.amenities?.includes('wifi')) tips.push({ key: 'confirmWifi' })

  const pos = getListingPosition(listing)
  if (pos?.approximate) {
    tips.push({ key: 'approxLocation' })
  }

  if (!listing.description || listing.description.length < 40) {
    tips.push({ key: 'limitedDescription' })
  }

  if (studentUniversityId && listing.nearest_university_id && studentUniversityId !== listing.nearest_university_id) {
    cons.push({ key: 'differentCampus', priority: 2, meta: { campus: getUniversityDisplayName(uni) || 'another campus' } })
  }

  const label =
    overall >= 85 ? 'excellent'
      : overall >= 70 ? 'good'
        : overall >= 55 ? 'fair'
          : 'caution'

  return {
    overall,
    label,
    scores: { distance: distanceScore, price: priceScore, trust: trustScore, amenities: amenityScore, location: locationScore },
    distanceKm,
    campusName: getUniversityDisplayName(uni),
    pros: pros.sort((a, b) => a.priority - b.priority).slice(0, 4),
    cons: cons.sort((a, b) => a.priority - b.priority).slice(0, 3),
    tips: tips.slice(0, 3),
    priceGuide: guide,
  }
}

export function compareListings(listings, context = {}) {
  if (!listings?.length) return { ranked: [], summary: null }

  const analyzed = listings.map((listing) => ({
    listing,
    analysis: analyzeListing(listing, context),
  }))

  analyzed.sort((a, b) => b.analysis.overall - a.analysis.overall)

  const best = analyzed[0]
  const cheapest = [...analyzed].sort((a, b) => a.listing.price - b.listing.price)[0]
  const closest = [...analyzed].sort((a, b) => {
    const da = a.analysis.distanceKm ?? 999
    const db = b.analysis.distanceKm ?? 999
    return da - db
  })[0]

  let summaryKey = 'compareDefault'
  const meta = { title: best.listing.title, score: best.analysis.overall }

  if (best.listing.id === closest.listing.id && best.listing.id !== cheapest.listing.id) {
    summaryKey = 'compareBestOverall'
  } else if (cheapest.listing.id !== best.listing.id && closest.listing.id !== best.listing.id) {
    summaryKey = 'compareMixed'
    meta.cheapest = cheapest.listing.title
    meta.cheapestPrice = formatPrice(cheapest.listing.price)
    meta.closest = closest.listing.title
    meta.closestKm = closest.analysis.distanceKm?.toFixed(1) ?? '?'
  }

  return {
    ranked: analyzed,
    bestId: best.listing.id,
    cheapestId: cheapest.listing.id,
    closestId: closest.listing.id,
    summaryKey,
    meta,
  }
}

export function coachLandlordListing(form, { photoCount = 0, marketListings = [] } = {}) {
  const suggestions = []
  const price = Number(form.price)

  if (!form.title || form.title.length < 12) {
    suggestions.push({ key: 'titleShort', severity: 'warning' })
  }
  if (!form.description || form.description.length < 60) {
    suggestions.push({ key: 'descriptionShort', severity: 'warning' })
  }
  if (photoCount < 3) {
    suggestions.push({ key: 'morePhotos', severity: 'important', meta: { count: photoCount } })
  }
  if (!form.lat || !form.lng) {
    suggestions.push({ key: 'dropPin', severity: 'important' })
  }

  const guide = PRICE_GUIDE[form.room_type] || PRICE_GUIDE.single
  if (price && price < guide.budget * 0.7) {
    suggestions.push({ key: 'priceLow', severity: 'tip', meta: { typical: formatPrice(guide.typical) } })
  }
  if (price && price > guide.premium * 1.2) {
    suggestions.push({ key: 'priceHigh', severity: 'warning', meta: { typical: formatPrice(guide.typical) } })
  }

  if (marketListings.length >= 3) {
    const avg = marketListings.reduce((s, l) => s + l.price, 0) / marketListings.length
    if (price && price > avg * 1.25) {
      suggestions.push({
        key: 'aboveMarket',
        severity: 'warning',
        meta: { avg: formatPrice(Math.round(avg)) },
      })
    }
  }

  if (!form.amenities?.includes('wifi')) {
    suggestions.push({ key: 'addWifi', severity: 'tip' })
  }
  if (!form.amenities?.includes('security')) {
    suggestions.push({ key: 'addSecurity', severity: 'tip' })
  }

  const readiness =
    suggestions.some((s) => s.severity === 'important') ? 'needsWork'
      : suggestions.some((s) => s.severity === 'warning') ? 'almost'
        : 'ready'

  return { suggestions: suggestions.slice(0, 6), readiness }
}

/** Plain-language summary from scores — no OpenAI or edge function needed */
export function buildListingInsightSummary(listing, analysis, t) {
  if (!listing || !analysis || !t) return ''

  const campus = analysis.campusName || t('advisor.summary.campusFallback')
  const price = formatPrice(listing.price)
  const parts = []

  parts.push(
    t(`advisor.summary.verdict.${analysis.label}`, {
      title: listing.title,
      price,
      campus,
      score: analysis.overall,
    })
  )

  if (analysis.distanceKm != null) {
    if (analysis.distanceKm <= 2) {
      parts.push(t('advisor.summary.distanceClose', { km: analysis.distanceKm.toFixed(1), campus }))
    } else if (analysis.distanceKm > 5) {
      parts.push(t('advisor.summary.distanceFar', { km: analysis.distanceKm.toFixed(1), campus }))
    } else {
      parts.push(t('advisor.summary.distanceMid', { km: analysis.distanceKm.toFixed(1), campus }))
    }
  }

  if (analysis.scores.trust >= 80) {
    parts.push(t('advisor.summary.trustHigh'))
  } else if (analysis.scores.trust < 60) {
    parts.push(t('advisor.summary.trustLow'))
  }

  if (analysis.scores.price >= 82) {
    parts.push(t('advisor.summary.priceGood'))
  } else if (analysis.scores.price < 50) {
    parts.push(t('advisor.summary.priceHigh'))
  }

  if (analysis.tips.some((tip) => tip.key === 'approxLocation')) {
    parts.push(t('advisor.summary.confirmLocation'))
  }

  parts.push(t('advisor.summary.closing'))

  return parts.join(' ')
}
