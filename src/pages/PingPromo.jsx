import { useEffect, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { motion, AnimatePresence, useScroll, useTransform } from 'framer-motion'
import {
  ArrowLeft,
  ArrowRight,
  Bus,
  GraduationCap,
  Home,
  MapPin,
  Route,
  Trophy,
  Users,
  Navigation,
  Sparkles,
  Handshake,
} from 'lucide-react'
import PingStrandBackground from '../components/ping/PingStrandBackground'
import PingSectionAura from '../components/ping/PingSectionAura'
import {
  PingScrollReveal,
  PingScrollStagger,
  PingScrollStaggerItem,
  PingScrollMedia,
  PingScrollLines,
} from '../components/ping/PingScrollReveal'
import { PLAY_URL, PING_ICON } from '../components/ping/PingNavButton'
import { useTranslation } from '../hooks/useTranslation'
import { useLocale } from '../context/LocaleContext'

const BASE = import.meta.env.BASE_URL
const NTLO_LOGO = `${BASE}logo-brand.png`
const HERO_BANNER = `${BASE}ping/hero-banner.png`

const features = [
  { key: 'stops', icon: MapPin, image: `${BASE}ping/feature-stops.png` },
  { key: 'routes', icon: Route, image: `${BASE}ping/feature-routes.png` },
  { key: 'details', icon: Bus, image: `${BASE}ping/feature-details.png` },
  { key: 'community', icon: Users, image: `${BASE}ping/feature-community.png` },
  { key: 'karma', icon: Trophy, image: `${BASE}ping/feature-karma.png` },
]

function GooglePlayBadge({ className = '' }) {
  return (
    <a
      href={PLAY_URL}
      target="_blank"
      rel="noopener noreferrer"
      className={`inline-block transition-transform hover:scale-[1.04] active:scale-[0.98] ${className}`}
    >
      <img
        src="https://play.google.com/intl/en_us/badges/static/images/badges/en_badge_web_generic.png"
        alt="Get it on Google Play"
        className="h-14 w-auto sm:h-16"
        loading="lazy"
      />
    </a>
  )
}

export default function PingPromo() {
  const { t } = useTranslation()
  const { prefs } = useLocale()
  const location = useLocation()
  const shouldReveal = location.state?.pingReveal && !prefs.reduceMotion
  const [activeFeature, setActiveFeature] = useState('stops')
  const [hoverStat, setHoverStat] = useState(null)

  const { scrollYProgress } = useScroll()
  const heroY = useTransform(scrollYProgress, [0, 0.35], [0, -80])
  const heroOpacity = useTransform(scrollYProgress, [0, 0.28], [1, 0.55])
  const heroScale = useTransform(scrollYProgress, [0, 0.35], [1, 0.94])

  useEffect(() => {
    window.scrollTo(0, 0)
  }, [])

  const hoverMotion = prefs.reduceMotion
    ? {}
    : { whileHover: { y: -4, scale: 1.02 }, transition: { type: 'spring', stiffness: 400, damping: 24 } }

  const activeFeatureData = features.find((f) => f.key === activeFeature) || features[0]

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#010104] text-white">
      <PingAuroraLayer scrollYProgress={scrollYProgress} />

      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            'radial-gradient(ellipse 80% 50% at 50% -10%, rgba(15, 23, 42, 0.85) 0%, transparent 55%), linear-gradient(180deg, #010104 0%, #020617 40%, #000000 100%)',
        }}
        aria-hidden
      />

      <div className="relative z-10">
        <PingScrollReveal y={24} delay={0.1} amount={0.9}>
          <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-5 sm:px-6 lg:px-8">
            <Link
              to="/"
              className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-2 text-sm text-white/80 backdrop-blur-sm transition-all hover:border-white/20 hover:bg-white/10 hover:text-white"
            >
              <ArrowLeft size={16} />
              {t('ping.backToNtlo')}
            </Link>
            <p className="hidden text-xs font-medium uppercase tracking-[0.2em] text-sky-300/70 sm:block">
              {t('ping.collabBadge')}
            </p>
          </div>
        </PingScrollReveal>

        {/* Hero */}
        <section className="relative mx-auto max-w-6xl px-4 pb-16 pt-2 sm:px-6 sm:pb-24 sm:pt-6 lg:px-8">
          <motion.div
            className="relative flex flex-col items-center text-center"
            style={prefs.reduceMotion ? undefined : { y: heroY, opacity: heroOpacity, scale: heroScale }}
          >
            <PingScrollMedia className="w-full max-w-3xl" delay={shouldReveal ? 0.05 : 0}>
              <img
                src={HERO_BANNER}
                alt="Ping — Find your stop, faster"
                className="mx-auto w-full drop-shadow-[0_24px_80px_rgba(37,99,235,0.4)]"
              />
            </PingScrollMedia>

            <PingScrollReveal delay={0.15} y={56} className="mt-8 max-w-2xl">
              <p className="text-base leading-relaxed text-white/65 sm:text-lg">{t('ping.heroSubtitle')}</p>
            </PingScrollReveal>

            <PingScrollReveal delay={0.25} y={40} className="mt-8 flex flex-col items-center gap-4">
              <GooglePlayBadge />
              <p className="text-sm text-white/45">{t('ping.freeOnAndroid')}</p>
            </PingScrollReveal>

            <PingScrollStagger className="mt-12 grid w-full max-w-4xl grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4" stagger={0.08} delay={0.2}>
              {[
                { id: 'stops', icon: MapPin, label: t('ping.stats.stops') },
                { id: 'routes', icon: Route, label: t('ping.stats.routes') },
                { id: 'directions', icon: Navigation, label: t('ping.stats.directions') },
                { id: 'community', icon: Sparkles, label: t('ping.stats.community') },
              ].map(({ id, icon: Icon, label }) => (
                <PingScrollStaggerItem key={id}>
                  <motion.button
                    type="button"
                    onMouseEnter={() => setHoverStat(id)}
                    onMouseLeave={() => setHoverStat(null)}
                    className={`relative w-full overflow-hidden rounded-2xl border px-3 py-4 backdrop-blur-sm transition-colors ${
                      hoverStat === id
                        ? 'border-sky-400/40 bg-sky-400/10'
                        : 'border-white/10 bg-white/[0.04]'
                    }`}
                    {...hoverMotion}
                  >
                    <Icon className="relative mx-auto text-sky-400" size={22} />
                    <p className="relative mt-2 text-center text-xs font-medium text-white/75 sm:text-sm">{label}</p>
                  </motion.button>
                </PingScrollStaggerItem>
              ))}
            </PingScrollStagger>
          </motion.div>
        </section>

        {/* Partnership */}
        <section className="relative mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:px-8">
          <PingSectionAura variant="violet" />
          <PingScrollReveal y={80}>
            <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-white/[0.03] p-6 backdrop-blur-md sm:p-10">
              <div className="flex flex-col items-center gap-6 text-center lg:flex-row lg:text-left">
                <PingScrollMedia delay={0.1} className="flex shrink-0 items-center gap-4">
                  <img src={NTLO_LOGO} alt="Ntlo" className="h-14 w-auto object-contain brightness-0 invert sm:h-16" />
                  <Handshake className="text-sky-400/80" size={28} />
                  <img src={PING_ICON} alt="Ping" className="h-14 w-14 rounded-2xl object-cover sm:h-16 sm:w-16" />
                </PingScrollMedia>
                <div className="min-w-0 flex-1">
                  <PingScrollLines
                    lines={[t('ping.partnership.eyebrow')]}
                    lineClassName="text-xs font-semibold uppercase tracking-[0.2em] text-sky-400/90"
                  />
                  <PingScrollLines
                    lines={[t('ping.partnership.title')]}
                    lineClassName="mt-2 font-display text-2xl font-bold sm:text-3xl"
                  />
                  <PingScrollReveal delay={0.15} y={32} className="mt-3">
                    <p className="text-base leading-relaxed text-white/65">{t('ping.partnership.body')}</p>
                  </PingScrollReveal>
                </div>
              </div>

              <PingScrollStagger className="mt-10 grid gap-4 sm:grid-cols-3" stagger={0.12} delay={0.1}>
                {[
                  { icon: Home, title: t('ping.partnership.benefits.home.title'), body: t('ping.partnership.benefits.home.body') },
                  { icon: Bus, title: t('ping.partnership.benefits.commute.title'), body: t('ping.partnership.benefits.commute.body') },
                  { icon: GraduationCap, title: t('ping.partnership.benefits.campus.title'), body: t('ping.partnership.benefits.campus.body') },
                ].map(({ icon: Icon, title, body }) => (
                  <PingScrollStaggerItem key={title} y={56}>
                    <motion.div
                      className="h-full rounded-2xl border border-white/8 bg-black/30 p-5"
                      {...hoverMotion}
                    >
                      <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-sky-400/15 text-sky-300">
                        <Icon size={20} />
                      </span>
                      <h3 className="mt-3 font-semibold text-white">{title}</h3>
                      <p className="mt-2 text-sm leading-relaxed text-white/55">{body}</p>
                    </motion.div>
                  </PingScrollStaggerItem>
                ))}
              </PingScrollStagger>
            </div>
          </PingScrollReveal>
        </section>

        {/* Interactive explorer */}
        <section className="relative mx-auto max-w-6xl px-4 pb-24 pt-8 sm:px-6 lg:px-8">
          <PingScrollReveal className="relative mb-12 text-center" y={64}>
            <PingScrollLines
              lines={[t('ping.exploreTitle')]}
              lineClassName="font-display text-2xl font-bold sm:text-3xl"
            />
            <PingScrollReveal delay={0.12} y={28} className="mt-3">
              <p className="text-white/55">{t('ping.exploreSubtitle')}</p>
            </PingScrollReveal>
          </PingScrollReveal>

          <PingScrollReveal delay={0.08} y={40}>
            <div className="relative mb-10 flex flex-wrap justify-center gap-2">
              {features.map(({ key, icon: Icon }) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setActiveFeature(key)}
                  className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-medium transition-all ${
                    activeFeature === key
                      ? 'border-sky-400/50 bg-sky-400/15 text-sky-200 shadow-[0_0_24px_rgba(56,189,248,0.2)]'
                      : 'border-white/10 bg-white/5 text-white/60 hover:border-white/20 hover:text-white'
                  }`}
                >
                  <Icon size={16} />
                  {t(`ping.features.${key}.eyebrow`)}
                </button>
              ))}
            </div>
          </PingScrollReveal>

          <AnimatePresence mode="wait">
            <motion.div
              key={activeFeature}
              initial={{ opacity: 0, y: 24, filter: 'blur(6px)' }}
              animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
              exit={{ opacity: 0, y: -16, filter: 'blur(4px)' }}
              transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
              className="relative overflow-hidden rounded-3xl border border-white/10 bg-white/[0.03] backdrop-blur-sm"
            >
              <PingSectionAura className="opacity-70" />
              <div className="relative grid items-center gap-8 p-6 lg:grid-cols-2 lg:gap-10 lg:p-10">
                <PingScrollReveal y={48} delay={0.05}>
                  <span className="inline-flex items-center gap-2 rounded-full border border-sky-400/20 bg-sky-400/10 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-sky-300">
                    {(() => {
                      const Icon = activeFeatureData.icon
                      return <Icon size={14} />
                    })()}
                    {t(`ping.features.${activeFeature}.eyebrow`)}
                  </span>
                  <h3 className="mt-4 font-display text-2xl font-bold sm:text-3xl lg:text-4xl">
                    {t(`ping.features.${activeFeature}.title`)}
                  </h3>
                  <p className="mt-4 text-base leading-relaxed text-white/65 sm:text-lg">
                    {t(`ping.features.${activeFeature}.body`)}
                  </p>
                  <a
                    href={PLAY_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-6 inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-sky-500 to-blue-600 px-5 py-2.5 text-sm font-semibold text-white shadow-[0_8px_32px_rgba(37,99,235,0.35)] transition-transform hover:scale-[1.03] active:scale-[0.98]"
                  >
                    {t('ping.tryPing')}
                    <ArrowRight size={16} />
                  </a>
                </PingScrollReveal>
                <PingScrollMedia delay={0.12}>
                  <div className="overflow-hidden rounded-2xl border border-white/10 shadow-[0_24px_80px_rgba(37,99,235,0.2)]">
                    <img src={activeFeatureData.image} alt="" className="w-full object-cover" loading="lazy" />
                  </div>
                </PingScrollMedia>
              </div>
            </motion.div>
          </AnimatePresence>
        </section>

        {/* Feature scroll sections */}
        <section className="mx-auto max-w-6xl space-y-28 px-4 pb-28 sm:px-6 lg:px-8">
          {features.map(({ key, icon: Icon, image }, index) => (
            <article
              key={key}
              className={`relative grid items-center gap-10 lg:grid-cols-2 lg:gap-16 ${
                index % 2 === 1 ? 'lg:[&>*:first-child]:order-2' : ''
              }`}
            >
              <PingSectionAura variant={index % 2 ? 'violet' : 'blue'} />
              <PingScrollReveal y={72} delay={index * 0.04} className="relative">
                <span className="inline-flex items-center gap-2 rounded-full border border-sky-400/20 bg-sky-400/10 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-sky-300">
                  <Icon size={14} />
                  {t(`ping.features.${key}.eyebrow`)}
                </span>
                <PingScrollLines
                  lines={[t(`ping.features.${key}.title`)]}
                  lineClassName="mt-4 font-display text-2xl font-bold sm:text-3xl lg:text-4xl"
                />
                <PingScrollReveal delay={0.14} y={36} className="mt-4">
                  <p className="text-base leading-relaxed text-white/65 sm:text-lg">
                    {t(`ping.features.${key}.body`)}
                  </p>
                </PingScrollReveal>
              </PingScrollReveal>
              <PingScrollMedia delay={0.08 + index * 0.05}>
                <motion.div
                  className="relative overflow-hidden rounded-2xl border border-white/10 bg-white/5 shadow-[0_24px_80px_rgba(37,99,235,0.15)]"
                  {...hoverMotion}
                >
                  <img src={image} alt="" className="w-full object-cover" loading="lazy" />
                </motion.div>
              </PingScrollMedia>
            </article>
          ))}
        </section>

        <section className="relative border-t border-white/10 bg-black/40 px-4 py-20 sm:px-6 lg:px-8">
          <PingSectionAura className="opacity-50" />
          <PingScrollReveal y={64} className="relative mx-auto max-w-3xl text-center">
            <p className="text-xs font-semibold uppercase tracking-[0.25em] text-sky-400/80">
              {t('ping.cta.eyebrow')}
            </p>
            <PingScrollLines
              lines={[t('ping.cta.title')]}
              lineClassName="mt-3 font-display text-3xl font-bold sm:text-4xl"
            />
            <PingScrollReveal delay={0.15} y={32} className="mt-4">
              <p className="text-lg text-white/65">{t('ping.cta.body')}</p>
            </PingScrollReveal>
            <PingScrollReveal delay={0.25} y={28} className="mt-8 flex flex-col items-center gap-3">
              <GooglePlayBadge />
              <p className="text-sm text-white/40">{t('ping.cta.footer')}</p>
            </PingScrollReveal>
          </PingScrollReveal>
        </section>

        <footer className="border-t border-white/5 px-4 py-8 text-center text-xs text-white/35">
          <p>{t('ping.builtBy')}</p>
          <p className="mt-1">v1.0.0</p>
        </footer>
      </div>
    </div>
  )
}

/** Scroll-linked aurora parallax layer */
function PingAuroraLayer({ scrollYProgress }) {
  const y = useTransform(scrollYProgress, [0, 1], ['0%', '22%'])
  const scale = useTransform(scrollYProgress, [0, 1], [1, 1.08])
  const opacity = useTransform(scrollYProgress, [0, 0.6, 1], [1, 0.9, 0.75])

  return (
    <motion.div
      className="pointer-events-none fixed inset-0 z-0 will-change-transform"
      style={{ y, scale, opacity, transformOrigin: 'center top' }}
    >
      <PingStrandBackground />
    </motion.div>
  )
}
