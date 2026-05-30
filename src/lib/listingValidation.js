import { validatePhone, normalizeBotswanaPhone } from './authValidation'
import { validateFullUniversityName } from './universityNames'

const MIN_TITLE = 8
const MAX_TITLE = 120
const MIN_PRICE = 300
const MAX_PRICE = 100000
const MIN_DESCRIPTION = 20
const MAX_DESCRIPTION = 4000

function t(messages, key) {
  return messages[key] || key
}

export function validateListingStep(step, form, { photos = [] } = {}, messages = {}) {
  const errors = {}

  if (step === 0) {
    const title = form.title?.trim() || ''
    if (!title) errors.title = t(messages, 'titleRequired')
    else if (title.length < MIN_TITLE) errors.title = t(messages, 'titleMin')
    else if (title.length > MAX_TITLE) errors.title = t(messages, 'titleMax')

    if (!form.price && form.price !== 0) {
      errors.price = t(messages, 'priceRequired')
    } else {
      const price = Number(form.price)
      if (!Number.isFinite(price) || price < MIN_PRICE || price > MAX_PRICE) {
        errors.price = t(messages, 'priceRange')
      }
    }

    if (form.deposit_pula !== '' && form.deposit_pula != null) {
      const deposit = Number(form.deposit_pula)
      if (!Number.isFinite(deposit) || deposit < 0) {
        errors.deposit_pula = t(messages, 'depositInvalid')
      }
    }
  }

  if (step === 1) {
    if (!form.area?.trim()) errors.area = t(messages, 'areaRequired')
    if (!form.city?.trim()) errors.city = t(messages, 'cityRequired')

    if (!form.nearest_university_id) {
      errors.nearest_university_id = t(messages, 'universityRequired')
    } else if (form.nearest_university_id === 'other') {
      const nameKey = validateFullUniversityName(form.custom_university_name?.trim() || '')
      if (nameKey) errors.custom_university_name = t(messages, nameKey)
      if (!form.custom_university_city?.trim()) {
        errors.custom_university_city = t(messages, 'universityCityRequired')
      }
    }

    if (!form.lat || !form.lng) {
      errors.pin = t(messages, 'pinRequired')
    }
  }

  if (step === 2) {
    if (!photos.length) errors.photos = t(messages, 'photosRequired')
  }

  if (step === 4) {
    const phoneError = validatePhone(form.whatsapp_number, messages, { required: true })
    if (phoneError) errors.whatsapp_number = phoneError

    const desc = form.description?.trim() || ''
    if (!desc) errors.description = t(messages, 'descriptionRequired')
    else if (desc.length < MIN_DESCRIPTION) errors.description = t(messages, 'descriptionMin')
    else if (desc.length > MAX_DESCRIPTION) errors.description = t(messages, 'descriptionMax')
  }

  return errors
}

export function validateListingForm(form, { photos = [] } = {}, messages = {}) {
  const all = {}
  for (let step = 0; step <= 4; step += 1) {
    Object.assign(all, validateListingStep(step, form, { photos }, messages))
  }
  return all
}

export function normalizeListingPhone(phone) {
  return normalizeBotswanaPhone(phone?.trim() || '')
}
