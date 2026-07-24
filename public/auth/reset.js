import { createClient } from './vendor/supabase.js'

const cfg = window.__NTLO_SUPABASE__
const loading = document.getElementById('state-loading')
const formBlock = document.getElementById('state-form')
const success = document.getElementById('state-success')
const errorEl = document.getElementById('state-error')
const errorMsg = document.getElementById('error-message')
const form = document.getElementById('reset-form')
const submitBtn = document.getElementById('submit-btn')
const formError = document.getElementById('form-error')
const passwordInput = document.getElementById('password')
const confirmInput = document.getElementById('confirm')
const passwordError = document.getElementById('password-error')
const confirmError = document.getElementById('confirm-error')

const EYE_PATH =
  'M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z'
const EYE_OFF_PATHS = [
  'M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94',
  'M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19',
]

function setToggleIcon(button, visible) {
  const svg = button.querySelector('svg')
  if (!svg) return
  while (svg.firstChild) svg.removeChild(svg.firstChild)

  if (visible) {
    const path = document.createElementNS('http://www.w3.org/2000/svg', 'path')
    path.setAttribute('d', EYE_PATH)
    const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle')
    circle.setAttribute('cx', '12')
    circle.setAttribute('cy', '12')
    circle.setAttribute('r', '3')
    svg.appendChild(path)
    svg.appendChild(circle)
  } else {
    EYE_OFF_PATHS.forEach((d) => {
      const path = document.createElementNS('http://www.w3.org/2000/svg', 'path')
      path.setAttribute('d', d)
      svg.appendChild(path)
    })
    const line = document.createElementNS('http://www.w3.org/2000/svg', 'line')
    line.setAttribute('x1', '1')
    line.setAttribute('y1', '1')
    line.setAttribute('x2', '23')
    line.setAttribute('y2', '23')
    svg.appendChild(line)
  }
}

function show(id) {
  ;[loading, formBlock, success, errorEl].forEach((el) => el.classList.add('hidden'))
  document.getElementById(id).classList.remove('hidden')
}

function clearFormErrors() {
  formError.classList.add('hidden')
  formError.textContent = ''
  passwordError.classList.add('hidden')
  passwordError.textContent = ''
  confirmError.classList.add('hidden')
  confirmError.textContent = ''
  passwordInput.classList.remove('input-error')
  confirmInput.classList.remove('input-error')
}

function showFormError(message) {
  formError.textContent = message
  formError.classList.remove('hidden')
}

function showFieldError(input, errorElNode, message) {
  errorElNode.textContent = message
  errorElNode.classList.remove('hidden')
  input.classList.add('input-error')
}

function validatePassword(password) {
  if (!password) return 'Password is required'
  if (password.length < 8) return 'Password must be at least 8 characters'
  if (!/[a-z]/.test(password)) return 'Include at least one lowercase letter'
  if (!/[A-Z]/.test(password)) return 'Include at least one uppercase letter'
  if (!/[0-9]/.test(password)) return 'Include at least one number'
  if (/\s/.test(password)) return 'Password cannot contain spaces'
  return ''
}

function validateForm(password, confirm) {
  clearFormErrors()
  const passwordMsg = validatePassword(password)
  const confirmMsg = !confirm
    ? 'Please confirm your password'
    : password !== confirm
      ? 'Passwords do not match'
      : ''

  if (passwordMsg) showFieldError(passwordInput, passwordError, passwordMsg)
  if (confirmMsg) showFieldError(confirmInput, confirmError, confirmMsg)

  return !passwordMsg && !confirmMsg
}

function isSessionExpiredError(message) {
  const lower = (message || '').toLowerCase()
  return (
    lower.includes('invalid or expired')
    || lower.includes('session')
    || lower.includes('jwt')
    || lower.includes('token')
    || lower.includes('not authenticated')
  )
}

document.querySelectorAll('.password-toggle').forEach((button) => {
  button.addEventListener('click', () => {
    const input = document.getElementById(button.dataset.target)
    const visible = input.type === 'text'
    input.type = visible ? 'password' : 'text'
    input.classList.toggle('password-input', !visible)
    setToggleIcon(button, visible)
    button.setAttribute('aria-label', visible ? 'Show password' : 'Hide password')
  })
})

let supabase

async function initSession() {
  if (!cfg?.url || !cfg?.key) {
    errorMsg.textContent = 'App configuration is missing.'
    show('state-error')
    return
  }

  supabase = createClient(cfg.url, cfg.key, {
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
  const type = hashParams.get('type')

  try {
    if (code) {
      const { error } = await supabase.auth.exchangeCodeForSession(code)
      if (error) throw error
    } else if (accessToken && refreshToken && type === 'recovery') {
      const { error } = await supabase.auth.setSession({
        access_token: accessToken,
        refresh_token: refreshToken,
      })
      if (error) throw error
    } else {
      throw new Error('Invalid or expired reset link. Please request a new one.')
    }

    window.history.replaceState({}, '', window.location.pathname)
    show('state-form')
  } catch (err) {
    errorMsg.textContent = err.message || 'Invalid reset link.'
    show('state-error')
  }
}

form.addEventListener('submit', async (e) => {
  e.preventDefault()
  const password = passwordInput.value
  const confirm = confirmInput.value

  if (!validateForm(password, confirm)) return

  submitBtn.disabled = true
  submitBtn.textContent = 'Updating…'

  const { error } = await supabase.auth.updateUser({ password })
  if (error) {
    if (isSessionExpiredError(error.message)) {
      errorMsg.textContent = error.message || 'This reset link has expired.'
      show('state-error')
    } else {
      showFormError(error.message || 'Could not update password. Please try again.')
    }
    submitBtn.disabled = false
    submitBtn.textContent = 'Update password'
    return
  }

  await supabase.auth.signOut()
  show('state-success')
})

initSession()
