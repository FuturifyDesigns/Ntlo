import { useState, useEffect } from 'react'
import { useNavigate, useParams, Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'
import { useUniversities } from '../hooks/useUniversities'
import { getUniversityById } from '../lib/universities'
import { AMENITIES, ROOM_TYPES, calculateDistance } from '../lib/utils'
import Button from '../components/ui/Button'
import Input, { Select, Textarea } from '../components/ui/Input'
import { LocationPicker } from '../components/maps/ListingMap'
import { Skeleton } from '../components/ui/Skeleton'

export default function EditListing() {
  const { id } = useParams()
  const { user } = useAuth()
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
        setForm(data)
      }
      setLoading(false)
    }
    if (user) load()
  }, [id, user])

  function update(field, value) {
    setForm((f) => ({ ...f, [field]: value }))
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
  if (error || !form) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-16 text-center">
        <p className="text-error">{error || 'Not found'}</p>
        <Button as={Link} to="/landlord" variant="outline" className="mt-4">Back</Button>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <h1 className="font-display text-3xl font-bold text-primary">Edit listing</h1>
      <form onSubmit={handleSave} className="mt-6 space-y-4 rounded-xl border border-border bg-surface p-6">
        <Input label="Title" value={form.title} onChange={(e) => update('title', e.target.value)} required />
        <Select label="Room type" value={form.room_type} onChange={(e) => update('room_type', e.target.value)}>
          {Object.entries(ROOM_TYPES).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </Select>
        <Input label="Price (Pula)" type="number" value={form.price} onChange={(e) => update('price', e.target.value)} required />
        <Input label="Address" value={form.address} onChange={(e) => update('address', e.target.value)} required />
        <Input label="Area" value={form.area || ''} onChange={(e) => update('area', e.target.value)} />
        <Input label="City" value={form.city} onChange={(e) => update('city', e.target.value)} required />
        <LocationPicker
          lat={form.lat}
          lng={form.lng}
          onChange={({ lat, lng }) => {
            update('lat', lat)
            update('lng', lng)
          }}
          hint="Update the map pin for this listing."
        />
        <div className="grid grid-cols-2 gap-4">
          <Input label="Latitude" type="number" step="any" value={form.lat ?? ''} onChange={(e) => update('lat', e.target.value)} />
          <Input label="Longitude" type="number" step="any" value={form.lng ?? ''} onChange={(e) => update('lng', e.target.value)} />
        </div>
        <Select label="Nearest university" value={form.nearest_university_id || ''} onChange={(e) => update('nearest_university_id', e.target.value)}>
          <option value="">Select</option>
          {universities.map((u) => <option key={u.id} value={u.id}>{u.short_name}</option>)}
        </Select>
        <Input label="WhatsApp" value={form.whatsapp_number} onChange={(e) => update('whatsapp_number', e.target.value)} required />
        <Textarea label="Description" value={form.description || ''} onChange={(e) => update('description', e.target.value)} />
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
        <div className="flex gap-3">
          <Button type="submit" disabled={saving}>{saving ? 'Saving...' : 'Save changes'}</Button>
          <Button type="button" variant="outline" onClick={() => navigate('/landlord')}>Cancel</Button>
        </div>
      </form>
    </div>
  )
}
