import { useCallback, useEffect, useState } from 'react'
import { Map, AdvancedMarker } from '@vis.gl/react-google-maps'
import { Loader2, MapPin, RefreshCw, Upload, ImageIcon } from 'lucide-react'
import Modal from '../ui/Modal'
import Button from '../ui/Button'
import Input, { Textarea } from '../ui/Input'
import { GOOGLE_MAPS_MAP_ID } from '../../lib/googleMaps'
import {
  publishUniversityDraft,
  refreshNearbyAreasForPin,
  refreshUniversityDraftCoords,
} from '../../lib/adminUniversities'
import { useTranslation } from '../../hooks/useTranslation'

function CampusMap({ lat, lng, onPinMove }) {
  const center = { lat, lng }

  return (
    <div className="overflow-hidden rounded-xl border border-border">
      <Map
        defaultCenter={center}
        center={center}
        defaultZoom={15}
        zoom={15}
        mapId={GOOGLE_MAPS_MAP_ID}
        gestureHandling="greedy"
        disableDefaultUI
        style={{ width: '100%', height: 240 }}
      >
        <AdvancedMarker
          position={center}
          draggable
          onDragEnd={(e) => {
            const latLng = e.latLng
            if (!latLng) return
            onPinMove(latLng.lat(), latLng.lng())
          }}
        />
      </Map>
    </div>
  )
}

export default function UniversityPublishModal({ open, draft: initialDraft, onClose, onPublished }) {
  const { t } = useTranslation()
  const [draft, setDraft] = useState(initialDraft)
  const [busy, setBusy] = useState(false)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (open && initialDraft) {
      setDraft(initialDraft)
      setError('')
    }
  }, [open, initialDraft])

  const nearbyText = (draft?.nearbyAreas || []).join(', ')

  function updateField(field, value) {
    setDraft((prev) => (prev ? { ...prev, [field]: value } : prev))
  }

  function updateNearbyText(value) {
    const nearbyAreas = value
      .split(/[,·\n]/)
      .map((s) => s.trim())
      .filter(Boolean)
    setDraft((prev) => (prev ? { ...prev, nearbyAreas } : prev))
  }

  function handlePhotoChange(e) {
    const file = e.target.files?.[0]
    if (!file) return
    const preview = URL.createObjectURL(file)
    setDraft((prev) => (prev ? { ...prev, imageFile: file, imagePreviewUrl: preview } : prev))
  }

  const handlePinMove = useCallback(async (lat, lng) => {
    if (!draft) return
    setRefreshing(true)
    try {
      const next = await refreshNearbyAreasForPin(draft, lat, lng)
      setDraft(next)
    } catch {
      setDraft((prev) => (prev ? { ...prev, lat, lng } : prev))
    } finally {
      setRefreshing(false)
    }
  }, [draft])

  async function handleRefreshLocation() {
    if (!draft) return
    setRefreshing(true)
    setError('')
    try {
      const next = await refreshUniversityDraftCoords(draft)
      setDraft(next)
    } catch (err) {
      setError(err.message || t('admin.actionFailed'))
    } finally {
      setRefreshing(false)
    }
  }

  async function handlePublish() {
    if (!draft) return
    setBusy(true)
    setError('')
    try {
      await publishUniversityDraft(draft)
      onPublished?.()
      onClose()
    } catch (err) {
      setError(err.message || t('admin.actionFailed'))
    } finally {
      setBusy(false)
    }
  }

  if (!draft) return null

  const previewImage = draft.imagePreviewUrl

  return (
    <Modal open={open} onClose={onClose} title={t('admin.universityPublishTitle')} size="xl">
      <div className="space-y-5">
        <p className="text-sm text-muted">{t('admin.universityPublishHint')}</p>

        {draft.formattedAddress && (
          <div className="flex items-start gap-2 rounded-lg border border-border bg-background px-3 py-2 text-sm text-muted">
            <MapPin size={16} className="mt-0.5 shrink-0 text-accent" />
            <span>{draft.formattedAddress}</span>
          </div>
        )}

        <CampusMap lat={draft.lat} lng={draft.lng} onPinMove={handlePinMove} />
        <p className="text-xs text-muted">{t('admin.universityDragPin')}</p>

        <div className="grid gap-4 sm:grid-cols-2">
          <Input
            label={t('admin.universityName')}
            value={draft.name}
            onChange={(e) => updateField('name', e.target.value)}
          />
          <Input
            label={t('admin.universityCity')}
            value={draft.city}
            onChange={(e) => updateField('city', e.target.value)}
          />
        </div>

        <div className="flex flex-wrap gap-2">
          <Button type="button" variant="outline" size="sm" onClick={handleRefreshLocation} disabled={refreshing || busy}>
            {refreshing ? <Loader2 size={14} className="animate-spin" /> : <RefreshCw size={14} />}
            {t('admin.universityRefreshMap')}
          </Button>
          {refreshing && (
            <span className="self-center text-xs text-muted">{t('admin.universityRefreshingAreas')}</span>
          )}
        </div>

        <Textarea
          label={t('admin.universityNearbyAreas')}
          value={nearbyText}
          onChange={(e) => updateNearbyText(e.target.value)}
          placeholder={t('admin.universityNearbyPlaceholder')}
          rows={2}
        />

        <div>
          <p className="mb-2 text-sm font-medium text-primary">{t('admin.universityPhoto')}</p>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start">
            <div className="relative aspect-[16/10] w-full overflow-hidden rounded-xl border border-border bg-background sm:max-w-[220px]">
              {previewImage ? (
                <img src={previewImage} alt="" className="h-full w-full object-cover" />
              ) : (
                <div className="flex h-full flex-col items-center justify-center gap-2 text-muted">
                  <ImageIcon size={28} />
                  <span className="text-xs">{t('admin.universityPhotoEmpty')}</span>
                </div>
              )}
            </div>
            <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-border bg-surface px-4 py-2 text-sm font-medium text-primary hover:border-accent/40">
              <Upload size={16} />
              {t('admin.universityPhotoUpload')}
              <input type="file" accept="image/*" className="sr-only" onChange={handlePhotoChange} />
            </label>
          </div>
        </div>

        <div className="rounded-lg border border-border bg-background px-3 py-2 text-xs text-muted">
          <span className="font-medium text-primary">{t('admin.universityCoords')}</span>
          {' '}
          {draft.lat.toFixed(5)}, {draft.lng.toFixed(5)}
          {draft.geocodeSource && ` · ${draft.geocodeSource}`}
        </div>

        {error && (
          <p className="rounded-lg border border-error/30 bg-error/5 px-3 py-2 text-sm text-error">{error}</p>
        )}

        <div className="flex flex-col-reverse gap-2 border-t border-border pt-4 sm:flex-row sm:justify-end">
          <Button type="button" variant="outline" onClick={onClose} disabled={busy}>
            {t('admin.cancel')}
          </Button>
          <Button type="button" onClick={handlePublish} disabled={busy || refreshing}>
            {busy ? <Loader2 size={16} className="animate-spin" /> : null}
            {busy ? t('admin.universityPublishing') : t('admin.universityPublish')}
          </Button>
        </div>
      </div>
    </Modal>
  )
}
