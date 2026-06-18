/** Ntlo mascot pose images (public/mascot). */

export const MASCOT_POSES = {
  wave: '/mascot/wave.png',
  welcome: '/mascot/welcome.png',
  thumbsUp: '/mascot/thumbs-up.png',
  thinking: '/mascot/thinking.png',
  neutral: '/mascot/neutral.png',
  pointLeft: '/mascot/point-left.png',
  pointRight: '/mascot/point-right.png',
  pointUp: '/mascot/point-up.png',
  explain: '/mascot/explain.png',
}

export function getMascotSrc(pose) {
  return MASCOT_POSES[pose] || MASCOT_POSES.neutral
}

/** Fallback when a step has no explicit mascot pose. */
export function getMascotForStep(step) {
  if (step?.mascot) return step.mascot
  const id = step?.id || ''
  if (step?.type === 'center') {
    if (id.includes('done')) return 'thumbsUp'
    if (id.includes('welcome') || id === 'welcome') return 'welcome'
    if (id.includes('unavailable')) return 'thinking'
    return 'explain'
  }
  if (id.includes('compare') || id.includes('advisor') || id.includes('unavailable')) return 'thinking'
  if (id.includes('filters') || id.includes('add-listing')) return 'pointUp'
  return 'pointRight'
}

const preloadedMascots = new Set()

/** Warm mascot PNG cache so tour steps swap poses instantly. */
export function preloadMascotImages(poses = Object.keys(MASCOT_POSES)) {
  if (typeof window === 'undefined') return
  poses.forEach((pose) => {
    const src = getMascotSrc(pose)
    if (!src || preloadedMascots.has(src)) return
    preloadedMascots.add(src)
    const img = new Image()
    img.decoding = 'async'
    img.fetchPriority = 'high'
    img.src = src
  })
}

export function isMascotPreloaded(pose) {
  return preloadedMascots.has(getMascotSrc(pose))
}
