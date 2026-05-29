const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/i
const NAME_RE = /^[\p{L}\s'.-]{2,}$/u
const BW_MOBILE_RE = /^7[1-9]\d{6}$/

function t(messages, key) {
  return messages[key] || key
}

export function normalizeBotswanaPhone(phone) {
  let digits = phone.replace(/\D/g, '')
  if (digits.startsWith('267') && digits.length >= 11) {
    digits = digits.slice(3)
  }
  if (digits.startsWith('0') && digits.length === 9) {
    digits = digits.slice(1)
  }
  return digits
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

export function validateConfirmPassword(password, confirmPassword, messages = {}) {
  if (!confirmPassword) return t(messages, 'confirmPasswordRequired')
  if (password !== confirmPassword) return t(messages, 'passwordMismatch')
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

export function validatePhone(phone, messages = {}, { required = false } = {}) {
  const value = phone.trim()
  if (!value) {
    return required ? t(messages, 'phoneRequired') : ''
  }

  const digits = normalizeBotswanaPhone(value)
  if (digits.length !== 8 || !BW_MOBILE_RE.test(digits)) {
    return t(messages, 'phoneInvalid')
  }
  return ''
}

export function validateUniversity(form, messages = {}) {
  if (form.role !== 'student') return ''
  if (form.universityId === 'other') {
    const name = form.customUniversity?.trim() || ''
    if (!name) return t(messages, 'universityRequired')
    if (name.length < 2) return t(messages, 'universityMin')
  }
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
  const phoneError = validatePhone(form.phone, messages, { required: true })
  const passwordError = validatePassword(form.password, messages, { forSignup: true })
  const confirmError = validateConfirmPassword(form.password, form.confirmPassword, messages)
  const universityError = validateUniversity(form, messages)

  if (nameError) errors.fullName = nameError
  if (emailError) errors.email = emailError
  if (phoneError) errors.phone = phoneError
  if (passwordError) errors.password = passwordError
  if (confirmError) errors.confirmPassword = confirmError
  if (universityError) errors.customUniversity = universityError

  return errors
}

export function mapAuthError(message, messages = {}) {
  const lower = (message || '').toLowerCase()
  if (lower.includes('invalid login credentials')) return t(messages, 'invalidCredentials')
  if (lower.includes('email not confirmed')) return t(messages, 'emailNotConfirmed')
  if (
    lower.includes('user already registered') ||
    lower.includes('already registered') ||
    lower.includes('already exists') ||
    lower.includes('identity already exists') ||
    lower.includes('email address is already')
  ) {
    return t(messages, 'emailTaken')
  }
  if (lower.includes('password')) return t(messages, 'authFailed')
  return message || t(messages, 'authFailed')
}
