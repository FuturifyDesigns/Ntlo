/** In-flight request deduplication — one network call per key at a time. */
const inFlight = new Map()

export function dedupeAsync(key, fn) {
  if (inFlight.has(key)) return inFlight.get(key)
  const promise = Promise.resolve()
    .then(fn)
    .finally(() => inFlight.delete(key))
  inFlight.set(key, promise)
  return promise
}

/** Debounce with cancel — returns [debouncedFn, cancel]. */
export function createDebouncer(fn, waitMs = 600) {
  let timer = null
  const debounced = (...args) => {
    clearTimeout(timer)
    timer = setTimeout(() => fn(...args), waitMs)
  }
  debounced.cancel = () => clearTimeout(timer)
  debounced.flush = (...args) => {
    clearTimeout(timer)
    fn(...args)
  }
  return debounced
}

/** TTL memory cache for read-heavy Supabase queries. */
export function createTtlCache(ttlMs = 45000, maxEntries = 48) {
  const store = new Map()

  function get(key) {
    const entry = store.get(key)
    if (!entry) return null
    if (Date.now() - entry.at > ttlMs) {
      store.delete(key)
      return null
    }
    return entry.value
  }

  function set(key, value) {
    if (store.size >= maxEntries) {
      const oldest = store.keys().next().value
      store.delete(oldest)
    }
    store.set(key, { value, at: Date.now() })
  }

  function invalidate(prefix) {
    if (!prefix) {
      store.clear()
      return
    }
    for (const key of store.keys()) {
      if (key.startsWith(prefix)) store.delete(key)
    }
  }

  return { get, set, invalidate }
}
