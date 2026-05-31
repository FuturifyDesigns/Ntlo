import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
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
import {
  PingScrollReveal,
  PingScrollStagger,
  PingScrollStaggerItem,
  PingScrollLines,
  PingHeroImage,
  PingFeatureImage,
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
      className={`inline-block transition-transform hover:scale-[1.02] active:scale-[0.98] ${className}`}
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
  const [activeFeature, setActiveFeature] = useState('stops')

  useEffect(() => {
    window.scrollTo(0, 0)
  }, [])

  const activeFeatureData = features.find((f) => f.key === activeFeature) || features[0]

  return (
    <div className="relative min-h-screen overflow-x-hidden bg-[#010104] text-white">
      <div className="pointer-events-none fixed inset-0 z-0">
        <PingStrandBackground />
        <div
          className="absolute inset-0"
          style={{
            background:
              'linear-gradient(180deg, rgba(1,1,4,0.55) 0%, rgba(1,1,4,0.75) 45%, rgba(0,0,0,0.92) 100%)',
          }}
          aria-hidden
        />
      </div>

      <div className="relative z-10">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-5 sm:px-6 lg:px-8">
          <Link
            to="/"
            className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-2 text-sm text-white/80 backdrop-blur-sm transition-colors hover:bg-white/10 hover:text-white"
          >
            <ArrowLeft size={16} />
            {t('ping.backToNtlo')}
          </Link>
          <p className="hidden text-xs font-medium uppercase tracking-[0.2em] text-sky-300/70 sm:block">
            {t('ping.collabBadge')}
          </p>
        </div>

        {/* Hero */}
        <section className="mx-auto max-w-6xl px-4 pb-14 pt-2 sm:px-6 sm:pb-20 sm:pt-4 lg:px-8">
          <div className="flex flex-col items-center text-center">
            <PingScrollReveal className="w-full max-w-3xl">
              <PingHeroImage
                src={HERO_BANNER}
                alt="Ping — Find your stop, faster"
                className="max-w-2xl drop-shadow-[0_20px_60px_rgba(37,99,235,0.25)]"
              />
            </PingScrollReveal>

            <PingScrollReveal delay={0.08} className="mt-8 max-w-2xl">
              <p className="text-base leading-relaxed text-white/70 sm:text-lg">{t('ping.heroSubtitle')}</p>
            </PingScrollReveal>

            <PingScrollReveal delay={0.12} className="mt-8 flex flex-col items-center gap-4">
              <GooglePlayBadge />
              <p className="text-sm text-white/45">{t('ping.freeOnAndroid')}</p>
            </PingScrollReveal>

            <PingScrollStagger className="mt-10 grid w-full max-w-4xl grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4" delay={0.1}>
              {[
                { icon: MapPin, label: t('ping.stats.stops') },
                { icon: Route, label: t('ping.stats.routes') },
                { icon: Navigation, label: t('ping.stats.directions') },
                { icon: Sparkles, label: t('ping.stats.community') },
              ].map(({ icon: Icon, label }) => (
                <PingScrollStaggerItem key={label}>
                  <div className="rounded-2xl border border-white/10 bg-white/[0.04] px-3 py-4 backdrop-blur-sm">
                    <Icon className="mx-auto text-sky-400" size={22} />
                    <p className="mt-2 text-center text-xs font-medium text-white/75 sm:text-sm">{label}</p>
                  </div>
                </PingScrollStaggerItem>
              ))}
            </PingScrollStagger>
          </div>
        </section>

        {/* Partnership */}
        <section className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8">
          <PingScrollReveal>
            <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-6 backdrop-blur-sm sm:p-10">
              <div className="flex flex-col items-center gap-6 text-center lg:flex-row lg:text-left">
                <div className="flex shrink-0 items-center gap-4">
                  <img src={NTLO_LOGO} alt="Ntlo" className="h-14 w-auto object-contain brightness-0 invert sm:h-16" />
                  <Handshake className="text-sky-400/80" size={28} />
                  <img src={PING_ICON} alt="Ping" className="ping-img-blend h-14 w-14 rounded-2xl object-contain sm:h-16 sm:w-16" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-sky-400/90">
                    {t('ping.partnership.eyebrow')}
                  </p>
                  <h2 className="mt-2 font-display text-2xl font-bold sm:text-3xl">{t('ping.partnership.title')}</h2>
                  <p className="mt-3 text-base leading-relaxed text-white/65">{t('ping.partnership.body')}</p>
                </div>
              </div>

              <div className="mt-8 grid gap-4 sm:grid-cols-3">
                {[
                  { icon: Home, title: t('ping.partnership.benefits.home.title'), body: t('ping.partnership.benefits.home.body') },
                  { icon: Bus, title: t('ping.partnership.benefits.commute.title'), body: t('ping.partnership.benefits.commute.body') },
                  { icon: GraduationCap, title: t('ping.partnership.benefits.campus.title'), body: t('ping.partnership.benefits.campus.body') },
                ].map(({ icon: Icon, title, body }) => (
                  <div key={title} className="rounded-2xl border border-white/8 bg-black/30 p-5">
                    <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-sky-400/15 text-sky-300">
                      <Icon size={20} />
                    </span>
                    <h3 className="mt-3 font-semibold text-white">{title}</h3>
                    <p className="mt-2 text-sm leading-relaxed text-white/55">{body}</p>
                  </div>
                ))}
              </div>
            </div>
          </PingScrollReveal>
        </section>

        {/* Feature explorer */}
        <section className="mx-auto max-w-6xl px-4 pb-20 pt-4 sm:px-6 lg:px-8">
          <PingScrollReveal className="mb-10 text-center">
            <h2 className="font-display text-2xl font-bold sm:text-3xl">{t('ping.exploreTitle')}</h2>
            <p className="mt-2 text-white/55">{t('ping.exploreSubtitle')}</p>
          </PingScrollReveal>

          <PingScrollReveal delay={0.05}>
            <div className="mb-8 flex flex-wrap justify-center gap-2">
              {features.map(({ key, icon: Icon }) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setActiveFeature(key)}
                  className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-medium transition-colors ${
                    activeFeature === key
                      ? 'border-sky-400/50 bg-sky-400/15 text-sky-200'
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
              initial={prefs.reduceMotion ? false : { opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={prefs.reduceMotion ? undefined : { opacity: 0, y: -8 }}
              transition={{ duration: 0.25 }}
              className="overflow-hidden rounded-3xl border border-white/10 bg-white/[0.02] p-6 lg:p-10"
            >
              <div className="grid items-center gap-8 lg:grid-cols-2 lg:gap-10">
                <div>
                  <span className="inline-flex items-center gap-2 rounded-full border border-sky-400/20 bg-sky-400/10 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-sky-300">
                    {(() => {
                      const Icon = activeFeatureData.icon
                      return <Icon size={14} />
                    })()}
                    {t(`ping.features.${activeFeature}.eyebrow`)}
                  </span>
                  <h3 className="mt-4 font-display text-2xl font-bold sm:text-3xl">
                    {t(`ping.features.${activeFeature}.title`)}
                  </h3>
                  <p className="mt-4 text-base leading-relaxed text-white/65 sm:text-lg">
                    {t(`ping.features.${activeFeature}.body`)}
                  </p>
                  <a
                    href={PLAY_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-6 inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-sky-500 to-blue-600 px-5 py-2.5 text-sm font-semibold text-white transition-transform hover:scale-[1.02] active:scale-[0.98]"
                  >
                    {t('ping.tryPing')}
                    <ArrowRight size={16} />
                  </a>
                </div>
                <PingFeatureImage src={activeFeatureData.image} />
              </div>
            </motion.div>
          </AnimatePresence>
        </section>

        {/* Feature rows */}
        <section className="mx-auto max-w-6xl space-y-20 px-4 pb-24 sm:px-6 lg:px-8">
          {features.map(({ key, icon: Icon, image }, index) => (
            <article
              key={key}
              className={`grid items-center gap-8 lg:grid-cols-2 lg:gap-12 ${
                index % 2 === 1 ? 'lg:[&>*:first-child]:order-2' : ''
              }`}
            >
              <PingScrollReveal delay={index * 0.03}>
                <span className="inline-flex items-center gap-2 rounded-full border border-sky-400/20 bg-sky-400/10 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-sky-300">
                  <Icon size={14} />
                  {t(`ping.features.${key}.eyebrow`)}
                </span>
                <h2 className="mt-4 font-display text-2xl font-bold sm:text-3xl lg:text-4xl">
                  {t(`ping.features.${key}.title`)}
                </h2>
                <p className="mt-4 text-base leading-relaxed text-white/65 sm:text-lg">
                  {t(`ping.features.${key}.body`)}
                </p>
              </PingScrollReveal>
              <PingScrollReveal delay={0.05 + index * 0.03}>
                <PingFeatureImage src={image} />
              </PingScrollReveal>
            </article>
          ))}
        </section>

        <section className="border-t border-white/10 px-4 py-16 sm:px-6 lg:px-8">
          <PingScrollReveal className="mx-auto max-w-3xl text-center">
            <p className="text-xs font-semibold uppercase tracking-[0.25em] text-sky-400/80">
              {t('ping.cta.eyebrow')}
            </p>
            <h2 className="mt-3 font-display text-3xl font-bold sm:text-4xl">{t('ping.cta.title')}</h2>
            <p className="mt-4 text-lg text-white/65">{t('ping.cta.body')}</p>
            <div className="mt-8 flex flex-col items-center gap-3">
              <GooglePlayBadge />
              <p className="text-sm text-white/40">{t('ping.cta.footer')}</p>
            </div>
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
