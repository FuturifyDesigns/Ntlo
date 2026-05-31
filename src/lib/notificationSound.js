const SOUND_URL = `${import.meta.env.BASE_URL}ntlo-sound.mp3`
const MAX_RECENT_IDS = 120

let audio = null
let unlocked = false
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

/** Browsers block audio until the user interacts with the page once. */
export function unlockNotificationSound() {
  if (unlocked) return
  unlocked = true
  const clip = getAudio()
  clip.volume = 0
  clip.play()
    .then(() => {
      clip.pause()
      clip.currentTime = 0
      clip.volume = 0.85
      window.dispatchEvent(new Event('ntlo-sound-unlocked'))
    })
    .catch(() => {
      unlocked = false
    })
}

export function isNotificationSoundUnlocked() {
  return unlocked
}

/** Play Ntlo notification chime — deduped per notification id. */
export function playNotificationSound(notificationId) {
  if (notificationId && !rememberId(notificationId)) return Promise.resolve()

  const clip = getAudio()
  clip.currentTime = 0
  clip.volume = 0.85
  return clip.play().catch(() => {})
}
