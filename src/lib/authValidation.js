const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/i
const NAME_RE = /^[\p{L}\s'.-]{2,}$/u

function t(messages, key) {
  return messages[key] || key
}

export function validateEmail(email, messages = {}) {
  const value = email.trim()
  if (!value) return t(messages, 'emailRequired')
  if (!EMAIL_RE.test(value)) return t(messages, 'emailInvalid')
  if (value.length > 254) return t(messages, 'emailTooLong')
  return ''
}

export function validatePassword(password, messages = {}, { forSignup = false } = {}) {
  if (!password) return t(messages, 'passwordRequired')
  if (forSignup) {
    if (password.length < 8) return t(messages, 'passwordMin')
    if (!/[a-z]/.test(password)) return t(messages, 'passwordLower')
    if (!/[A-Z]/.test(password)) return t(messages, 'passwordUpper')
    if (!/[0-9]/.test(password)) return t(messages, 'passwordNumber')
    if (/\s/.test(password)) return t(messages, 'passwordSpaces')
  } else if (password.length < 6) {
    return t(messages, 'passwordShort')
  }
  return ''
}

export function validateFullName(name, messages = {}) {
  const value = name.trim()
  if (!value) return t(messages, 'nameRequired')
  if (value.length < 2) return t(messages, 'nameMin')
  if (value.length > 80) return t(messages, 'nameMax')
  if (!NAME_RE.test(value)) return t(messages, 'nameInvalid')
  return ''
}

export function validatePhone(phone, messages = {}) {
  const value = phone.trim()
  if (!value) return ''
  const digits = value.replace(/\D/g, '')
  if (digits.length < 8 || digits.length > 11) return t(messages, 'phoneInvalid')
  return ''
}

export function validateLoginForm({ email, password }, messages = {}) {
  const errors = {}
  const emailError = validateEmail(email, messages)
  const passwordError = validatePassword(password, messages)
  if (emailError) errors.email = emailError
  if (passwordError) errors.password = passwordError
  return errors
}

export function validateRegisterForm(form, messages = {}) {
  const errors = {}
  const nameError = validateFullName(form.fullName, messages)
  const emailError = validateEmail(form.email, messages)
  const passwordError = validatePassword(form.password, messages, { forSignup: true })
  const phoneError = validatePhone(form.phone, messages)

  if (nameError) errors.fullName = nameError
  if (emailError) errors.email = emailError
  if (passwordError) errors.password = passwordError
  if (phoneError) errors.phone = phoneError

  return errors
}

export function mapAuthError(message, messages = {}) {
  const lower = (message || '').toLowerCase()
  if (lower.includes('invalid login credentials')) return t(messages, 'invalidCredentials')
  if (lower.includes('email not confirmed')) return t(messages, 'emailNotConfirmed')
  if (lower.includes('user already registered')) return t(messages, 'emailTaken')
  if (lower.includes('password')) return t(messages, 'authFailed')
  return message || t(messages, 'authFailed')
}
