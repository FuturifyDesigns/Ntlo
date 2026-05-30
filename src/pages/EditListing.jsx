import { useState, useEffect } from 'react'
import { useNavigate, useParams, Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'
import { useUniversities } from '../hooks/useUniversities'
import { useTranslation } from '../hooks/useTranslation'
import { getUniversityById } from '../lib/universities'
import { getUniversityDisplayName } from '../lib/universityNames'
import {
  AMENITIES, ROOM_TYPES, GENDER_PREFERENCES, UTILITIES_OPTIONS, calculateDistance,
} from '../lib/utils'
import { UniversitySelect } from '../components/universities/OtherUniversityModal'
import Button from '../components/ui/Button'
import Input, { Select, Textarea } from '../components/ui/Input'
import { LocationPicker } from '../components/maps/ListingMap'
import { Skeleton } from '../components/ui/Skeleton'

export default function EditListing() {
  const { id } = useParams()
  const { user } = useAuth()
  const { t } = useTranslation()
  const { universities } = useUniversities()
  const navigate = useNavigate()
  const [form, setForm] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    async function load() {
      const { data, error: fetchError } = await supabase
        .from('listings')
        .select('*')
        .eq('id', id)
        .single()
      if (fetchError || !data || data.landlord_id !== user?.id) {
        setError('Listing not found')
      } else {
        setForm({
          ...data,
          deposit_pula: data.deposit_pula ?? '',
          utilities_included: data.utilities_included ?? '',
          house_rules: data.house_rules ?? '',
        })
      }
      setLoading(false)
    }
    if (user) load()
  }, [id, user])

  function update(field, value) {
    setForm((f) => ({ ...f, [field]: value }))
  }

  function handleLocationChange({ lat, lng }) {
    setForm((f) => ({ ...f, lat, lng }))
  }

  function toggleAmenity(amenityId) {
    setForm((f) => ({
      ...f,
      amenities: f.amenities.includes(amenityId)
        ? f.amenities.filter((a) => a !== amenityId)
        : [...f.amenities, amenityId],
    }))
  }

  async function handleSave(e) {
    e.preventDefault()
    if (!form.lat || !form.lng) {
      setError(t('listingForm.pinRequired'))
      return
    }
    setSaving(true)
    setError('')
    try {
      const uni = getUniversityById(form.nearest_university_id)
      let distance = form.distance_to_campus
      if (uni && form.lat && form.lng) {
        distance = calculateDistance(Number(form.lat), Number(form.lng), uni.lat, uni.lng)
      }

      const { error: updateError } = await supabase
        .from('listings')
        .update({
          title: form.title,
          description: form.description,
          price: Number(form.price),
          room_type: form.room_type,
          gender_preference: form.gender_preference,
          deposit_pula: form.deposit_pula ? Number(form.deposit_pula) : null,
          utilities_included: form.utilities_included || null,
          house_rules: form.house_rules?.trim() || null,
          custom_university_city: form.nearest_university_id === 'other'
            ? form.custom_university_city?.trim() || null
            : null,
          address: form.address,
          area: form.area,
          city: form.city,
          lat: form.lat ? Number(form.lat) : null,
          lng: form.lng ? Number(form.lng) : null,
          nearest_university_id: form.nearest_university_id ? Number(form.nearest_university_id) : null,
          distance_to_campus: distance,
          amenities: form.amenities || [],
          whatsapp_number: form.whatsapp_number,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)

      if (updateError) throw updateError
      navigate('/landlord')
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <div className="mx-auto max-w-2xl px-4 py-8"><Skeleton className="h-96 w-full" /></div>
  if (error && !form) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-16 text-center">
        <p className="text-error">{error || 'Not found'}</p>
        <Button as={Link} to="/landlord" variant="outline" className="mt-4">Back</Button>
      </div>
    )
  }

  const isOtherUni = String(form.nearest_university_id) === 'other'
  const uni = isOtherUni ? null : getUniversityById(form.nearest_university_id)
  const campusCoords = uni?.lat != null && uni?.lng != null
    ? { lat: uni.lat, lng: uni.lng }
    : null

  return (
    <div className="mx-auto max-w-2xl px-4 py-5 sm:px-6 sm:py-8">
      <h1 className="font-display text-3xl font-bold text-primary">Edit listing</h1>
      <form onSubmit={handleSave} className="mt-6 space-y-4 rounded-xl border border-border bg-surface p-5 sm:p-6">
        <Input label="Title" value={form.title} onChange={(e) => update('title', e.target.value)} required />
        <Select label="Room type" value={form.room_type} onChange={(e) => update('room_type', e.target.value)}>
          {Object.entries(ROOM_TYPES).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </Select>
        <Input label="Price (Pula)" type="number" value={form.price} onChange={(e) => update('price', e.target.value)} required />
        <div>
          <p className="mb-2 text-sm font-medium text-primary">{t('listingForm.genderPreference')}</p>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
            {Object.entries(GENDER_PREFERENCES).map(([value, label]) => (
              <button
                key={value}
                type="button"
                onClick={() => update('gender_preference', value)}
                className={`rounded-lg border px-3 py-2.5 text-sm font-medium ${
                  form.gender_preference === value
                    ? 'border-accent bg-accent/10 text-primary'
                    : 'border-border bg-background text-muted'
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
        <Input label="Address" value={form.address} onChange={(e) => update('address', e.target.value)} required />
        <Input label="Area" value={form.area || ''} onChange={(e) => update('area', e.target.value)} />
        <Input label="City" value={form.city} onChange={(e) => update('city', e.target.value)} required />
        <UniversitySelect
          value={isOtherUni ? 'other' : String(form.nearest_university_id || '')}
          onChange={(v) => update('nearest_university_id', v === 'other' ? 'other' : v)}
          otherValue={form.custom_university_name || ''}
          onOtherChange={(v) => update('custom_university_name', v)}
          otherCityValue={form.custom_university_city || ''}
          onOtherCityChange={(v) => update('custom_university_city', v)}
        />
        <LocationPicker
          lat={form.lat}
          lng={form.lng}
          address={form.address}
          area={form.area}
          city={form.city}
          universityId={isOtherUni ? 'other' : String(form.nearest_university_id || '')}
          campusCoords={campusCoords}
          campusLabel={uni ? getUniversityDisplayName(uni) : ''}
          customUniversityName={form.custom_university_name || ''}
          customUniversityCity={form.custom_university_city || ''}
          onChange={handleLocationChange}
          hint={t('listingForm.locationHint')}
          universityHint={t('listingForm.universityHint')}
        />
        <Input label="WhatsApp" value={form.whatsapp_number} onChange={(e) => update('whatsapp_number', e.target.value)} required />
        <Textarea label="Description" value={form.description || ''} onChange={(e) => update('description', e.target.value)} />
        <Textarea
          label={t('listingForm.houseRules')}
          value={form.house_rules || ''}
          onChange={(e) => update('house_rules', e.target.value)}
        />
        <div>
          <p className="mb-2 text-sm font-medium">Amenities</p>
          <div className="grid grid-cols-2 gap-2">
            {AMENITIES.map((a) => (
              <label key={a.id} className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={form.amenities?.includes(a.id)} onChange={() => toggleAmenity(a.id)} />
                {a.label}
              </label>
            ))}
          </div>
        </div>
        {error && <p className="text-sm text-error">{error}</p>}
        <div className="flex flex-col gap-3 sm:flex-row">
          <Button type="submit" disabled={saving} className="w-full sm:w-auto">{saving ? 'Saving...' : 'Save changes'}</Button>
          <Button type="button" variant="outline" onClick={() => navigate('/landlord')} className="w-full sm:w-auto">Cancel</Button>
        </div>
      </form>
    </div>
  )
}
