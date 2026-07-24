import { createClient } from './vendor/supabase.js'

const cfg = window.__NTLO_SUPABASE__
const loading = document.getElementById('state-loading')
const unverified = document.getElementById('state-unverified')
const errorEl = document.getElementById('state-error')
const errorMsg = document.getElementById('error-message')
const errorLink = document.getElementById('error-link')

const OAUTH_KEYS = [
  'ntlo_oauth_pending',
  'ntlo_oauth_started_at',
  'ntlo_oauth_role',
  'ntlo_oauth_from',
  'ntlo_oauth_new_signup',
  'ntlo_google_redirecting',
]

function clearOAuthStorage() {
  OAUTH_KEYS.forEach((key) => sessionStorage.removeItem(key))
}

function consumeOAuthIntent() {
  const from = sessionStorage.getItem('ntlo_oauth_from')
  const role = sessionStorage.getItem('ntlo_oauth_role')
  sessionStorage.removeItem('ntlo_oauth_from')
  sessionStorage.removeItem('ntlo_oauth_role')
  return { from, role }
}

function profileNeedsSetup(profile) {
  if (!profile?.phone?.trim()) return true
  if (profile?.role === 'student' && !profile?.gender) return true
  return false
}

function isNewOAuthUser(user) {
  if (!user?.created_at) return false
  const created = new Date(user.created_at).getTime()
  const lastSignIn = user.last_sign_in_at ? new Date(user.last_sign_in_at).getTime() : created
  return Math.abs(lastSignIn - created) < 60_000
}

function showError(message, linkHref = '../#/login', linkText = 'Back to sign in') {
  loading.classList.add('hidden')
  unverified.classList.add('hidden')
  errorEl.classList.remove('hidden')
  errorMsg.textContent = message
  errorLink.href = linkHref
  errorLink.textContent = linkText
  clearOAuthStorage()
}

function isSocialAuthUser(user) {
  if (!user) return false
  const providers = (user.identities || []).map((i) => i.provider).filter(Boolean)
  if (providers.some((p) => p !== 'email')) return true
  const provider = user.app_metadata?.provider
  return Boolean(provider && provider !== 'email')
}

function isConfirmed(user) {
  return Boolean(user?.email_confirmed_at || user?.confirmed_at) || isSocialAuthUser(user)
}

async function abandonIncompleteSignup(client) {
  try {
    await client.rpc('abandon_incomplete_signup')
  } catch (_) {
    /* ignore */
  }
  try {
    await client.auth.signOut()
  } catch (_) {
    /* ignore */
  }
}

async function run() {
  if (!cfg?.url || !cfg?.key) {
    showError('App configuration is missing. Contact support.')
    return
  }

  const supabase = createClient(cfg.url, cfg.key, {
    auth: {
      detectSessionInUrl: true,
      persistSession: true,
      flowType: 'pkce',
    },
  })

  const params = new URLSearchParams(window.location.search)
  const code = params.get('code')
  const hashParams = new URLSearchParams(window.location.hash.replace(/^#/, ''))
  const accessToken = hashParams.get('access_token')
  const refreshToken = hashParams.get('refresh_token')

  let signupFrom = sessionStorage.getItem('ntlo_oauth_from')
  let signupIsNew = false

  try {
    if (code) {
      const { error } = await supabase.auth.exchangeCodeForSession(code)
      if (error) throw error
    } else if (accessToken && refreshToken) {
      const { error } = await supabase.auth.setSession({
        access_token: accessToken,
        refresh_token: refreshToken,
      })
      if (error) throw error
    } else {
      throw new Error('No sign-in code found. Please try again from Ntlo.')
    }

    window.history.replaceState({}, '', window.location.pathname)

    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) throw new Error('Could not load your account.')

    const { from, role: pendingRole } = consumeOAuthIntent()
    signupFrom = from || signupFrom
    const isNewUser = isNewOAuthUser(user)
    signupIsNew = isNewUser

    if (from === 'register' && !isNewUser) {
      await supabase.auth.signOut()
      showError(
        'An account with this email already exists. Please sign in instead.',
        '../#/login',
        'Go to sign in'
      )
      return
    }

    if (!isConfirmed(user)) {
      loading.classList.add('hidden')
      unverified.classList.remove('hidden')
      await supabase.auth.signOut()
      const email = encodeURIComponent(user.email || '')
      setTimeout(() => {
        window.location.replace(`../#/check-email?email=${email}`)
      }, 1200)
      return
    }

    if (pendingRole === 'student' || pendingRole === 'landlord') {
      await supabase.auth.updateUser({ data: { role: pendingRole } })
      const { error: roleError } = await supabase
        .from('profiles')
        .update({ role: pendingRole })
        .eq('id', user.id)
      if (roleError) throw roleError
    }

    sessionStorage.removeItem('ntlo_oauth_pending')
    sessionStorage.removeItem('ntlo_oauth_started_at')
    sessionStorage.removeItem('ntlo_google_redirecting')

    const { data: profile } = await supabase
      .from('profiles')
      .select(
        'role, phone, gender, is_banned, banned_until, ban_reason_code, ban_reason_note, banned_reason, ban_acknowledged_at'
      )
      .eq('id', user.id)
      .maybeSingle()

    const { data: access } = await supabase.rpc('check_account_access', { p_user_id: user.id })
    const banPendingAck =
      profile?.is_banned
      && (!profile.banned_until || new Date(profile.banned_until) > Date.now())
      && !profile.ban_acknowledged_at
    if (access && access.allowed === false && !banPendingAck) {
      try {
        sessionStorage.setItem('ntlo_ban_info', JSON.stringify(access.ban || {}))
      } catch (_) {
        /* ignore */
      }
      await supabase.auth.signOut().catch(() => {})
      window.location.replace('../#/login')
      return
    }

    if (profileNeedsSetup(profile)) {
      const roleQuery = pendingRole ? `?role=${pendingRole}` : from === 'login' ? '?role=student' : ''
      window.location.replace(`../#/complete-profile${roleQuery}`)
      return
    }

    const role = profile?.role || user.user_metadata?.role || 'student'
    const destination = role === 'landlord' ? '../#/landlord' : '../#/student'
    window.location.replace(destination)
  } catch (err) {
    const message = (err.message || '').toLowerCase()
    if (
      message.includes('already exists')
      || message.includes('already registered')
      || message.includes('identity already exists')
    ) {
      await supabase.auth.signOut().catch(() => {})
      showError(
        'An account with this email already exists. Please sign in with your email and password.',
        '../#/login',
        'Go to sign in'
      )
      return
    }
    if (signupIsNew && signupFrom === 'register') {
      await abandonIncompleteSignup(supabase)
    } else {
      await supabase.auth.signOut().catch(() => {})
    }
    showError(err.message || 'Sign-in failed.')
  }
}

run()
