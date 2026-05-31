import { useState } from 'react'
import { MapPin, Pencil, Trash2, ImageIcon } from 'lucide-react'
import { useUniversities } from '../../hooks/useUniversities'
import { useTranslation } from '../../hooks/useTranslation'
import { getUniversityDisplayName } from '../../lib/universityNames'
import Card from '../ui/Card'
import Button from '../ui/Button'
import Badge from '../ui/Badge'
import { Skeleton } from '../ui/Skeleton'

export default function AdminUniversitiesPanel({ onEdit, onDelete }) {
  const { t } = useTranslation()
  const { universities, loading } = useUniversities()
  const [query, setQuery] = useState('')

  const filtered = universities.filter((uni) => {
    const q = query.trim().toLowerCase()
    if (!q) return true
    return (
      uni.name.toLowerCase().includes(q)
      || uni.city.toLowerCase().includes(q)
      || (uni.slug || '').toLowerCase().includes(q)
      || (uni.nearby_areas || []).some((a) => a.toLowerCase().includes(q))
    )
  })

  if (loading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map((i) => <Skeleton key={i} className="h-24 w-full" />)}
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted">{t('admin.universitiesManageHint')}</p>

      <input
        type="search"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder={t('admin.universitiesSearch')}
        className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-primary outline-none focus:ring-2 focus:ring-accent/40 sm:max-w-md"
      />

      {filtered.length === 0 ? (
        <Card className="p-8 text-center text-muted">{t('admin.noUniversitiesMatch')}</Card>
      ) : (
        <div className="space-y-3">
          {filtered.map((uni) => (
            <Card key={uni.id} className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex min-w-0 items-start gap-3">
                <div className="relative h-16 w-24 shrink-0 overflow-hidden rounded-lg border border-border bg-background">
                  {uni.image ? (
                    <img src={uni.image} alt="" className="h-full w-full object-cover" />
                  ) : (
                    <div className="flex h-full items-center justify-center text-muted">
                      <ImageIcon size={20} />
                    </div>
                  )}
                </div>
                <div className="min-w-0">
                  <p className="font-semibold text-primary">{getUniversityDisplayName(uni)}</p>
                  <p className="mt-0.5 flex items-center gap-1 text-sm text-muted">
                    <MapPin size={12} />
                    {uni.city}
                    {uni.lat != null && uni.lng != null && (
                      <span className="text-xs"> · {Number(uni.lat).toFixed(4)}, {Number(uni.lng).toFixed(4)}</span>
                    )}
                  </p>
                  {(uni.nearby_areas || []).length > 0 ? (
                    <p className="mt-1 line-clamp-1 text-xs text-muted">
                      {t('listings.nearPrefix')} {uni.nearby_areas.slice(0, 4).join(' · ')}
                    </p>
                  ) : (
                    <Badge variant="warning" className="mt-1">{t('admin.universityNoNearby')}</Badge>
                  )}
                </div>
              </div>
              <div className="flex shrink-0 gap-2">
                <Button size="sm" variant="outline" onClick={() => onEdit(uni)}>
                  <Pencil size={14} />
                  {t('admin.edit')}
                </Button>
                <Button size="sm" variant="danger" onClick={() => onDelete(uni)}>
                  <Trash2 size={14} />
                  {t('admin.delete')}
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
