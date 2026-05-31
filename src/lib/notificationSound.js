const SOUND_URL = `${import.meta.env.BASE_URL}ntlo-sound.mp3`
const STORAGE_KEY = 'ntlo_sound_enabled'
const MAX_RECENT_IDS = 120

let audio = null
let sessionUnlocked = false
const recentIds = new Set()
const recentQueue = []

function rememberId(id) {
  if (!id) return
  if (recentIds.has(id)) return false
  recentIds.add(id)
  recentQueue.push(id)
  if (recentQueue.length > MAX_RECENT_IDS) {
    const old = recentQueue.shift()
    recentIds.delete(old)
  }
  return true
}

function getAudio() {
  if (!audio) {
    audio = new Audio(SOUND_URL)
    audio.preload = 'auto'
  }
  return audio
}

export function isNotificationSoundEnabled() {
  try {
    return localStorage.getItem(STORAGE_KEY) === '1'
  } catch {
    return false
  }
}

/** User opted in, or this tab already unlocked audio for playback. */
export function isNotificationSoundUnlocked() {
  return sessionUnlocked || isNotificationSoundEnabled()
}

function markSessionUnlocked() {
  sessionUnlocked = true
}

function persistEnabled() {
  markSessionUnlocked()
  try {
    localStorage.setItem(STORAGE_KEY, '1')
  } catch {
    /* ignore */
  }
  window.dispatchEvent(new Event('ntlo-sound-unlocked'))
}

/**
 * Unlock audio for this tab. Set persist=true only when the user explicitly enables sounds.
 * Set audible=true to play the chime immediately (use on the Enable button click).
 */
export function unlockNotificationSound({ persist = false, audible = false } = {}) {
  if (sessionUnlocked && !audible) return Promise.resolve()

  const clip = getAudio()
  clip.volume = audible ? 0.85 : 0
  clip.currentTime = 0

  return clip
    .play()
    .then(() => {
      if (!audible) {
        clip.pause()
        clip.currentTime = 0
      }
      clip.volume = 0.85
      markSessionUnlocked()
      if (persist) persistEnabled()
    })
    .catch((err) => Promise.reject(err))
}

/** After reload, browsers need one interaction per tab before audio can play again. */
export function warmNotificationSoundOnInteraction() {
  if (!isNotificationSoundEnabled() || sessionUnlocked) return Promise.resolve()
  return unlockNotificationSound().catch(() => {})
}

/** Play Ntlo notification chime — deduped per notification id. */
export function playNotificationSound(notificationId) {
  if (!isNotificationSoundEnabled()) return Promise.resolve()
  if (notificationId && !rememberId(notificationId)) return Promise.resolve()

  const clip = getAudio()
  clip.currentTime = 0
  clip.volume = 0.85
  return clip.play().catch(() => {})
}
