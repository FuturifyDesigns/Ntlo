const CACHE_KEY = 'ntlo_universities_v1'
const CACHE_TTL_MS = 24 * 60 * 60 * 1000

export function readUniversitiesCache() {
  if (typeof localStorage === 'undefined') return null
  try {
    const raw = localStorage.getItem(CACHE_KEY)
    if (!raw) return null
    const { at, list } = JSON.parse(raw)
    if (!Array.isArray(list) || Date.now() - at > CACHE_TTL_MS) return null
    return list
  } catch {
    return null
  }
}

export function writeUniversitiesCache(list) {
  if (typeof localStorage === 'undefined' || !Array.isArray(list)) return
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify({ at: Date.now(), list }))
  } catch {
    /* quota exceeded — skip */
  }
}

export function clearUniversitiesCache() {
  if (typeof localStorage === 'undefined') return
  try {
    localStorage.removeItem(CACHE_KEY)
  } catch {
    /* ignore */
  }
}
