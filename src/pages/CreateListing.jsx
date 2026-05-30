import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import imageCompression from 'browser-image-compression'
import { ChevronLeft, ChevronRight, Upload, X, Star } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'
import { UNIVERSITIES } from '../lib/universities'
import { AMENITIES, ROOM_TYPES, calculateDistance, formatPrice } from '../lib/utils'
import Button from '../components/ui/Button'
import Input, { Select, Textarea } from '../components/ui/Input'
import { UniversitySelect } from '../components/universities/OtherUniversityModal'
import { LocationPicker } from '../components/maps/ListingMap'

import { LISTING_DOC_TYPES } from '../lib/verification'
import { uploadVerificationDoc } from '../lib/verificationStorage'
import LandlordListingCoach from '../components/advisor/LandlordListingCoach'
import { useTranslation } from '../hooks/useTranslation'

const STEPS = ['Basics', 'Location', 'Photos', 'Amenities', 'Contact', 'Documents', 'Review']

const initialForm = {
  title: '',
  room_type: 'single',
  price: '',
  gender_preference: 'any',
  address: '',
  area: '',
  city: 'Gaborone',
  nearest_university_id: '',
  custom_university_name: '',
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
  const [submitting, setSubmitting] = useState(false)

  function update(field, value) {
    setForm((f) => ({ ...f, [field]: value }))
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

  async function handleSubmit() {
    setError('')
    setSubmitting(true)
    try {
      const isOther = form.nearest_university_id === 'other'
      const uni = !isOther
        ? UNIVERSITIES.find((u) => u.id === Number(form.nearest_university_id))
        : null
      let distance = null
      if (uni && form.lat && form.lng) {
        distance = calculateDistance(Number(form.lat), Number(form.lng), uni.lat, uni.lng)
      }

      const { data, error: insertError } = await supabase
        .from('listings')
        .insert({
          landlord_id: user.id,
          title: form.title,
          description: form.description,
          price: Number(form.price),
          room_type: form.room_type,
          gender_preference: form.gender_preference,
          address: form.address,
          area: form.area,
          city: form.city,
          lat: form.lat ? Number(form.lat) : null,
          lng: form.lng ? Number(form.lng) : null,
          nearest_university_id: isOther ? null : form.nearest_university_id ? Number(form.nearest_university_id) : null,
          custom_university_name: isOther ? form.custom_university_name.trim() : null,
          distance_to_campus: distance,
          amenities: form.amenities,
          whatsapp_number: form.whatsapp_number,
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

      navigate('/landlord')
    } catch (err) {
      setError(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  function nextStep() {
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
    : UNIVERSITIES.find((u) => u.id === Number(form.nearest_university_id))

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="mx-auto max-w-2xl px-4 py-5 sm:px-6 sm:py-8"
    >
      <h1 className="font-display text-3xl font-bold text-primary">List a new room</h1>
      <p className="mt-2 text-muted">Step {step + 1} of {STEPS.length}: {STEPS[step]}</p>

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
                <Input label="Listing title" value={form.title} onChange={(e) => update('title', e.target.value)} placeholder="Cozy single room near UB" required />
                <Select label="Room type" value={form.room_type} onChange={(e) => update('room_type', e.target.value)}>
                  {Object.entries(ROOM_TYPES).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                </Select>
                <Input label="Price per month (Pula)" type="number" min="300" value={form.price} onChange={(e) => update('price', e.target.value)} required />
                <Select label="Gender preference" value={form.gender_preference} onChange={(e) => update('gender_preference', e.target.value)}>
                  <option value="any">Any</option>
                  <option value="female">Female only</option>
                  <option value="male">Male only</option>
                </Select>
              </div>
            )}

            {step === 1 && (
              <div className="space-y-4">
                <Input label="Street address" value={form.address} onChange={(e) => update('address', e.target.value)} placeholder="Plot 123, Sbrana" required />
                <Input label="Area / suburb" value={form.area} onChange={(e) => update('area', e.target.value)} placeholder="Block 8" />
                <Input label="City" value={form.city} onChange={(e) => update('city', e.target.value)} required />
                <UniversitySelect
                  value={form.nearest_university_id}
                  onChange={(v) => update('nearest_university_id', v)}
                  otherValue={form.custom_university_name}
                  onOtherChange={(v) => update('custom_university_name', v)}
                  required
                />
                <LocationPicker
                  lat={form.lat}
                  lng={form.lng}
                  onChange={({ lat, lng }) => {
                    setForm((f) => ({ ...f, lat: String(lat), lng: String(lng) }))
                  }}
                  hint="Pin your listing on the map so students can see where it is."
                />
                <div className="grid grid-cols-2 gap-4">
                  <Input label="Latitude" type="number" step="any" value={form.lat} onChange={(e) => update('lat', e.target.value)} placeholder="-24.6556" />
                  <Input label="Longitude" type="number" step="any" value={form.lng} onChange={(e) => update('lng', e.target.value)} placeholder="25.9090" />
                </div>
              </div>
            )}

            {step === 2 && (
              <div>
                <p className="mb-4 text-sm text-muted">Upload up to 5 photos. First photo or starred photo becomes the cover.</p>
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
                <Input label="WhatsApp number" type="tel" value={form.whatsapp_number} onChange={(e) => update('whatsapp_number', e.target.value)} placeholder="7X XXX XXX" required />
                <Textarea label="Description" value={form.description} onChange={(e) => update('description', e.target.value)} placeholder="Describe the room, house rules, what's included..." />
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
                  <p><strong>Location:</strong> {form.address}, {form.area}, {form.city}</p>
                  {uni && <p><strong>University:</strong> {uni.short_name}</p>}
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
