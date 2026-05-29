const base = import.meta.env.BASE_URL

export const UNIVERSITIES = [
  {
    id: 1,
    name: 'University of Botswana',
    short_name: 'UB',
    slug: 'university-of-botswana',
    city: 'Gaborone',
    lat: -24.6556,
    lng: 25.909,
    image: `${base}universities/ub.png`,
    nearby_areas: ['Sbrana', 'Extension 26', 'Bontleng', 'Old Naledi', 'Block 8', 'Mogoditshane'],
  },
  {
    id: 2,
    name: 'Botswana Intl University of Science & Technology',
    short_name: 'BIUST',
    slug: 'biust',
    city: 'Palapye',
    lat: -22.5506,
    lng: 27.1268,
    image: `${base}universities/biust.png`,
    nearby_areas: ['Palapye Village', 'Morupule Area', 'Serowe Road'],
  },
  {
    id: 3,
    name: 'Botho University',
    short_name: 'Botho',
    slug: 'botho-university',
    city: 'Gaborone',
    lat: -24.6282,
    lng: 25.9116,
    image: `${base}universities/botho.png`,
    nearby_areas: ['Tlokweng', 'Broadhurst', 'Block 7', 'Extension 12'],
  },
  {
    id: 4,
    name: 'Limkokwing University',
    short_name: 'Limkokwing',
    slug: 'limkokwing',
    city: 'Gaborone',
    lat: -24.6553,
    lng: 25.9143,
    image: `${base}universities/limkokwing.png`,
    nearby_areas: ['Fairgrounds', 'CBD', 'Extension 9', 'Phase 2'],
  },
  {
    id: 5,
    name: 'Ba Isago University',
    short_name: 'Ba Isago',
    slug: 'ba-isago',
    city: 'Gaborone',
    lat: -24.642,
    lng: 25.908,
    image: `${base}universities/ba-isago.png`,
    nearby_areas: ['Commerce Park', 'Gaborone West', 'Mogoditshane'],
  },
  {
    id: 6,
    name: 'ABM University College',
    short_name: 'ABM',
    slug: 'abm-university',
    city: 'Gaborone',
    lat: -24.65,
    lng: 25.91,
    image: `${base}universities/abm.png`,
    nearby_areas: ['Fairgrounds', 'CBD', 'Broadhurst'],
  },
  {
    id: 8,
    name: 'Gaborone University College',
    short_name: 'GUC',
    slug: 'guc',
    city: 'Gaborone',
    lat: -24.651,
    lng: 25.906,
    image: `${base}universities/guc.png`,
    nearby_areas: ['Block 8', 'Extension 26', 'Fairgrounds'],
  },
]

export const CITIES = [...new Set(UNIVERSITIES.map((u) => u.city))]

export function getUniversityBySlug(slug) {
  return UNIVERSITIES.find((u) => u.slug === slug)
}

export function getUniversityById(id) {
  return UNIVERSITIES.find((u) => u.id === id)
}

export function getUniversityImage(uni) {
  return uni?.image || `${base}hero/bg.jpg`
}
