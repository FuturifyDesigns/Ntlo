import { useState, useEffect, useMemo, useRef, useCallback } from 'react'
import { useNavigate, useParams, Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'
import { useTranslation } from '../hooks/useTranslation'
import { getUniversityById } from '../lib/universities'
import { getUniversityDisplayName } from '../lib/universityNames'
import {
  AMENITIES, ROOM_TYPES, GENDER_PREFERENCES, UTILITIES_OPTIONS, calculateDistance,
} from '../lib/utils'
import { validateListingForm, normalizeListingPhone } from '../lib/listingValidation'
import { getListingEditPolicy, isFieldLocked, mapListingEditError } from '../lib/listingEditPolicy'
import { useCompetitiveMarket } from '../hooks/useCompetitiveMarket'
import { analyzeCompetitivePosition } from '../lib/competitiveAdvisor'
import LandlordListingCoach from '../components/advisor/LandlordListingCoach'
import { getDraftKey, loadDraft } from '../lib/formDrafts'
import { useFormDraft } from '../hooks/useFormDraft'
import { UniversitySelect } from '../components/universities/OtherUniversityModal'
import Button from '../components/ui/Button'
import Input, { Select, Textarea } from '../components/ui/Input'
import { LocationPicker } from '../components/maps/ListingMap'
import { Skeleton } from '../components/ui/Skeleton'
import DocumentUpload from '../components/verification/DocumentUpload'
import { LISTING_DOC_TYPES } from '../lib/verification'
import { fetchListingVerificationDocs, uploadVerificationDoc } from '../lib/verificationStorage'
import { isListingUniversityReady } from '../lib/listingLocation'

export default function EditListing() {
  const { id } = useParams()
  const { user } = useAuth()
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [form, setForm] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [fieldErrors, setFieldErrors] = useState({})
  const [applications, setApplications] = useState([])
  const [editPolicy, setEditPolicy] = useState(null)
  const [listingDocs, setListingDocs] = useState({})
  const [draftRestored, setDraftRestored] = useState(false)
  const dbFormRef = useRef(null)

  const draftKey = useMemo(() => getDraftKey(`listing_edit_${id}`, user?.id), [id, user?.id])

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
    phoneRequired: t('auth.validation.phoneRequired'),
    phoneInvalid: t('auth.validation.phoneInvalid'),
    descriptionRequired: t('listingForm.validation.descriptionRequired'),
    descriptionMin: t('listingForm.validation.descriptionMin'),
    descriptionMax: t('listingForm.validation.descriptionMax'),
  }), [t])

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
        const isOther = !data.nearest_university_id && data.custom_university_name
        const dbForm = {
          ...data,
          nearest_university_id: isOther ? 'other' : String(data.nearest_university_id || ''),
          deposit_pula: data.deposit_pula ?? '',
          utilities_included: data.utilities_included ?? '',
          house_rules: data.house_rules ?? '',
          custom_university_name: data.custom_university_name ?? '',
          custom_university_city: data.custom_university_city ?? '',
        }
        dbFormRef.current = dbForm
        const { data: apps } = await supabase
          .from('listing_applications')
          .select('id, status')
          .eq('listing_id', id)
          .in('status', ['submitted', 'under_review', 'changes_requested', 'accepted'])
        setApplications(apps || [])
        setEditPolicy(getListingEditPolicy(data, { applications: apps || [] }))
        const docs = await fetchListingVerificationDocs(id)
        const latestByType = {}
        for (const doc of docs) {
          if (!latestByType[doc.doc_type]) latestByType[doc.doc_type] = doc
        }
        setListingDocs(latestByType)
        const draft = loadDraft(draftKey)
        if (draft?.form) {
          setForm({ ...dbForm, ...draft.form })
          setDraftRestored(true)
        } else {
          setForm(dbForm)
        }
      }
      setLoading(false)
    }
    if (user) load()
  }, [id, user, draftKey])

  const handleDraftClear = useCallback(() => {
    if (dbFormRef.current) setForm({ ...dbFormRef.current })
    setFieldErrors({})
    setError('')
    setDraftRestored(false)
  }, [])

  const { savedLabel, clearDraft } = useFormDraft(
    draftKey,
    { form },
    null,
    { enabled: Boolean(user?.id && form), debounceMs: 450, onClear: handleDraftClear }
  )

  const previewListing = useMemo(() => (form ? { ...form, id } : null), [form, id])
  const materialLocked = editPolicy?.lockedFields?.length > 0
  const { marketListings } = useCompetitiveMarket(previewListing)
  const liveCompetition = useMemo(() => {
    if (!previewListing || materialLocked) return null
    return analyzeCompetitivePosition(previewListing, marketListings, { landlordId: user?.id })
  }, [previewListing, marketListings, user?.id, materialLocked])

  function update(field, value) {
    setForm((f) => ({ ...f, [field]: value }))
    if (fieldErrors[field]) setFieldErrors((prev) => ({ ...prev, [field]: '' }))
  }

  function updateUniversityField(field, value) {
    setForm((f) => {
      const campusChanged = field === 'nearest_university_id' && f.nearest_university_id !== value
      const otherChanged = (field === 'custom_university_name' || field === 'custom_university_city')
        && f[field] !== value
      const clearPin = !editPolicy?.lockedFields?.length && (campusChanged || otherChanged)
      return {
        ...f,
        [field]: value,
        ...(clearPin ? { lat: '', lng: '' } : {}),
      }
    })
    if (fieldErrors[field]) setFieldErrors((prev) => ({ ...prev, [field]: '' }))
    if (fieldErrors.pin) setFieldErrors((prev) => ({ ...prev, pin: '' }))
  }

  function handleLocationChange({ lat, lng, address, area, city }) {
    setForm((f) => ({
      ...f,
      lat,
      lng,
      ...(address !== undefined ? { address } : {}),
      ...(area !== undefined ? { area } : {}),
      ...(city !== undefined ? { city } : {}),
    }))
    if (fieldErrors.pin) setFieldErrors((prev) => ({ ...prev, pin: '' }))
  }

  function toggleAmenity(amenityId) {
    setForm((f) => ({
      ...f,
      amenities: f.amenities.includes(amenityId)
        ? f.amenities.filter((a) => a !== amenityId)
        : [...f.amenities, amenityId],
    }))
  }

  async function handleListingDoc(docType, file) {
    const doc = await uploadVerificationDoc({ userId: user.id, listingId: id, docType, file })
    setListingDocs((prev) => ({ ...prev, [docType]: doc }))
  }

  async function handleSave(e) {
    e.preventDefault()
    const materialLocked = editPolicy?.lockedFields?.length > 0
    const errors = materialLocked
      ? {}
      : validateListingForm(form, {}, validationMessages)
    if (!materialLocked) delete errors.photos
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors)
      setError(t('listingForm.validation.fixErrors'))
      return
    }

    const needsResubmit = ['changes_requested', 'rejected'].includes(form.verification_status)
    if (needsResubmit) {
      const flaggedDocs = Object.values(listingDocs).filter((doc) => doc?.status === 'changes_requested')
      if (flaggedDocs.length > 0) {
        setError(t('listingReview.uploadFlaggedDocs'))
        return
      }
    }

    setSaving(true)
    setError('')
    try {
      const isOther = form.nearest_university_id === 'other'
      const uni = !isOther ? getUniversityById(form.nearest_university_id) : null
      let distance = form.distance_to_campus
      if (!materialLocked && uni && form.lat && form.lng) {
        distance = calculateDistance(Number(form.lat), Number(form.lng), uni.lat, uni.lng)
      }

      const fullPayload = {
        title: form.title.trim(),
        description: form.description?.trim() || '',
        price: Number(form.price),
        room_type: form.room_type,
        gender_preference: form.gender_preference,
        deposit_pula: form.deposit_pula ? Number(form.deposit_pula) : null,
        utilities_included: form.utilities_included || null,
        house_rules: form.house_rules?.trim() || null,
        address: form.address?.trim() || '',
        area: form.area?.trim() || '',
        city: form.city.trim(),
        lat: form.lat ? Number(form.lat) : null,
        lng: form.lng ? Number(form.lng) : null,
        nearest_university_id: isOther ? null : form.nearest_university_id ? Number(form.nearest_university_id) : null,
        custom_university_name: isOther ? form.custom_university_name?.trim() || null : null,
        custom_university_city: isOther ? form.custom_university_city?.trim() || null : null,
        distance_to_campus: distance,
        amenities: form.amenities || [],
        whatsapp_number: normalizeListingPhone(form.whatsapp_number),
        updated_at: new Date().toISOString(),
      }

      const payload = materialLocked
        ? {
            title: fullPayload.title,
            description: fullPayload.description,
            house_rules: fullPayload.house_rules,
            whatsapp_number: fullPayload.whatsapp_number,
            updated_at: fullPayload.updated_at,
          }
        : fullPayload

      const needsResubmit = ['changes_requested', 'rejected'].includes(form.verification_status)
      if (needsResubmit) {
        payload.verification_status = 'pending'
        payload.verification_notes = null
      }

      const { error: updateError } = await supabase.from('listings').update(payload).eq('id', id)

      if (updateError) throw updateError
      clearDraft()
      navigate('/landlord', { state: needsResubmit ? { listingResubmitted: true } : undefined })
    } catch (err) {
      const key = mapListingEditError(err.message)
      setError(key ? t(`listingEdit.errors.${key}`) : err.message)
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

  const isOtherUni = form.nearest_university_id === 'other'
  const uni = isOtherUni ? null : getUniversityById(form.nearest_university_id)
  const campusCoords = uni?.lat != null && uni?.lng != null
    ? { lat: uni.lat, lng: uni.lng }
    : null
  const campusZoom = uni?.map_zoom ?? undefined
  const universityReady = isListingUniversityReady({
    universityId: isOtherUni ? 'other' : String(form.nearest_university_id || ''),
    customUniversityName: form.custom_university_name,
    customUniversityCity: form.custom_university_city,
  })
  const locked = (field) => isFieldLocked(field, editPolicy)

  return (
    <div className="mx-auto max-w-2xl px-4 py-5 sm:px-6 sm:py-8">
      <h1 className="font-display text-3xl font-bold text-primary">{t('listingEdit.title')}</h1>

      {editPolicy?.messageKey && (
        <div className="mt-4 rounded-lg border border-amber-500/30 bg-amber-500/5 px-4 py-3 text-sm text-primary">
          <p className="font-medium">{t(editPolicy.messageKey)}</p>
          {editPolicy.hintKey && <p className="mt-1 text-muted">{t(editPolicy.hintKey)}</p>}
        </div>
      )}

      {form.verification_status === 'changes_requested' && (
        <div className="mt-4 rounded-lg border border-amber-500/30 bg-amber-500/5 px-4 py-3 text-sm text-primary">
          <p className="font-medium">{t('listingReview.changesRequestedTitle')}</p>
          {form.verification_notes && (
            <p className="mt-1 text-muted">{form.verification_notes}</p>
          )}
          <p className="mt-2 text-muted">{t('listingReview.changesRequestedHint')}</p>
        </div>
      )}

      {form.verification_status === 'pending' && (
        <div className="mt-4 rounded-lg border border-border bg-surface px-4 py-3 text-sm text-muted">
          {t('listingReview.pendingBanner')}
        </div>
      )}

      {['changes_requested', 'rejected'].includes(form.verification_status) && (
        <div className="mt-6 space-y-4 rounded-xl border border-border bg-surface p-5">
          <p className="text-sm font-medium text-primary">{t('listingReview.updateDocuments')}</p>
          {LISTING_DOC_TYPES.map((doc) => (
            <DocumentUpload
              key={doc.id}
              docType={doc.id}
              label={t(doc.labelKey)}
              description={t(doc.descKey)}
              accept={doc.accept}
              uploaded={listingDocs[doc.id] || null}
              onUpload={handleListingDoc}
            />
          ))}
        </div>
      )}

      {(draftRestored || savedLabel) && (
        <div className="mt-4 flex flex-wrap items-center justify-between gap-2 rounded-lg border border-accent/30 bg-accent/5 px-3 py-2 text-xs text-primary">
          <span>
            {draftRestored
              ? t('listingForm.draftRestored')
              : t('listingForm.draftSaved', { time: savedLabel })}
          </span>
          <div className="flex gap-2">
            {draftRestored && (
              <button type="button" onClick={() => setDraftRestored(false)} className="font-semibold text-accent hover:underline">
                {t('listingForm.draftDismiss')}
              </button>
            )}
            <button type="button" onClick={clearDraft} className="font-semibold text-muted hover:text-error">
              {t('listingForm.draftClear')}
            </button>
          </div>
        </div>
      )}

      {!materialLocked && (
        <div className="mt-6 space-y-4">
          <LandlordListingCoach form={form} photoCount={0} marketListings={marketListings.filter((l) => l.landlord_id !== user?.id)} />
          {liveCompetition?.actions?.length > 0 && (
            <div className="rounded-xl border border-accent/25 bg-surface p-4 text-sm">
              <p className="font-semibold text-primary">{t('advisor.competitive.livePreview')}</p>
              {liveCompetition.rank && (
                <p className="mt-1 text-muted">
                  {t('advisor.competitive.rankBadge', { rank: liveCompetition.rank, total: liveCompetition.availableCount })}
                </p>
              )}
              <ul className="mt-2 space-y-1 text-muted">
                {liveCompetition.actions.slice(0, 3).map((a, i) => (
                  <li key={i}>• {t(`advisor.competitive.action.${a.key}`, a.meta || {})}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      <form onSubmit={handleSave} className="mt-6 space-y-4 rounded-xl border border-border bg-surface p-5 sm:p-6">
        <Input label="Title" value={form.title} onChange={(e) => update('title', e.target.value)} error={fieldErrors.title} required />
        <Select label="Room type" value={form.room_type} onChange={(e) => update('room_type', e.target.value)} disabled={locked('room_type')}>
          {Object.entries(ROOM_TYPES).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </Select>
        <Input label="Price (Pula)" type="number" min="300" value={form.price} onChange={(e) => update('price', e.target.value)} error={fieldErrors.price} required disabled={locked('price')} />
        <div>
          <p className="mb-2 text-sm font-medium text-primary">{t('listingForm.genderPreference')}</p>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
            {Object.entries(GENDER_PREFERENCES).map(([value, label]) => (
              <button
                key={value}
                type="button"
                disabled={locked('gender_preference')}
                onClick={() => update('gender_preference', value)}
                className={`rounded-lg border px-3 py-2.5 text-sm font-medium ${
                  form.gender_preference === value
                    ? 'border-accent bg-accent/10 text-primary'
                    : 'border-border bg-background text-muted'
                } ${locked('gender_preference') ? 'cursor-not-allowed opacity-60' : ''}`}
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
          error={fieldErrors.deposit_pula}
          disabled={locked('deposit_pula')}
        />
        <Select
          label={t('listingForm.utilities')}
          value={form.utilities_included}
          onChange={(e) => update('utilities_included', e.target.value)}
          disabled={locked('utilities_included')}
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
        <UniversitySelect
          value={isOtherUni ? 'other' : String(form.nearest_university_id || '')}
          onChange={(v) => updateUniversityField('nearest_university_id', v === 'other' ? 'other' : v)}
          otherValue={form.custom_university_name || ''}
          onOtherChange={(v) => updateUniversityField('custom_university_name', v)}
          otherCityValue={form.custom_university_city || ''}
          onOtherCityChange={(v) => updateUniversityField('custom_university_city', v)}
          error={fieldErrors.nearest_university_id}
          otherNameError={fieldErrors.custom_university_name}
          otherCityError={fieldErrors.custom_university_city}
          required
        />
        <Input label="Address" value={form.address || ''} onChange={(e) => update('address', e.target.value)} hint={!universityReady ? t('listingForm.selectUniversityFirst') : t('listingForm.validation.addressHint')} disabled={locked('address') || !universityReady} />
        <Input label="Area" value={form.area || ''} onChange={(e) => update('area', e.target.value)} error={fieldErrors.area} required disabled={locked('area') || !universityReady} />
        <Input label="City" value={form.city} onChange={(e) => update('city', e.target.value)} error={fieldErrors.city} required disabled={locked('city') || !universityReady} />
        {fieldErrors.pin && <p className="text-xs text-error">{fieldErrors.pin}</p>}
        {!locked('lat') && (
        <LocationPicker
          lat={form.lat}
          lng={form.lng}
          address={form.address}
          area={form.area}
          city={form.city}
          universityId={isOtherUni ? 'other' : String(form.nearest_university_id || '')}
          universityReady={universityReady}
          campusCoords={campusCoords}
          campusLabel={uni ? getUniversityDisplayName(uni) : ''}
          campusZoom={campusZoom}
          universityCity={uni?.city || form.custom_university_city}
          customUniversityName={form.custom_university_name || ''}
          customUniversityCity={form.custom_university_city || ''}
          onChange={handleLocationChange}
          hint={t('listingForm.locationHint')}
          universityHint={t('listingForm.universityHint')}
        />
        )}
        <Input
          label="WhatsApp"
          value={form.whatsapp_number}
          onChange={(e) => update('whatsapp_number', e.target.value)}
          hint={t('listingForm.validation.whatsappHint')}
          error={fieldErrors.whatsapp_number}
          required
        />
        <Textarea
          label="Description"
          value={form.description || ''}
          onChange={(e) => update('description', e.target.value)}
          hint={t('listingForm.validation.descriptionHint')}
          error={fieldErrors.description}
          required
        />
        <Textarea
          label={t('listingForm.houseRules')}
          value={form.house_rules || ''}
          onChange={(e) => update('house_rules', e.target.value)}
        />
        <div>
          <p className="mb-2 text-sm font-medium">Amenities</p>
          <div className="grid grid-cols-2 gap-2">
            {AMENITIES.map((a) => (
              <label key={a.id} className={`flex items-center gap-2 text-sm ${locked('amenities') ? 'opacity-60' : ''}`}>
                <input type="checkbox" checked={form.amenities?.includes(a.id)} onChange={() => toggleAmenity(a.id)} disabled={locked('amenities')} />
                {a.label}
              </label>
            ))}
          </div>
        </div>
        {error && <p className="text-sm text-error">{error}</p>}
        <div className="flex flex-col gap-3 sm:flex-row">
          <Button type="submit" disabled={saving} className="w-full sm:w-auto">
            {saving
              ? t('listingEdit.saving')
              : ['changes_requested', 'rejected'].includes(form.verification_status)
                ? t('listingReview.fixAndResubmit')
                : t('listingEdit.save')}
          </Button>
          <Button type="button" variant="outline" onClick={() => navigate('/landlord')} className="w-full sm:w-auto">Cancel</Button>
        </div>
      </form>
    </div>
  )
}
