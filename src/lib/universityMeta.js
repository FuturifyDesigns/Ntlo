const base = import.meta.env.BASE_URL

/** UI extras keyed by slug — coordinates live in Supabase. */
export const UNIVERSITY_META = {
  'university-of-botswana': {
    image: `${base}universities/ub.png`,
    map_zoom: 16,
    nearby_areas: ['Sbrana', 'Extension 26', 'Bontleng', 'Old Naledi', 'Block 8', 'Mogoditshane'],
  },
  biust: {
    image: `${base}universities/biust.png`,
    map_zoom: 15,
    nearby_areas: ['Khurumela', 'Palapye Village', 'Morupule Area', 'Serowe Road'],
  },
  'botho-university': {
    image: `${base}universities/botho.png`,
    map_zoom: 16,
    nearby_areas: ['Tlokweng', 'Broadhurst', 'Block 7', 'Extension 12'],
  },
  limkokwing: {
    image: `${base}universities/limkokwing.png`,
    map_zoom: 16,
    nearby_areas: ['Block 7', 'Broadhurst', 'Phase 2', 'Extension 14'],
  },
  'ba-isago': {
    image: `${base}universities/ba-isago.png`,
    map_zoom: 16,
    nearby_areas: ['Commerce Park', 'Gaborone West', 'Mogoditshane'],
  },
  'abm-university': {
    image: `${base}universities/abm.png`,
    map_zoom: 16,
    nearby_areas: ['Fairgrounds', 'CBD', 'Broadhurst'],
  },
  guc: {
    image: `${base}universities/guc.png`,
    map_zoom: 16,
    nearby_areas: ['Block 8', 'Extension 26', 'Fairgrounds'],
  },
}

export function enrichUniversity(row) {
  const meta = UNIVERSITY_META[row.slug] || {}
  const nearby = Array.isArray(row.nearby_areas) && row.nearby_areas.length
    ? row.nearby_areas
    : meta.nearby_areas || []

  return {
    ...row,
    nearby_areas: nearby,
    map_zoom: row.map_zoom ?? meta.map_zoom ?? 15,
    image: row.image_url || meta.image || `${base}hero/bg.jpg`,
  }
}

export function getUniversityImage(uni) {
  return uni?.image || `${base}hero/bg.jpg`
}
