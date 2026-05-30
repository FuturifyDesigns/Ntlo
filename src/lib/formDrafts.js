const DRAFT_VERSION = 1

export function getDraftKey(scope, userId) {
  const base = `ntlo_draft_${scope}_v${DRAFT_VERSION}`
  return userId ? `${base}_${userId}` : base
}

export function loadDraft(key) {
  if (!key) return null
  try {
    const raw = localStorage.getItem(key) || sessionStorage.getItem(key)
    if (!raw) return null
    const parsed = JSON.parse(raw)
    if (parsed?.version !== DRAFT_VERSION) return null
    return parsed
  } catch {
    return null
  }
}

export function saveDraft(key, payload) {
  if (!key) return
  const data = {
    version: DRAFT_VERSION,
    savedAt: Date.now(),
    ...payload,
  }
  const json = JSON.stringify(data)
  try {
    sessionStorage.setItem(key, json)
    localStorage.setItem(key, json)
  } catch {
    try {
      sessionStorage.setItem(key, json)
    } catch {
      /* storage full or blocked */
    }
  }
}

export function clearDraft(key) {
  if (!key) return
  localStorage.removeItem(key)
  sessionStorage.removeItem(key)
}

export function formatDraftSavedAt(timestamp) {
  if (!timestamp) return ''
  const diff = Date.now() - timestamp
  if (diff < 5000) return 'just now'
  if (diff < 60000) return `${Math.floor(diff / 1000)}s ago`
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`
  return new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}
