import { analyzeListing } from './listingAdvisor'
import { getListingOccupancy } from './listingOccupancy'
import { formatPrice } from './utils'

/** Market segment: same campus (or city) + room type. */
export function getMarketKey(listing) {
  if (!listing) return null
  const roomType = listing.room_type || 'single'
  if (listing.nearest_university_id) {
    return `uni:${listing.nearest_university_id}:${roomType}`
  }
  const city = (listing.city || '').trim().toLowerCase()
  return city ? `city:${city}:${roomType}` : null
}

export function isSameMarket(a, b) {
  if (!a || !b) return false
  return getMarketKey(a) === getMarketKey(b)
}

export function filterMarketListings(listings, anchorListing, { includeRented = true } = {}) {
  const key = getMarketKey(anchorListing)
  if (!key) return []

  return (listings || []).filter((l) => {
    if (getMarketKey(l) !== key) return false
    const occ = getListingOccupancy(l)
    if (occ === 'unavailable') return false
    if (!includeRented && occ === 'rented') return false
    return true
  })
}

function photoCount(listing) {
  const photos = listing.listing_photos || listing.photos
  if (Array.isArray(photos)) return photos.length
  return listing.photo_count ?? 0
}

function avg(nums) {
  if (!nums.length) return 0
  return nums.reduce((s, n) => s + n, 0) / nums.length
}

function percentileRank(value, values) {
  if (!values.length) return 50
  const sorted = [...values].sort((a, b) => a - b)
  const below = sorted.filter((v) => v < value).length
  return Math.round((below / sorted.length) * 100)
}

/**
 * Competitive position for one listing vs other landlords in the same market.
 */
export function analyzeCompetitivePosition(targetListing, marketListings, options = {}) {
  const { landlordId, context = {} } = options
  if (!targetListing) return null

  const market = filterMarketListings(marketListings, targetListing)
  const competitors = market.filter(
    (l) => l.id !== targetListing.id && (!landlordId || l.landlord_id !== landlordId)
  )
  const availablePool = market.filter((l) => getListingOccupancy(l) === 'available')
  const targetAvailable = getListingOccupancy(targetListing) === 'available'

  const scored = availablePool.map((listing) => ({
    listing,
    analysis: analyzeListing(listing, context),
  }))
  scored.sort((a, b) => b.analysis.overall - a.analysis.overall)

  const targetScore = analyzeListing(targetListing, context)
  const rankIndex = scored.findIndex((s) => s.listing.id === targetListing.id)
  const rank = targetAvailable && rankIndex >= 0 ? rankIndex + 1 : null
  const availableCount = availablePool.length
  const rentedCount = market.filter((l) => getListingOccupancy(l) === 'rented').length

  const competitorPrices = competitors
    .filter((l) => getListingOccupancy(l) === 'available')
    .map((l) => l.price)
  const avgPrice = Math.round(avg(competitorPrices))
  const minPrice = competitorPrices.length ? Math.min(...competitorPrices) : null
  const maxPrice = competitorPrices.length ? Math.max(...competitorPrices) : null

  const avgCompetitorScore = avg(
    competitors
      .filter((l) => getListingOccupancy(l) === 'available')
      .map((l) => analyzeListing(l, context).overall)
  )

  const strengths = []
  const weaknesses = []
  const actions = []

  const pricePct = competitorPrices.length
    ? percentileRank(targetListing.price, competitorPrices)
    : 50

  if (pricePct <= 35) {
    strengths.push({ key: 'priceLower', meta: { avg: avgPrice ? formatPrice(avgPrice) : '—' } })
  } else if (pricePct >= 70) {
    weaknesses.push({ key: 'priceHigher', meta: { avg: avgPrice ? formatPrice(avgPrice) : '—', min: minPrice ? formatPrice(minPrice) : '—' } })
    actions.push({ key: 'lowerPrice', severity: 'important', meta: { min: minPrice ? formatPrice(minPrice) : '—' } })
  }

  if (targetScore.scores.trust >= 80 && avgCompetitorScore < 75) {
    strengths.push({ key: 'trustLead' })
  } else if (targetScore.scores.trust < 65) {
    weaknesses.push({ key: 'trustBehind' })
    actions.push({ key: 'getVerified', severity: 'important' })
  }

  const myPhotos = photoCount(targetListing)
  const avgPhotos = avg(competitors.map(photoCount))
  if (myPhotos >= 3 && myPhotos >= avgPhotos) {
    strengths.push({ key: 'photosStrong', meta: { count: myPhotos } })
  } else if (myPhotos < 3) {
    weaknesses.push({ key: 'photosWeak', meta: { count: myPhotos } })
    actions.push({ key: 'addPhotos', severity: 'warning', meta: { count: myPhotos } })
  }

  if ((targetListing.amenities || []).includes('wifi')) {
    const wifiPct = competitors.filter((l) => l.amenities?.includes('wifi')).length / Math.max(competitors.length, 1)
    if (wifiPct < 0.7) strengths.push({ key: 'wifiEdge' })
  } else {
    const wifiShare = competitors.filter((l) => l.amenities?.includes('wifi')).length
    if (wifiShare >= competitors.length * 0.5) {
      weaknesses.push({ key: 'missingWifi' })
      actions.push({ key: 'addWifi', severity: 'tip' })
    }
  }

  if (!targetListing.description || targetListing.description.length < 80) {
    weaknesses.push({ key: 'descriptionShort' })
    actions.push({ key: 'expandDescription', severity: 'warning' })
  } else if (targetListing.description.length >= 150) {
    strengths.push({ key: 'descriptionRich' })
  }

  if (targetScore.scores.distance >= 85) {
    strengths.push({ key: 'distanceLead', meta: { km: targetScore.distanceKm?.toFixed(1) } })
  } else if (targetScore.distanceKm != null && targetScore.distanceKm > 5) {
    weaknesses.push({ key: 'distanceFar', meta: { km: targetScore.distanceKm.toFixed(1) } })
  }

  const topCompetitor = scored.find((s) => s.listing.id !== targetListing.id && s.listing.landlord_id !== landlordId)

  let position = 'needsWork'
  if (!targetAvailable) {
    position = getListingOccupancy(targetListing) === 'rented' ? 'rented' : 'offMarket'
  } else if (rank === 1 && availableCount > 1) {
    position = 'leading'
  } else if (rank && rank <= Math.ceil(availableCount * 0.35)) {
    position = 'competitive'
  } else if (rank && rank <= Math.ceil(availableCount * 0.7)) {
    position = 'midPack'
  }

  const scoreDelta = Math.round(targetScore.overall - avgCompetitorScore)

  return {
    targetListing,
    rank,
    availableCount,
    competitorCount: competitors.length,
    rentedCount,
    targetScore,
    avgCompetitorScore: Math.round(avgCompetitorScore),
    scoreDelta,
    avgPrice,
    minPrice,
    maxPrice,
    pricePercentile: pricePct,
    position,
    topCompetitor: topCompetitor || null,
    strengths: strengths.slice(0, 4),
    weaknesses: weaknesses.slice(0, 4),
    actions: actions.slice(0, 5),
    rankedAvailable: scored.slice(0, 8),
  }
}

