import { Search, SlidersHorizontal, X } from 'lucide-react'
import { useUniversities } from '../../hooks/useUniversities'
import { getUniversityDisplayName } from '../../lib/universityNames'
import { emptyListingFilters } from '../../lib/listingFilters'
import { AMENITIES, ROOM_TYPES } from '../../lib/utils'
import { Select } from '../ui/Input'
import { useTranslation } from '../../hooks/useTranslation'

export default function FilterBar({
  filters,
  onChange,
  onSearchSubmit,
  resultCount,
  universityName,
  liveSearch = true,
  /** Keys always restored on clear (e.g. campus page keeps universityId). */
  lockedFilters = null,
}) {
  const { t } = useTranslation()
  const { universities } = useUniversities()

  function update(key, value) {
    onChange({ ...filters, [key]: value })
  }

  function clearFilters() {
    onChange(emptyListingFilters(lockedFilters || {}))
  }

  function handleSearchSubmit(e) {
    e.preventDefault()
    onSearchSubmit?.()
  }

  const hasActiveFilters =
    filters.search ||
    filters.universityId ||
    filters.minPrice ||
    filters.maxPrice ||
    filters.roomType ||
    filters.genderPreference !== 'any' ||
    filters.availableOnly ||
    filters.verifiedOnly ||
    filters.amenities?.length

  return (
    <div className="space-y-4">
      <form onSubmit={handleSearchSubmit} className="space-y-1">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" size={18} />
          <input
            type="search"
            placeholder={t('filter.searchPlaceholder')}
            value={filters.search || ''}
            onChange={(e) => update('search', e.target.value)}
            className="w-full rounded-lg border border-border bg-surface py-2.5 pl-10 pr-4 text-sm outline-none focus:border-accent focus:ring-2 focus:ring-accent/20"
          />
        </div>
        <p className="text-xs text-muted">
          {liveSearch ? t('filter.searchLiveHint') : t('filter.searchEnterHint')}
        </p>
      </form>

      <div className="flex flex-wrap gap-2">
        <Select
          value={filters.universityId || ''}
          onChange={(e) => {
            const val = e.target.value
            update('universityId', val === 'other' ? 'other' : val ? Number(val) : '')
          }}
          className="w-auto min-w-[160px] py-2"
        >
          <option value="">{t('filter.allUniversities')}</option>
          {universities.map((u) => (
            <option key={u.id} value={u.id}>{getUniversityDisplayName(u)} — {u.city}</option>
          ))}
          <option value="other">{t('filter.otherUniversity')}</option>
        </Select>

        <Select
          value={filters.roomType || ''}
          onChange={(e) => update('roomType', e.target.value)}
          className="w-auto min-w-[140px] py-2"
        >
          <option value="">{t('filter.propertyType')}</option>
          {Object.entries(ROOM_TYPES).map(([key, label]) => (
            <option key={key} value={key}>{label}</option>
          ))}
        </Select>

        <Select
          value={filters.maxPrice || ''}
          onChange={(e) => update('maxPrice', e.target.value ? Number(e.target.value) : '')}
          className="w-auto min-w-[130px] py-2"
        >
          <option value="">{t('filter.priceRange')}</option>
          <option value="1000">Under P1,000</option>
          <option value="1500">Under P1,500</option>
          <option value="2000">Under P2,000</option>
          <option value="3000">Under P3,000</option>
          <option value="5000">Under P5,000</option>
        </Select>

        <Select
          value={filters.sortBy || 'newest'}
          onChange={(e) => update('sortBy', e.target.value)}
          className="w-auto min-w-[130px] py-2"
        >
          <option value="newest">{t('filter.newest')}</option>
          <option value="price_asc">Price ↑</option>
          <option value="price_desc">Price ↓</option>
          <option value="distance">Distance</option>
        </Select>
      </div>

      <details className="group">
        <summary className="flex cursor-pointer items-center gap-2 text-sm font-medium text-muted hover:text-primary">
          <SlidersHorizontal size={16} />
          {t('filter.moreFilters')}
        </summary>
        <div className="mt-3 rounded-xl border border-border bg-surface p-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <Select
              label={t('filter.genderPreference')}
              value={filters.genderPreference || 'any'}
              onChange={(e) => update('genderPreference', e.target.value)}
            >
              <option value="any">{t('filter.any')}</option>
              <option value="female">{t('filter.femaleOnly')}</option>
              <option value="male">{t('filter.maleOnly')}</option>
            </Select>
            <Select
              label={t('filter.minPrice')}
              value={filters.minPrice || ''}
              onChange={(e) => update('minPrice', e.target.value ? Number(e.target.value) : '')}
            >
              <option value="">{t('filter.any')}</option>
              <option value="500">P500+</option>
              <option value="800">P800+</option>
              <option value="1000">P1,000+</option>
              <option value="1500">P1,500+</option>
            </Select>
          </div>
          <div className="mt-4">
            <p className="mb-2 text-sm font-medium">{t('filter.amenities')}</p>
            <div className="flex flex-wrap gap-2">
              {AMENITIES.map((a) => {
                const active = filters.amenities?.includes(a.id)
                return (
                  <button
                    key={a.id}
                    type="button"
                    onClick={() => {
                      const current = filters.amenities || []
                      update(
                        'amenities',
                        active ? current.filter((x) => x !== a.id) : [...current, a.id]
                      )
                    }}
                    className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
                      active
                        ? 'border-accent bg-accent/15 text-accent'
                        : 'border-border text-muted hover:border-accent/50'
                    }`}
                  >
                    {a.label}
                  </button>
                )
              })}
            </div>
          </div>
          <label className="mt-4 flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={filters.availableOnly === true}
              onChange={(e) => update('availableOnly', e.target.checked)}
              className="rounded border-border accent-accent"
            />
            {t('filter.availableOnly')}
          </label>
          <label className="mt-2 flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={filters.verifiedOnly === true}
              onChange={(e) => update('verifiedOnly', e.target.checked)}
              className="rounded border-border accent-accent"
            />
            {t('filter.verifiedOnly')}
          </label>
        </div>
      </details>

      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm text-muted">
          {resultCount != null && (
            <>
              <span className="font-semibold text-primary">{resultCount}</span>
              {' '}
              {resultCount === 1 ? t('filter.roomFound') : t('filter.roomsFound')}
              {universityName && ` ${t('filter.near')} ${universityName}`}
            </>
          )}
        </p>
        {hasActiveFilters && (
          <button
            type="button"
            onClick={clearFilters}
            className="flex items-center gap-1 text-sm text-accent hover:underline"
          >
            <X size={14} />
            {t('filter.clearFilters')}
          </button>
        )}
      </div>
    </div>
  )
}
