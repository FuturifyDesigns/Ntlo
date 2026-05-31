export const BAN_REASON_CODES = [
  'terms_violation',
  'harassment',
  'fraud_scam',
  'fake_documents',
  'spam_abuse',
  'other',
]

export const BAN_DURATION_TYPES = ['hours', 'days', 'permanent']

const BAN_INFO_KEY = 'ntlo_ban_info'

export function isBanActive(profile) {
  if (!profile?.is_banned) return false
  if (!profile.banned_until) return true
  return new Date(profile.banned_until).getTime() > Date.now()
}

/** Block login / session only after the user has confirmed the ban modal. */
export function shouldBlockLogin(profile) {
  return isBanActive(profile) && Boolean(profile?.ban_acknowledged_at)
}

/** True when profile still carries a ban flag (admin can unban). */
export function isUserBanned(profile) {
  return Boolean(profile?.is_banned)
}

export function formatBanEndsAt(profile) {
  if (!profile?.banned_until) return null
  const date = new Date(profile.banned_until)
  if (!Number.isFinite(date.getTime())) return null
  return date
}

export function saveBanInfoForLogin(banInfo) {
  if (!banInfo) return
  try {
    sessionStorage.setItem(BAN_INFO_KEY, JSON.stringify(banInfo))
  } catch {
    /* ignore */
  }
}

export function readBanInfoFromLogin() {
  try {
    const raw = sessionStorage.getItem(BAN_INFO_KEY)
    if (!raw) return null
    sessionStorage.removeItem(BAN_INFO_KEY)
    return JSON.parse(raw)
  } catch {
    return null
  }
}

export function buildBanInfoFromProfile(profile) {
  if (!profile || !isBanActive(profile)) return null
  return {
    reason_code: profile.ban_reason_code,
    reason_note: profile.ban_reason_note,
    banned_reason: profile.banned_reason,
    banned_at: profile.banned_at,
    banned_until: profile.banned_until,
    permanent: !profile.banned_until,
  }
}