/** When a landlord views a competitor's listing — compare against their own in that market. */
export function analyzeLandlordVsListing(myListings, competitorListing, marketListings, options = {}) {
  const { landlordId, context = {} } = options
  const mineInMarket = (myListings || []).filter(
    (l) => l.landlord_id === landlordId && isSameMarket(l, competitorListing)
  )

  if (!mineInMarket.length) {
    return {
      mode: 'noLocalListing',
      competitorListing,
      competitorAnalysis: analyzeListing(competitorListing, context),
      competitorPosition: analyzeCompetitivePosition(competitorListing, marketListings, {
        landlordId: competitorListing.landlord_id,
        context,
      }),
    }
  }

  const comparisons = mineInMarket.map((mine) => {
    const minePos = analyzeCompetitivePosition(mine, marketListings, { landlordId, context })
    const compAnalysis = analyzeListing(competitorListing, context)
    const mineAnalysis = analyzeListing(mine, context)
    const gaps = []

    if (mineAnalysis.overall < compAnalysis.overall) {
      gaps.push({ key: 'scoreBehind', meta: { delta: compAnalysis.overall - mineAnalysis.overall } })
    }
    if (mine.price > competitorListing.price) {
      gaps.push({ key: 'priceAbove', meta: { theirs: formatPrice(competitorListing.price), yours: formatPrice(mine.price) } })
    }
    if (mine.price < competitorListing.price) {
      gaps.push({ key: 'priceBelow', meta: { theirs: formatPrice(competitorListing.price), yours: formatPrice(mine.price) } })
    }
    if (!mine.amenities?.includes('wifi') && competitorListing.amenities?.includes('wifi')) {
      gaps.push({ key: 'theyHaveWifi' })
    }
    if (photoCount(mine) < photoCount(competitorListing)) {
      gaps.push({ key: 'theyMorePhotos', meta: { theirs: photoCount(competitorListing), yours: photoCount(mine) } })
    }

    return { listing: mine, position: minePos, gaps }
  })

  comparisons.sort((a, b) => (b.position.targetScore.overall - a.position.targetScore.overall))

  return {
    mode: 'compare',
    competitorListing,
    competitorAnalysis: analyzeListing(competitorListing, context),
    competitorPosition: analyzeCompetitivePosition(competitorListing, marketListings, {
      landlordId: competitorListing.landlord_id,
      context,
    }),
    myComparisons: comparisons,
    bestMine: comparisons[0] || null,
  }
}

export function buildCompetitiveSummary(result, t) {
  if (!result || !t) return ''
  if (result.mode === 'noLocalListing') {
    return t('advisor.competitive.noLocalListing', {
      score: result.competitorAnalysis?.overall ?? 0,
      rank: result.competitorPosition?.rank ?? '?',
      total: result.competitorPosition?.availableCount ?? '?',
    })
  }
  if (result.rank != null) {
    return t('advisor.competitive.summaryRanked', {
      rank: result.rank,
      total: result.availableCount,
      delta: result.scoreDelta,
    })
  }
  if (result.position === 'rented') {
    return t('advisor.competitive.summaryRented')
  }
  return t(`advisor.competitive.position.${result.position}`, {
    delta: result.scoreDelta,
    rank: result.rank ?? '—',
    total: result.availableCount,
  })
}
