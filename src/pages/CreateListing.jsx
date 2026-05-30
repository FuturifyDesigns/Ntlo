import { useState, useMemo, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import imageCompression from 'browser-image-compression'
import { ChevronLeft, ChevronRight, Upload, X, Star } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'
import { getUniversityById } from '../lib/universities'
import { getUniversityDisplayName } from '../lib/universityNames'
import { useUniversities } from '../hooks/useUniversities'
import { AMENITIES, ROOM_TYPES, GENDER_PREFERENCES, UTILITIES_OPTIONS, calculateDistance, formatPrice } from '../lib/utils'
import Button from '../components/ui/Button'
import Input, { Select, Textarea } from '../components/ui/Input'
import { UniversitySelect } from '../components/universities/OtherUniversityModal'
import { LocationPicker } from '../components/maps/ListingMap'
import DocumentUpload from '../components/verification/DocumentUpload'

import { LISTING_DOC_TYPES } from '../lib/verification'
import { uploadVerificationDoc } from '../lib/verificationStorage'
import LandlordListingCoach from '../components/advisor/LandlordListingCoach'
import { useTranslation } from '../hooks/useTranslation'
import { validateListingStep, normalizeListingPhone } from '../lib/listingValidation'
import { getDraftKey } from '../lib/formDrafts'
import { useFormDraft } from '../hooks/useFormDraft'

const STEPS = ['Basics', 'Location', 'Photos', 'Amenities', 'Contact', 'Documents', 'Review']

const initialForm = {
  title: '',
  room_type: 'single',
  price: '',
  gender_preference: 'any',
  deposit_pula: '',
  utilities_included: '',
  house_rules: '',
  address: '',
  area: '',
  city: 'Gaborone',
  nearest_university_id: '',
  custom_university_name: '',
  custom_university_city: '',
  lat: '',
  lng: '',
  amenities: [],
  whatsapp_number: '',
  description: '',
}

export default function CreateListing() {
  const { user } = useAuth()
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [step, setStep] = useState(0)
  const [form, setForm] = useState(initialForm)
  const [photos, setPhotos] = useState([])
  const [listingDocs, setListingDocs] = useState({})
  const [coverIndex, setCoverIndex] = useState(0)
  const [error, setError] = useState('')
  const [fieldErrors, setFieldErrors] = useState({})
  const [submitting, setSubmitting] = useState(false)

  const draftKey = useMemo(() => getDraftKey('listing', user?.id), [user?.id])

  const handleDraftRestore = useCallback((draft) => {
    if (draft.form) setForm({ ...initialForm, ...draft.form })
    if (typeof draft.step === 'number') setStep(draft.step)
    if (typeof draft.coverIndex === 'number') setCoverIndex(draft.coverIndex)
  }, [])

  const {
    restored: draftRestored,
    savedLabel,
    clearDraft,
    dismissRestored,
  } = useFormDraft(
    draftKey,
    { form, step, coverIndex },
    handleDraftRestore,
    { enabled: Boolean(user?.id) }
  )

  const validationMessages = useMemo(() => ({
    titleRequired: t('listingForm.validation.titleRequired'),
    titleMin: t('listingForm.validation.titleMin'),
    titleMax: t('listingForm.validation.titleMax'),
    priceRequired: t('listingForm.validation.priceRequired'),
    priceRange: t('listingForm.validation.priceRange'),
    depositInvalid: t('listingForm.validation.depositInvalid'),
    areaRequired: t('listingForm.validation.areaRequired'),
    cityRequired: t('listingForm.validation.cityRequired'),
    universityRequired: t('listingForm.validation.universityRequired'),
    universityFullNameRequired: t('auth.validation.universityFullNameRequired'),
    universityFullNameMin: t('auth.validation.universityFullNameMin'),
    universityNoAbbrev: t('auth.validation.universityNoAbbrev'),
    universityCityRequired: t('listingForm.validation.universityCityRequired'),
    pinRequired: t('listingForm.pinRequired'),
    photosRequired: t('listingForm.validation.photosRequired'),
    phoneRequired: t('auth.validation.phoneRequired'),
    phoneInvalid: t('auth.validation.phoneInvalid'),
    descriptionRequired: t('listingForm.validation.descriptionRequired'),
    descriptionMin: t('listingForm.validation.descriptionMin'),
    descriptionMax: t('listingForm.validation.descriptionMax'),
  }), [t])

  function update(field, value) {
    setForm((f) => ({ ...f, [field]: value }))
    if (fieldErrors[field]) {
      setFieldErrors((prev) => ({ ...prev, [field]: '' }))
    }
  }

  function toggleAmenity(id) {
    setForm((f) => ({
      ...f,
      amenities: f.amenities.includes(id)
        ? f.amenities.filter((a) => a !== id)
        : [...f.amenities, id],
    }))
  }

  async function handlePhotos(files) {
    const remaining = 5 - photos.length
    const toAdd = Array.from(files).slice(0, remaining)
    const previews = toAdd.map((file) => ({
      file,
      preview: URL.createObjectURL(file),
    }))
    setPhotos((p) => [...p, ...previews])
    if (fieldErrors.photos) setFieldErrors((prev) => ({ ...prev, photos: '' }))
  }

  function removePhoto(index) {
    setPhotos((p) => p.filter((_, i) => i !== index))
    if (coverIndex >= index && coverIndex > 0) setCoverIndex(coverIndex - 1)
  }

  async function uploadPhotos(listingId) {
    for (let i = 0; i < photos.length; i++) {
      const { file } = photos[i]
      const compressed = await imageCompression(file, {
        maxSizeMB: 0.2,
        maxWidthOrHeight: 1000,
        useWebWorker: true,
      })
      const fileName = `${listingId}/${Date.now()}-${i}-${file.name}`
      const { error: uploadError } = await supabase.storage
        .from('listing-photos')
        .upload(fileName, compressed)
      if (uploadError) throw uploadError

      const { data: { publicUrl } } = supabase.storage
        .from('listing-photos')
        .getPublicUrl(fileName)

      await supabase.from('listing_photos').insert({
        listing_id: listingId,
        url: publicUrl,
        is_cover: i === coverIndex,
        display_order: i,
      })
    }
  }

  function handleLocationChange({ lat, lng, address, area, city }) {
    setForm((f) => ({
      ...f,
      lat: String(lat),
      lng: String(lng),
      ...(address !== undefined ? { address } : {}),
      ...(area !== undefined ? { area } : {}),
      ...(city !== undefined ? { city } : {}),
    }))
    if (fieldErrors.pin) setFieldErrors((prev) => ({ ...prev, pin: '' }))
  }

  async function handleSubmit() {
    setError('')
    const allErrors = {}
    for (let s = 0; s <= 4; s += 1) {
      Object.assign(allErrors, validateListingStep(s, form, { photos }, validationMessages))
    }
    if (Object.keys(allErrors).length > 0) {
      const firstStep = [0, 1, 2, 4].find((s) =>
        Object.keys(validateListingStep(s, form, { photos }, validationMessages)).length > 0
      )
      if (firstStep != null) setStep(firstStep)
      setFieldErrors(allErrors)
      setError(t('listingForm.validation.fixErrors'))
      return
    }

    setSubmitting(true)
    try {
      const isOther = form.nearest_university_id === 'other'
      const uni = !isOther
        ? getUniversityById(form.nearest_university_id)
        : null
      let distance = null
      if (uni && form.lat && form.lng) {
        distance = calculateDistance(Number(form.lat), Number(form.lng), uni.lat, uni.lng)
      }

      const { data, error: insertError } = await supabase
        .from('listings')
        .insert({
          landlord_id: user.id,
          title: form.title.trim(),
          description: form.description.trim(),
          price: Number(form.price),
          room_type: form.room_type,
          gender_preference: form.gender_preference,
          deposit_pula: form.deposit_pula ? Number(form.deposit_pula) : null,
          utilities_included: form.utilities_included || null,
          house_rules: form.house_rules.trim() || null,
          address: form.address.trim(),
          area: form.area.trim(),
          city: form.city.trim(),
          lat: form.lat ? Number(form.lat) : null,
          lng: form.lng ? Number(form.lng) : null,
          nearest_university_id: isOther ? null : form.nearest_university_id ? Number(form.nearest_university_id) : null,
          custom_university_name: isOther ? form.custom_university_name.trim() : null,
          custom_university_city: isOther ? form.custom_university_city.trim() || null : null,
          distance_to_campus: distance,
          amenities: form.amenities,
          whatsapp_number: normalizeListingPhone(form.whatsapp_number),
          available: true,
        })
        .select('id')
        .single()

      if (insertError) throw insertError

      if (photos.length) await uploadPhotos(data.id)

      for (const [docType, file] of Object.entries(listingDocs)) {
        if (file) {
          await uploadVerificationDoc({ userId: user.id, listingId: data.id, docType, file })
        }
      }

      clearDraft()
      navigate('/landlord')
    } catch (err) {
      setError(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  function nextStep() {
    const errors = validateListingStep(step, form, { photos }, validationMessages)
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors)
      setError(t('listingForm.validation.fixStep'))
      return
    }
    setError('')
    setFieldErrors({})
    if (step < STEPS.length - 1) setStep(step + 1)
    else handleSubmit()
  }

  function prevStep() {
    if (step > 0) setStep(step - 1)
  }

  function handleListingDoc(docType, file) {
    setListingDocs((prev) => ({ ...prev, [docType]: file }))
  }

  const uni = form.nearest_university_id === 'other'
    ? null
    : getUniversityById(form.nearest_university_id)
  const campusCoords = uni?.lat != null && uni?.lng != null
    ? { lat: uni.lat, lng: uni.lng }
    : null
  const campusZoom = uni?.map_zoom ?? undefined

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="mx-auto max-w-2xl px-4 py-5 sm:px-6 sm:py-8"
    >
      <h1 className="font-display text-3xl font-bold text-primary">List a new room</h1>
      <p className="mt-2 text-muted">Step {step + 1} of {STEPS.length}: {STEPS[step]}</p>

      {(draftRestored || savedLabel) && (
        <div className="mt-4 flex flex-wrap items-center justify-between gap-2 rounded-lg border border-accent/30 bg-accent/5 px-3 py-2 text-xs text-primary">
          <span>
            {draftRestored
              ? t('listingForm.draftRestored')
              : t('listingForm.draftSaved', { time: savedLabel })}
          </span>
          <div className="flex gap-2">
            {draftRestored && (
              <button type="button" onClick={dismissRestored} className="font-semibold text-accent hover:underline">
                {t('listingForm.draftDismiss')}
              </button>
            )}
            <button type="button" onClick={clearDraft} className="font-semibold text-muted hover:text-error">
              {t('listingForm.draftClear')}
            </button>
          </div>
        </div>
      )}

      <div className="mt-6 flex gap-1">
        {STEPS.map((_, i) => (
          <div
            key={i}
            className={`h-1.5 flex-1 rounded-full ${i <= step ? 'bg-accent' : 'bg-border'}`}
          />
        ))}
      </div>

      <div className="mt-8 rounded-xl border border-border bg-surface p-6">
        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
          >
            {step === 0 && (
              <div className="space-y-4">
                <Input
                  label="Listing title"
                  value={form.title}
                  onChange={(e) => update('title', e.target.value)}
                  placeholder="Cozy single room near UB"
                  hint={t('listingForm.validation.titleHint')}
                  error={fieldErrors.title}
                  required
                />
                <Select label="Room type" value={form.room_type} onChange={(e) => update('room_type', e.target.value)}>
                  {Object.entries(ROOM_TYPES).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                </Select>
                <Input
                  label="Price per month (Pula)"
                  type="number"
                  min="300"
                  max="100000"
                  value={form.price}
                  onChange={(e) => update('price', e.target.value)}
                  hint={t('listingForm.validation.priceHint')}
                  error={fieldErrors.price}
                  required
                />
                <div>
                  <p className="mb-2 text-sm font-medium text-primary">{t('listingForm.genderPreference')}</p>
                  <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
                    {Object.entries(GENDER_PREFERENCES).map(([value, label]) => (
                      <button
                        key={value}
                        type="button"
                        onClick={() => update('gender_preference', value)}
                        className={`rounded-lg border px-3 py-2.5 text-sm font-medium transition-colors ${
                          form.gender_preference === value
                            ? 'border-accent bg-accent/10 text-primary'
                            : 'border-border bg-background text-muted hover:border-accent/40'
                        }`}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                </div>
                <Input
                  label={t('listingForm.deposit')}
                  type="number"
                  min="0"
                  value={form.deposit_pula}
                  onChange={(e) => update('deposit_pula', e.target.value)}
                  placeholder={t('listingForm.depositPlaceholder')}
                  error={fieldErrors.deposit_pula}
                />
                <Select
                  label={t('listingForm.utilities')}
                  value={form.utilities_included}
                  onChange={(e) => update('utilities_included', e.target.value)}
                >
                  <option value="">{t('listingForm.utilitiesSelect')}</option>
                  {Object.entries(UTILITIES_OPTIONS).map(([k, v]) => (
                    <option key={k} value={k}>{v}</option>
                  ))}
                </Select>
                <p className="text-xs text-muted">{t('listingForm.utilitiesHint')}</p>
                {form.utilities_included && (
                  <p className="rounded-lg border border-border bg-background px-3 py-2 text-xs text-muted">
                    {t(`listingForm.utilitiesDesc.${form.utilities_included}`)}
                  </p>
                )}
              </div>
            )}

            {step === 1 && (
              <div className="space-y-4">
                <Input label="Street address (optional)" value={form.address} onChange={(e) => update('address', e.target.value)} placeholder="Plot 123, Sbrana" hint={t('listingForm.validation.addressHint')} />
                <Input label="Area / suburb" value={form.area} onChange={(e) => update('area', e.target.value)} placeholder="Block 8" error={fieldErrors.area} required />
                <Input label="City" value={form.city} onChange={(e) => update('city', e.target.value)} error={fieldErrors.city} required />
                <UniversitySelect
                  value={form.nearest_university_id}
                  onChange={(v) => update('nearest_university_id', v)}
                  otherValue={form.custom_university_name}
                  onOtherChange={(v) => update('custom_university_name', v)}
                  otherCityValue={form.custom_university_city}
                  onOtherCityChange={(v) => update('custom_university_city', v)}
                  error={fieldErrors.nearest_university_id}
                  otherNameError={fieldErrors.custom_university_name}
                  otherCityError={fieldErrors.custom_university_city}
                  required
                />
                {fieldErrors.pin && (
                  <p className="text-xs text-error">{fieldErrors.pin}</p>
                )}
                <LocationPicker
                  lat={form.lat}
                  lng={form.lng}
                  address={form.address}
                  area={form.area}
                  city={form.city}
                  universityId={form.nearest_university_id}
                  campusCoords={campusCoords}
                  campusLabel={uni ? getUniversityDisplayName(uni) : ''}
                  campusZoom={campusZoom}
                  customUniversityName={form.custom_university_name}
                  customUniversityCity={form.custom_university_city}
                  onChange={handleLocationChange}
                  hint={t('listingForm.locationHint')}
                  universityHint={t('listingForm.universityHint')}
                />
              </div>
            )}

            {step === 2 && (
              <div>
                <p className="mb-4 text-sm text-muted">{t('listingForm.validation.photosHint')}</p>
                {fieldErrors.photos && (
                  <p className="mb-3 text-xs text-error">{fieldErrors.photos}</p>
                )}
                <label className="flex cursor-pointer flex-col items-center rounded-xl border-2 border-dashed border-border py-10 hover:border-accent/50">
                  <Upload className="mb-2 text-muted" size={32} />
                  <span className="text-sm font-medium">Click to upload photos</span>
                  <input type="file" accept="image/*" multiple className="hidden" onChange={(e) => handlePhotos(e.target.files)} />
                </label>
                {photos.length > 0 && (
                  <div className="mt-4 grid grid-cols-3 gap-3">
                    {photos.map((p, i) => (
                      <div key={i} className="relative aspect-square overflow-hidden rounded-lg">
                        <img src={p.preview} alt="" className="h-full w-full object-cover" />
                        <button type="button" onClick={() => setCoverIndex(i)} className={`absolute left-1 top-1 rounded p-1 ${coverIndex === i ? 'bg-accent text-primary' : 'bg-white/80'}`}>
                          <Star size={14} fill={coverIndex === i ? 'currentColor' : 'none'} />
                        </button>
                        <button type="button" onClick={() => removePhoto(i)} className="absolute right-1 top-1 rounded bg-white/80 p-1">
                          <X size={14} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {step === 3 && (
              <div className="grid grid-cols-2 gap-3">
                {AMENITIES.map((a) => (
                  <label key={a.id} className={`flex cursor-pointer items-center gap-2 rounded-lg border p-3 text-sm ${form.amenities.includes(a.id) ? 'border-accent bg-accent/10' : 'border-border'}`}>
                    <input type="checkbox" checked={form.amenities.includes(a.id)} onChange={() => toggleAmenity(a.id)} className="accent-accent" />
                    {a.label}
                  </label>
                ))}
              </div>
            )}

            {step === 4 && (
              <div className="space-y-4">
                <Input
                  label="WhatsApp number"
                  type="tel"
                  value={form.whatsapp_number}
                  onChange={(e) => update('whatsapp_number', e.target.value)}
                  placeholder="7X XXX XXX"
                  hint={t('listingForm.validation.whatsappHint')}
                  error={fieldErrors.whatsapp_number}
                  required
                />
                <Textarea
                  label="Description"
                  value={form.description}
                  onChange={(e) => update('description', e.target.value)}
                  placeholder="Describe the room, what's included, nearby landmarks..."
                  hint={t('listingForm.validation.descriptionHint')}
                  error={fieldErrors.description}
                  required
                />
                <Textarea
                  label={t('listingForm.houseRules')}
                  value={form.house_rules}
                  onChange={(e) => update('house_rules', e.target.value)}
                  placeholder={t('listingForm.houseRulesPlaceholder')}
                />
              </div>
            )}

            {step === 5 && (
              <div className="space-y-4">
                <p className="text-sm text-muted">{t('verification.listingDocsIntro')}</p>
                {LISTING_DOC_TYPES.map((doc) => (
                  <DocumentUpload
                    key={doc.id}
                    docType={doc.id}
                    label={t(doc.labelKey)}
                    description={t(doc.descKey)}
                    accept={doc.accept}
                    uploaded={listingDocs[doc.id] ? { file_name: listingDocs[doc.id].name } : null}
                    onUpload={async (type, file) => handleListingDoc(type, file)}
                  />
                ))}
              </div>
            )}

            {step === 6 && (
              <div className="space-y-4">
                <div className="space-y-3 text-sm">
                  <p><strong>Title:</strong> {form.title}</p>
                  <p><strong>Price:</strong> {formatPrice(form.price)}/month</p>
                  <p><strong>Type:</strong> {ROOM_TYPES[form.room_type]}</p>
                  <p><strong>{t('listingForm.genderPreference')}:</strong> {GENDER_PREFERENCES[form.gender_preference]}</p>
                  {form.deposit_pula && <p><strong>{t('listingForm.deposit')}:</strong> P{form.deposit_pula}</p>}
                  {form.utilities_included && (
                    <p><strong>{t('listingForm.utilities')}:</strong> {UTILITIES_OPTIONS[form.utilities_included]}</p>
                  )}
                  <p><strong>Location:</strong> {form.address}, {form.area}, {form.city}</p>
                  {form.lat && form.lng && <p><strong>{t('listingForm.mapPin')}:</strong> {t('listingForm.pinSet')}</p>}
                  {uni && <p><strong>University:</strong> {getUniversityDisplayName(uni)}</p>}
                  {form.nearest_university_id === 'other' && (
                    <p><strong>University:</strong> {form.custom_university_name} (other)</p>
                  )}
                  <p><strong>Photos:</strong> {photos.length} uploaded</p>
                  <p><strong>Amenities:</strong> {form.amenities.length ? form.amenities.join(', ') : 'None'}</p>
                  <p><strong>WhatsApp:</strong> {form.whatsapp_number}</p>
                </div>
                <LandlordListingCoach form={form} photoCount={photos.length} />
              </div>
            )}
          </motion.div>
        </AnimatePresence>

        {error && <p className="mt-4 text-sm text-error">{error}</p>}

        <div className="mt-8 flex justify-between">
          <Button variant="outline" onClick={prevStep} disabled={step === 0}>
            <ChevronLeft size={16} />
            Back
          </Button>
          <Button onClick={nextStep} disabled={submitting}>
            {step === STEPS.length - 1 ? (submitting ? 'Publishing...' : 'Publish listing') : 'Continue'}
            {step < STEPS.length - 1 && <ChevronRight size={16} />}
          </Button>
        </div>
      </div>
    </motion.div>
  )
}
