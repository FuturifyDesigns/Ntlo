const STORAGE_KEY = 'ntlo_geocode_v1'
const MAX_ENTRIES = 180
const TTL_MS = 14 * 24 * 60 * 60 * 1000

function normalizeKey(query) {
  return (query || '').trim().toLowerCase().replace(/\s+/g, ' ')
}

function readStore() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : {}
  } catch {
    return {}
  }
}

function writeStore(store) {
  try {
    const keys = Object.keys(store)
    if (keys.length > MAX_ENTRIES) {
      keys
        .sort((a, b) => (store[a].at || 0) - (store[b].at || 0))
        .slice(0, keys.length - MAX_ENTRIES)
        .forEach((k) => delete store[k])
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(store))
  } catch {
    /* quota exceeded — skip persist */
  }
}

export function getCachedGeocode(query) {
  const key = normalizeKey(query)
  if (!key) return null
  const store = readStore()
  const entry = store[key]
  if (!entry) return null
  if (Date.now() - entry.at > TTL_MS) {
    delete store[key]
    writeStore(store)
    return null
  }
  return entry.value
}

export function setCachedGeocode(query, value) {
  const key = normalizeKey(query)
  if (!key || !value) return
  const store = readStore()
  store[key] = { value, at: Date.now() }
  writeStore(store)
}
