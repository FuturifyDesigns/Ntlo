/** Supported WhatsApp / mobile country codes (Botswana default). */
export const PHONE_COUNTRIES = [
  { code: '267', label: 'Botswana', flag: '🇧🇼', nationalLength: 8, nationalPattern: /^7[1-9]\d{6}$/ },
  { code: '27', label: 'South Africa', flag: '🇿🇦', nationalLength: 9, nationalPattern: /^[6-8]\d{8}$/ },
  { code: '264', label: 'Namibia', flag: '🇳🇦', nationalLength: 9, nationalPattern: /^[68]\d{8}$/ },
  { code: '263', label: 'Zimbabwe', flag: '🇿🇼', nationalLength: 9, nationalPattern: /^7\d{8}$/ },
]

const DEFAULT_COUNTRY = PHONE_COUNTRIES[0]

export function getPhoneCountry(code) {
  return PHONE_COUNTRIES.find((c) => c.code === code) || DEFAULT_COUNTRY
}

export function digitsOnly(value) {
  return String(value || '').replace(/\D/g, '')
}

/** Split stored phone into country code + national number for inputs. */
export function splitStoredPhone(stored) {
  const digits = digitsOnly(stored)
  if (!digits) return { countryCode: DEFAULT_COUNTRY.code, national: '' }

  if (digits.length === 8 && /^7/.test(digits)) {
    return { countryCode: '267', national: digits }
  }

  const byLength = [...PHONE_COUNTRIES].sort((a, b) => b.code.length - a.code.length)
  for (const country of byLength) {
    if (digits.startsWith(country.code) && digits.length > country.code.length) {
      return { countryCode: country.code, national: digits.slice(country.code.length) }
    }
  }

  return { countryCode: DEFAULT_COUNTRY.code, national: digits }
}

/** Normalize to international digits (e.g. 26771234567). */
export function normalizePhone(countryCode, nationalNumber) {
  const country = getPhoneCountry(countryCode)
  let national = digitsOnly(nationalNumber)

  if (country.code === '267') {
    if (national.startsWith('267') && national.length >= 11) {
      national = national.slice(3)
    }
    if (national.startsWith('0') && national.length === 9) {
      national = national.slice(1)
    }
    if (national.length === 8) {
      return `${country.code}${national}`
    }
    return national.length >= 10 ? national : ''
  }

  if (national.startsWith('0')) {
    national = national.slice(1)
  }
  if (!national) return ''
  return `${country.code}${national}`
}

/** @deprecated Use normalizePhone(countryCode, national) */
export function normalizeBotswanaPhone(phone) {
  const { countryCode, national } = splitStoredPhone(phone)
  return normalizePhone(countryCode, national || digitsOnly(phone))
}

export function validatePhoneNumber(countryCode, nationalNumber, messages = {}, { required = false } = {}) {
  const national = digitsOnly(nationalNumber)
  if (!national) {
    return required ? (messages.phoneRequired || 'Phone number is required') : ''
  }

  const country = getPhoneCountry(countryCode)
  if (country.nationalPattern && !country.nationalPattern.test(national)) {
    return messages.phoneInvalid || 'Enter a valid mobile number'
  }

  if (!country.nationalPattern) {
    if (national.length < 7 || national.length > 12) {
      return messages.phoneInvalid || 'Enter a valid mobile number'
    }
  }

  return ''
}

export function formatNationalPlaceholder(countryCode) {
  const country = getPhoneCountry(countryCode)
  if (country.code === '267') return '7X XXX XXX'
  return 'Mobile number'
}
