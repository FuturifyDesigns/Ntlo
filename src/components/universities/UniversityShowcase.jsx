import { useState, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Search, Plus, ArrowRight, MapPin } from 'lucide-react'
import { useUniversities } from '../../hooks/useUniversities'
import { getUniversityDisplayName } from '../../lib/universityNames'
import OtherUniversityModal from './OtherUniversityModal'
import { Reveal, AnimatedCounter } from '../ui/Motion'
import { useTranslation } from '../../hooks/useTranslation'

export default function UniversityShowcase({ counts = {} }) {
  const [search, setSearch] = useState('')
  const [city, setCity] = useState('All')
  const [hovered, setHovered] = useState(null)
  const [otherOpen, setOtherOpen] = useState(false)
  const { t } = useTranslation()

  const { universities, cities } = useUniversities()

  const filtered = useMemo(() => {
    return universities.filter((uni) => {
      const matchCity = city === 'All' || uni.city === city
      const q = search.toLowerCase()
      const matchSearch =
        !q ||
        uni.name.toLowerCase().includes(q) ||
        getUniversityDisplayName(uni).toLowerCase().includes(q) ||
        (uni.short_name || '').toLowerCase().includes(q) ||
        (uni.slug || '').toLowerCase().includes(q) ||
        uni.city.toLowerCase().includes(q) ||
        (uni.nearby_areas || []).some((a) => a.toLowerCase().includes(q))
      return matchCity && matchSearch
    })
  }, [search, city, universities])

  const totalListings = Object.values(counts).reduce((s, n) => s + n, 0)
  const activeUnis = universities.filter((u) => counts[u.id] > 0).length

  return (
    <>
      <section className="border-b border-border bg-surface py-5 sm:py-6">
        <div className="mx-auto grid max-w-7xl grid-cols-3 gap-4 px-4 sm:px-6 lg:px-8">
          {[
            { value: universities.length, label: t('universities.universities') },
            { value: totalListings, label: t('universities.totalListings') },
            { value: activeUnis, label: t('universities.withRooms') },
          ].map(({ value, label }) => (
            <div key={label} className="text-center">
              <p className="font-display text-2xl font-semibold text-accent sm:text-3xl">
                <AnimatedCounter value={value} />
              </p>
              <p className="mt-1 text-xs uppercase tracking-wider text-muted">{label}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="sticky top-14 z-30 border-b border-border bg-background/95 py-3 backdrop-blur-md sm:top-16 sm:py-4 lg:top-[4.25rem]">
        <div className="mx-auto flex max-w-7xl flex-col gap-3 px-4 sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
          <div className="relative flex-1 sm:max-w-xs">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
            <input
              type="search"
              placeholder={t('universities.searchPlaceholder')}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-xl border border-border bg-surface py-2.5 pl-10 pr-4 text-sm outline-none focus:border-accent focus:ring-2 focus:ring-accent/20"
            />
          </div>
          <div className="flex flex-wrap gap-2">
            {['All', ...cities].map((c) => (
              <button
                key={c}
                onClick={() => setCity(c)}
                className={`rounded-full px-4 py-1.5 text-sm font-medium transition-all ${
                  city === c
                    ? 'bg-primary text-white shadow-md'
                    : 'border border-border bg-surface text-muted hover:border-accent/40 hover:text-primary'
                }`}
              >
                {c === 'All' ? t('universities.all') : c}
              </button>
            ))}
          </div>
        </div>
      </section>

      <section className="py-8 sm:py-12 lg:py-14">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <AnimatePresence mode="popLayout">
            <motion.div layout className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {filtered.map((uni, i) => {
                const listingCount = counts[uni.id] || 0
                const isHovered = hovered === uni.id

                return (
                  <motion.div
                    key={uni.id}
                    layout
                    initial={{ opacity: 0, y: 24 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ delay: i * 0.05, duration: 0.4 }}
                  >
                    <Link
                      to={`/universities/${uni.slug}`}
                      className="group block"
                      onMouseEnter={() => setHovered(uni.id)}
                      onMouseLeave={() => setHovered(null)}
                    >
                      <article className="card-elevated overflow-hidden">
                        <div className="relative aspect-[16/10] overflow-hidden">
                          <motion.img
                            src={uni.image}
                            alt={uni.name}
                            className="h-full w-full object-cover"
                            animate={{ scale: isHovered ? 1.06 : 1 }}
                            transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-primary via-primary/40 to-transparent" />
                          <div className="absolute inset-0 bg-primary/20 opacity-0 transition-opacity group-hover:opacity-100" />

                          <div className="absolute left-3 top-3 z-10 max-w-[calc(100%-1.5rem)]">
                            <span className="inline-flex max-w-full items-center truncate rounded-full bg-accent px-2.5 py-1.5 text-xs font-bold uppercase leading-none tracking-wide text-primary shadow-sm">
                              {getUniversityDisplayName(uni)}
                            </span>
                          </div>

                          {listingCount > 0 && (
                            <div className="absolute right-3 top-3">
                              <span className="rounded-full bg-white/95 px-2.5 py-1 text-xs font-semibold text-primary shadow">
                                {listingCount} {listingCount !== 1 ? t('universities.rooms') : t('universities.room')}
                              </span>
                            </div>
                          )}

                          <div className="absolute bottom-0 left-0 right-0 p-4">
                            <h3 className="font-display text-lg font-semibold leading-tight text-white sm:text-xl line-clamp-2">
                              {getUniversityDisplayName(uni)}
                            </h3>
                            <p className="mt-1 flex items-center gap-1 text-sm text-white/75">
                              <MapPin size={13} />
                              {uni.city}
                            </p>
                          </div>
                        </div>

                        <div className="p-4">
                          <p className="line-clamp-1 text-sm text-muted">
                            {(uni.nearby_areas || []).length > 0 ? (
                              <>
                                {t('listings.nearPrefix')} {uni.nearby_areas.slice(0, 3).join(' · ')}
                              </>
                            ) : (
                              t('universities.nearAreasLoading')
                            )}
                          </p>
                          <div className="mt-3 flex items-center justify-between">
                            <span className="text-sm font-semibold text-accent transition-transform group-hover:translate-x-1">
                              {t('universities.browseListings')}
                            </span>
                            <ArrowRight size={16} className="text-accent transition-transform group-hover:translate-x-1" />
                          </div>
                        </div>
                      </article>
                    </Link>
                  </motion.div>
                )
              })}

              <motion.div layout initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                <button type="button" onClick={() => setOtherOpen(true)} className="group h-full w-full text-left">
                  <article className="card-elevated flex h-full min-h-[200px] flex-col items-center justify-center border-2 border-dashed border-border p-6 text-center transition-colors hover:border-accent/50 hover:bg-accent/5 sm:min-h-[240px] sm:p-8">
                    <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl border border-dashed border-accent/40 bg-accent/10 transition-transform group-hover:scale-110">
                      <Plus className="h-6 w-6 text-accent" />
                    </div>
                    <h3 className="font-display text-lg font-semibold text-primary">{t('universities.otherUniversity')}</h3>
                    <p className="mt-2 max-w-[200px] text-sm text-muted">{t('universities.otherDesc')}</p>
                  </article>
                </button>
              </motion.div>
            </motion.div>
          </AnimatePresence>

          {filtered.length === 0 && (
            <Reveal className="py-8 text-center sm:py-12">
              <p className="text-lg font-medium text-primary">{t('universities.noMatch')}</p>
              <button
                onClick={() => { setSearch(''); setCity('All') }}
                className="mt-3 text-sm font-semibold text-accent hover:underline"
              >
                {t('universities.clearFilters')}
              </button>
            </Reveal>
          )}
        </div>
      </section>

      <OtherUniversityModal open={otherOpen} onClose={() => setOtherOpen(false)} />
    </>
  )
}
