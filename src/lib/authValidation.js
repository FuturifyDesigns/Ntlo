import { validateFullUniversityName } from './universityNames'
import {
  normalizePhone,
  normalizeBotswanaPhone,
  validatePhoneNumber,
} from './phoneNumbers'

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/i
const NAME_RE = /^[\p{L}\s'.-]{2,}$/u

function t(messages, key) {
  return messages[key] || key
}

export { normalizeBotswanaPhone, normalizePhone, validatePhoneNumber }

export function validatePhone(phone, messages = {}, options = {}) {
  const { countryCode = '267', required = false } = options
  if (countryCode && phone !== undefined && !String(phone).includes(countryCode)) {
    return validatePhoneNumber(countryCode, phone, messages, { required })
  }
  const digits = String(phone || '').replace(/\D/g, '')
  if (digits.startsWith('267') && digits.length >= 11) {
    return validatePhoneNumber('267', digits.slice(3), messages, { required })
  }
  return validatePhoneNumber('267', digits, messages, { required })
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

export function validateUniversity(form, messages = {}) {
  if (form.role !== 'student') return ''
  if (form.universityId === 'other') {
    const name = form.customUniversity?.trim() || ''
    const errorKey = validateFullUniversityName(name)
    if (errorKey) return t(messages, errorKey)
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
  const phoneError = validatePhoneNumber(
    form.phoneCountryCode || '267',
    form.phoneNational ?? form.phone ?? '',
    messages,
    { required: true },
  )
  const passwordError = validatePassword(form.password, messages, { forSignup: true })
  const confirmError = validateConfirmPassword(form.password, form.confirmPassword, messages)
  const universityError = validateUniversity(form, messages)

  if (nameError) errors.fullName = nameError
  if (emailError) errors.email = emailError
  if (phoneError) errors.phone = phoneError
  if (passwordError) errors.password = passwordError
  if (confirmError) errors.confirmPassword = confirmError
  if (universityError) errors.customUniversity = universityError
  if (form.role === 'student' && !form.gender) {
    errors.gender = messages.genderRequired || 'Gender is required'
  }
  if (!form.acceptedTerms) {
    errors.acceptedTerms = messages.acceptTermsRequired || 'Please accept the Terms and Privacy Policy'
  }

  return errors
}

export function mapAuthError(message, messages = {}) {
  const lower = (message || '').toLowerCase()
  if (lower.includes('phone_taken')) return t(messages, 'phoneTaken')
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
