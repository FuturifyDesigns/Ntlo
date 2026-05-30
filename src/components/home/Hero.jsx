import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import Button from '../ui/Button'
import { IconSearch } from '../ui/Icons'
import { RevealText, Reveal, AnimatedCounter } from '../ui/Motion'
import { useStats } from '../../hooks/useStats'
import { useTranslation } from '../../hooks/useTranslation'

const base = import.meta.env.BASE_URL

const HERO_PHOTOS = [
  { src: `${base}hero/room1.jpg`, alt: 'Bright student room', className: 'col-span-1 row-span-2' },
  { src: `${base}hero/room2.jpg`, alt: 'Modern apartment living room', className: 'col-span-1 row-span-1' },
  { src: `${base}hero/room3.jpg`, alt: 'Cozy bedroom', className: 'col-span-1 row-span-1' },
  { src: `${base}hero/room4.jpg`, alt: 'Student apartment interior', className: 'col-span-2 row-span-1' },
]

export default function Hero() {
  const navigate = useNavigate()
  const stats = useStats()
  const { t } = useTranslation()

  function handleSearch(e) {
    e.preventDefault()
    const q = e.target.search.value.trim()
    navigate(q ? `/listings?search=${encodeURIComponent(q)}` : '/listings')
  }

  return (
    <section className="relative overflow-hidden bg-primary px-4 py-8 sm:py-14 sm:px-6 lg:px-8 lg:py-16">
      <div className="absolute inset-0">
        <img src={`${base}hero/bg.jpg`} alt="" className="h-full w-full object-cover" />
        <div className="absolute inset-0 bg-primary/75 lg:bg-primary/65" />
        <div className="absolute inset-0 bg-gradient-to-r from-primary/90 via-primary/70 to-primary/40 lg:to-transparent" />
      </div>

      <div className="relative mx-auto max-w-6xl">
        <div className="grid items-center gap-6 lg:grid-cols-2 lg:gap-14">
          <div>
            <motion.h1
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="font-display text-[2.25rem] font-semibold leading-[1.05] tracking-tight text-white sm:text-5xl lg:text-[3.25rem]"
            >
              <RevealText text={t('hero.title1')} delay={0.1} />
              <span className="mt-1 block text-accent">
                <RevealText text={t('hero.title2')} delay={0.35} />
              </span>
            </motion.h1>

            <Reveal delay={0.5} y={20}>
              <p className="mt-6 max-w-md text-[1.05rem] leading-relaxed text-white/80">{t('hero.subtitle')}</p>
            </Reveal>

            <Reveal delay={0.6} y={20}>
              <form onSubmit={handleSearch} className="mt-9">
                <div className="flex flex-col gap-3 sm:flex-row">
                  <div className="relative flex-1">
                    <IconSearch className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted" />
                    <input
                      name="search"
                      type="search"
                      placeholder={t('hero.searchPlaceholder')}
                      className="w-full rounded-xl border-0 bg-white py-3.5 pl-12 pr-4 text-primary shadow-xl outline-none focus:ring-2 focus:ring-accent/50"
                    />
                  </div>
                  <Button type="submit" variant="accent" size="lg" className="shrink-0 shadow-lg shadow-accent/25">
                    {t('hero.search')}
                  </Button>
                </div>
              </form>
            </Reveal>

            <Reveal delay={0.7} y={16}>
              <div className="mt-6 flex flex-wrap gap-3">
                <Button
                  variant="outline"
                  className="border-white/20 bg-white/10 text-white hover:bg-white/15"
                  onClick={() => navigate('/listings')}
                >
                  {t('hero.browseListings')}
                </Button>
                <Button variant="accent" onClick={() => navigate('/universities')}>
                  {t('hero.viewUniversities')}
                </Button>
              </div>
            </Reveal>

            <Reveal delay={0.85} y={16}>
              <div className="mt-6 flex gap-5 border-t border-white/15 pt-6 sm:mt-8 sm:gap-8 sm:pt-8">
                {[
                  { value: stats.listings, label: t('hero.liveListings') },
                  { value: stats.universitiesWithListings || stats.universities, label: t('hero.campuses') },
                  { value: stats.verified, label: t('hero.verified') },
                ].map(({ value, label }) => (
                  <div key={label}>
                    <p className="font-display text-2xl font-semibold text-accent">
                      {stats.loading ? '—' : <AnimatedCounter value={value} />}
                    </p>
                    <p className="mt-0.5 text-xs uppercase tracking-wider text-white/50">{label}</p>
                  </div>
                ))}
              </div>
            </Reveal>
          </div>

          <div className="hidden sm:block">
            <Reveal delay={0.25} y={24}>
              <div className="grid h-[420px] grid-cols-2 grid-rows-3 gap-3 lg:h-[480px]">
                {HERO_PHOTOS.map((photo, i) => (
                  <motion.div
                    key={photo.src}
                    initial={{ opacity: 0, y: 24 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 + i * 0.1, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
                    className={`overflow-hidden rounded-2xl shadow-2xl ring-1 ring-white/20 ${photo.className}`}
                  >
                    <img
                      src={photo.src}
                      alt={photo.alt}
                      className="h-full w-full object-cover transition-transform duration-700 hover:scale-105"
                      loading="eager"
                    />
                  </motion.div>
                ))}
              </div>
            </Reveal>
          </div>

          <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide sm:hidden">
            {HERO_PHOTOS.map((photo) => (
              <div key={photo.src} className="h-40 w-56 shrink-0 overflow-hidden rounded-xl shadow-lg ring-1 ring-white/20">
                <img src={photo.src} alt={photo.alt} className="h-full w-full object-cover" loading="eager" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
