import { useState } from 'react'
import { Link2, Loader2, Upload } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { useTranslation } from '../../hooks/useTranslation'
import { normalizeListingPhone } from '../../lib/listingValidation'
import { ROOM_TYPES, GENDER_PREFERENCES } from '../../lib/utils'
import Button from '../ui/Button'
import Card from '../ui/Card'
import Input, { Textarea, Select } from '../ui/Input'
import PhoneInput from '../ui/PhoneInput'

const EMPTY = {
  title: '',
  description: '',
  price: '',
  room_type: 'single',
  gender_preference: 'any',
  area: '',
  city: 'Gaborone',
  address: '',
  contact_name: '',
  whatsapp_country_code: '267',
  whatsapp_number: '',
  source_label: '',
  source_url: '',
  photo_urls: '',
}

export default function AdminImportExternalPanel({ onImported, onToast }) {
  const { t } = useTranslation()
  const [form, setForm] = useState(EMPTY)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  function update(key, value) {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setBusy(true)
    try {
      const photoUrls = form.photo_urls
        .split(/[\n,]+/)
        .map((u) => u.trim())
        .filter(Boolean)

      const { data, error: rpcError } = await supabase.rpc('admin_import_external_listing', {
        p_title: form.title.trim(),
        p_description: form.description.trim(),
        p_price: Number(form.price),
        p_room_type: form.room_type,
        p_area: form.area.trim(),
        p_city: form.city.trim(),
        p_whatsapp_number: normalizeListingPhone(form.whatsapp_number, form.whatsapp_country_code),
        p_contact_name: form.contact_name.trim(),
        p_photo_urls: photoUrls,
        p_source_label: form.source_label.trim() || null,
        p_source_url: form.source_url.trim() || null,
        p_address: form.address.trim() || null,
        p_gender_preference: form.gender_preference,
        p_amenities: [],
      })

      if (rpcError) throw rpcError

      setForm(EMPTY)
      onToast?.({ type: 'success', message: t('admin.externalImportSuccess') })
      onImported?.(data)
    } catch (err) {
      setError(err.message || t('admin.externalImportFailed'))
    } finally {
      setBusy(false)
    }
  }

  return (
    <Card className="p-5 sm:p-6">
      <div className="mb-4 flex items-start gap-3">
        <div className="rounded-lg bg-background p-2 text-accent">
          <Upload size={20} />
        </div>
        <div>
          <h2 className="font-semibold text-primary">{t('admin.externalImportTitle')}</h2>
          <p className="mt-1 text-sm text-muted">{t('admin.externalImportHint')}</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <Input
              label={t('admin.externalTitle')}
              value={form.title}
              onChange={(e) => update('title', e.target.value)}
              required
            />
          </div>
          <div className="sm:col-span-2">
            <Textarea
              label={t('admin.externalDescription')}
              value={form.description}
              onChange={(e) => update('description', e.target.value)}
              rows={4}
            />
          </div>
          <Input
            label={t('admin.externalPrice')}
            type="number"
            min={0}
            value={form.price}
            onChange={(e) => update('price', e.target.value)}
            required
          />
          <Select
            label={t('admin.externalRoomType')}
            value={form.room_type}
            onChange={(e) => update('room_type', e.target.value)}
          >
            {Object.entries(ROOM_TYPES).map(([id, label]) => (
              <option key={id} value={id}>{label}</option>
            ))}
          </Select>
          <Select
            label={t('admin.externalGender')}
            value={form.gender_preference}
            onChange={(e) => update('gender_preference', e.target.value)}
          >
            {Object.entries(GENDER_PREFERENCES).map(([id, label]) => (
              <option key={id} value={id}>{label}</option>
            ))}
          </Select>
          <Input
            label={t('admin.externalContactName')}
            value={form.contact_name}
            onChange={(e) => update('contact_name', e.target.value)}
            required
          />
          <div className="sm:col-span-2">
            <PhoneInput
              label={t('admin.externalWhatsApp')}
              countryCode={form.whatsapp_country_code}
              national={form.whatsapp_number}
              onCountryCodeChange={(code) => update('whatsapp_country_code', code)}
              onNationalChange={(value) => update('whatsapp_number', value)}
              required
            />
          </div>
          <Input
            label={t('admin.externalArea')}
            value={form.area}
            onChange={(e) => update('area', e.target.value)}
            required
          />
          <Input
            label={t('admin.externalCity')}
            value={form.city}
            onChange={(e) => update('city', e.target.value)}
            required
          />
          <div className="sm:col-span-2">
            <Input
              label={t('admin.externalAddress')}
              value={form.address}
              onChange={(e) => update('address', e.target.value)}
            />
          </div>
          <Input
            label={t('admin.externalSourceLabel')}
            value={form.source_label}
            onChange={(e) => update('source_label', e.target.value)}
            placeholder="Facebook group, Marketplace…"
          />
          <Input
            label={t('admin.externalSourceUrl')}
            value={form.source_url}
            onChange={(e) => update('source_url', e.target.value)}
            placeholder="https://…"
          />
          <div className="sm:col-span-2">
            <Textarea
              label={t('admin.externalPhotoUrls')}
              value={form.photo_urls}
              onChange={(e) => update('photo_urls', e.target.value)}
              rows={3}
              placeholder={t('admin.externalPhotoUrlsHint')}
            />
          </div>
        </div>

        {error && <p className="text-sm text-error">{error}</p>}

        <div className="flex flex-wrap items-center gap-3">
          <Button type="submit" disabled={busy}>
            {busy ? <Loader2 size={16} className="animate-spin" /> : <Link2 size={16} />}
            {busy ? t('admin.externalImporting') : t('admin.externalImportSubmit')}
          </Button>
          <p className="text-xs text-muted">{t('admin.externalImportNote')}</p>
        </div>
      </form>
    </Card>
  )
}
