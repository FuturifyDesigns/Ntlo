import { useEffect, useRef, useState, useCallback } from 'react'
import { loadDraft, saveDraft, clearDraft as removeDraft, formatDraftSavedAt } from '../lib/formDrafts'

/**
 * Auto-save form state to session + local storage; restore on mount.
 * @param {string} key - storage key from getDraftKey()
 * @param {object} state - serializable state to persist
 * @param {(draft: object) => void} onRestore - called once when a draft is found
 * @param {{ debounceMs?: number, enabled?: boolean }} options
 */
export function useFormDraft(key, state, onRestore, { debounceMs = 450, enabled = true, onClear } = {}) {
  const [restored, setRestored] = useState(false)
  const [savedAt, setSavedAt] = useState(null)
  const readyRef = useRef(false)
  const skipSaveRef = useRef(false)
  const onRestoreRef = useRef(onRestore)
  const onClearRef = useRef(onClear)
  onRestoreRef.current = onRestore
  onClearRef.current = onClear

  useEffect(() => {
    if (!enabled || !key) {
      readyRef.current = true
      return
    }
    const draft = loadDraft(key)
    if (draft && onRestoreRef.current) {
      onRestoreRef.current(draft)
      setRestored(true)
      setSavedAt(draft.savedAt ?? null)
    }
    readyRef.current = true
  }, [key, enabled])

  useEffect(() => {
    if (!enabled || !key || !readyRef.current) return undefined
    if (skipSaveRef.current) {
      skipSaveRef.current = false
      return undefined
    }
    const timer = window.setTimeout(() => {
      saveDraft(key, state)
      setSavedAt(Date.now())
    }, debounceMs)
    return () => window.clearTimeout(timer)
  }, [key, state, debounceMs, enabled])

  const clearDraft = useCallback(() => {
    if (key) removeDraft(key)
    setRestored(false)
    setSavedAt(null)
    skipSaveRef.current = true
    onClearRef.current?.()
  }, [key])

  const dismissRestored = useCallback(() => setRestored(false), [])

  return {
    restored,
    savedAt,
    savedLabel: formatDraftSavedAt(savedAt),
    clearDraft,
    dismissRestored,
  }
}
