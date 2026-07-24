import { createClient } from './vendor/supabase.js'

const cfg = window.__NTLO_SUPABASE__
const loading = document.getElementById('state-loading')
const success = document.getElementById('state-success')
const errorEl = document.getElementById('state-error')
const errorMsg = document.getElementById('error-message')

function show(id) {
  loading.classList.add('hidden')
  success.classList.add('hidden')
  errorEl.classList.add('hidden')
  document.getElementById(id).classList.remove('hidden')
}

async function run() {
  if (!cfg?.url || !cfg?.key) {
    errorMsg.textContent = 'App configuration is missing. Contact support.'
    show('state-error')
    return
  }

  const supabase = createClient(cfg.url, cfg.key)
  const params = new URLSearchParams(window.location.search)
  const code = params.get('code')

  const hashParams = new URLSearchParams(window.location.hash.replace(/^#/, ''))
  const accessToken = hashParams.get('access_token')
  const refreshToken = hashParams.get('refresh_token')

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
      const {
        data: { session },
      } = await supabase.auth.getSession()
      if (!session) throw new Error('No verification code found in this link.')
    }

    window.history.replaceState({}, '', window.location.pathname)
    await supabase.auth.signOut()
    show('state-success')
  } catch (err) {
    errorMsg.textContent = err.message || 'Verification failed.'
    show('state-error')
  }
}

run()
