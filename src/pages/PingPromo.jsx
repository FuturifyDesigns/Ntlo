import { useEffect } from 'react'
import { Link } from 'react-router-dom'
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
  Handshake,
  Globe,
} from 'lucide-react'
import PingStrandBackground from '../components/ping/PingStrandBackground'
import {
  PingScrollReveal,
  PingScrollStagger,
  PingScrollStaggerItem,
  PingFeatureImage,
} from '../components/ping/PingScrollReveal'
import { PLAY_URL } from '../components/ping/PingNavButton'
import PingIcon from '../components/ping/PingIcon'
import PingCollabMark from '../components/ping/PingCollabMark'
import { useTranslation } from '../hooks/useTranslation'

const BASE = import.meta.env.BASE_URL
const NTLO_ICON = `${BASE}ntlo-icon.png`

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
        className="h-12 w-auto sm:h-14 md:h-16"
        loading="lazy"
      />
    </a>
  )
}

export default function PingPromo() {
  const { t } = useTranslation()

  useEffect(() => {
    window.scrollTo(0, 0)
  }, [])

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
        <div className="mx-auto flex max-w-6xl flex-col items-stretch gap-3 px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-6 sm:py-4 lg:px-8">
          <Link
            to="/"
            className="inline-flex w-fit items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-white/80 backdrop-blur-sm transition-colors hover:bg-white/10 hover:text-white sm:gap-2 sm:py-2 sm:text-sm"
          >
            <ArrowLeft size={15} className="shrink-0 sm:h-4 sm:w-4" />
            <span className="truncate">{t('ping.backToNtlo')}</span>
          </Link>
          <PingCollabMark size="sm" className="justify-center sm:justify-end" />
        </div>

        {/* Hero */}
        <section className="mx-auto max-w-6xl px-4 pb-8 pt-1 sm:px-6 sm:pb-12 sm:pt-2 lg:px-8 lg:pb-16">
          <div className="flex flex-col items-center text-center">
            <PingScrollReveal className="flex flex-col items-center">
              <PingIcon size="hero" glow />
              <h1 className="mt-3 font-display text-4xl font-bold tracking-tight sm:mt-4 sm:text-5xl md:text-6xl">
                Ping
              </h1>
              <p className="mt-1.5 text-lg font-medium sm:mt-2 sm:text-xl md:text-2xl">
                {t('ping.tagline')}{' '}
                <span className="text-sky-400">{t('ping.taglineHighlight')}</span>
              </p>
            </PingScrollReveal>

            <PingScrollReveal delay={0.08} className="mt-4 max-w-2xl sm:mt-6">
              <p className="text-sm leading-relaxed text-white/70 sm:text-base md:text-lg">
                {t('ping.heroSubtitle')}
              </p>
            </PingScrollReveal>

            <PingScrollReveal delay={0.12} className="mt-5 flex flex-col items-center gap-2 sm:mt-6 sm:gap-3">
              <GooglePlayBadge />
              <p className="text-xs text-white/45 sm:text-sm">{t('ping.freeOnAndroid')}</p>
            </PingScrollReveal>

            <PingScrollStagger
              className="mt-6 grid w-full max-w-4xl grid-cols-2 gap-2 sm:mt-8 sm:grid-cols-4 sm:gap-3 md:gap-4"
              delay={0.1}
            >
              {[
                { icon: MapPin, label: t('ping.stats.stops') },
                { icon: Route, label: t('ping.stats.routes') },
                { icon: Navigation, label: t('ping.stats.directions') },
                { icon: Globe, label: t('ping.stats.community') },
              ].map(({ icon: Icon, label }) => (
                <PingScrollStaggerItem key={label}>
                  <div className="rounded-xl border border-white/10 bg-white/[0.04] px-2 py-3 backdrop-blur-sm sm:rounded-2xl sm:px-3 sm:py-4">
                    <Icon className="mx-auto text-sky-400" size={20} />
                    <p className="mt-1.5 text-center text-[11px] font-medium leading-tight text-white/75 sm:mt-2 sm:text-xs md:text-sm">
                      {label}
                    </p>
                  </div>
                </PingScrollStaggerItem>
              ))}
            </PingScrollStagger>
          </div>
        </section>

        {/* Partnership */}
        <section className="mx-auto max-w-6xl px-4 py-6 sm:px-6 sm:py-8 lg:px-8 lg:py-10">
          <PingScrollReveal>
            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 backdrop-blur-sm sm:rounded-3xl sm:p-6 md:p-8 lg:p-10">
              <div className="flex flex-col items-center gap-4 text-center sm:gap-5 lg:flex-row lg:gap-6 lg:text-left">
                <div className="flex shrink-0 items-center gap-2.5 sm:gap-4">
                  <img
                    src={NTLO_ICON}
                    alt="Ntlo"
                    className="h-11 w-11 rounded-lg object-contain shadow-[0_4px_16px_rgba(0,0,0,0.35)] sm:h-14 sm:w-14 sm:rounded-xl md:h-16 md:w-16"
                  />
                  <Handshake className="text-sky-400/80" size={22} />
                  <PingIcon size="lg" glow />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-sky-400/90 sm:text-xs sm:tracking-[0.2em]">
                    {t('ping.partnership.eyebrow')}
                  </p>
                  <h2 className="mt-1.5 font-display text-xl font-bold sm:mt-2 sm:text-2xl md:text-3xl">
                    {t('ping.partnership.title')}
                  </h2>
                  <p className="mt-2 text-sm leading-relaxed text-white/65 sm:mt-3 sm:text-base">
                    {t('ping.partnership.body')}
                  </p>
                </div>
              </div>

              <div className="mt-5 grid gap-3 sm:mt-6 sm:grid-cols-3 sm:gap-4">
                {[
                  { icon: Home, title: t('ping.partnership.benefits.home.title'), body: t('ping.partnership.benefits.home.body') },
                  { icon: Bus, title: t('ping.partnership.benefits.commute.title'), body: t('ping.partnership.benefits.commute.body') },
                  { icon: GraduationCap, title: t('ping.partnership.benefits.campus.title'), body: t('ping.partnership.benefits.campus.body') },
                ].map(({ icon: Icon, title, body }) => (
                  <div key={title} className="rounded-xl border border-white/8 bg-black/30 p-4 sm:rounded-2xl sm:p-5">
                    <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-sky-400/15 text-sky-300 sm:h-10 sm:w-10 sm:rounded-xl">
                      <Icon size={18} />
                    </span>
                    <h3 className="mt-2.5 text-sm font-semibold text-white sm:mt-3 sm:text-base">{title}</h3>
                    <p className="mt-1.5 text-xs leading-relaxed text-white/55 sm:mt-2 sm:text-sm">{body}</p>
                  </div>
                ))}
              </div>
            </div>
          </PingScrollReveal>
        </section>

        {/* Features — scroll reveal with screenshots */}
        <section className="mx-auto max-w-6xl px-4 pb-12 pt-2 sm:px-6 sm:pb-16 lg:px-8 lg:pb-20">
          <PingScrollReveal className="mb-8 text-center sm:mb-10 md:mb-12">
            <h2 className="font-display text-xl font-bold sm:text-2xl md:text-3xl">{t('ping.exploreTitle')}</h2>
            <p className="mt-1.5 text-sm text-white/55 sm:mt-2 sm:text-base">{t('ping.exploreSubtitle')}</p>
          </PingScrollReveal>

          <div className="space-y-10 sm:space-y-14 md:space-y-16 lg:space-y-20">
            {features.map(({ key, icon: Icon, image }, index) => (
              <article
                key={key}
                className={`grid items-center gap-5 sm:gap-6 md:gap-8 lg:grid-cols-2 lg:gap-10 ${
                  index % 2 === 1 ? 'lg:[&>*:first-child]:order-2' : ''
                }`}
              >
                <PingScrollReveal delay={index * 0.04}>
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-sky-400/20 bg-sky-400/10 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-sky-300 sm:gap-2 sm:px-3 sm:py-1 sm:text-xs">
                    <Icon size={13} />
                    {t(`ping.features.${key}.eyebrow`)}
                  </span>
                  <h3 className="mt-3 font-display text-xl font-bold sm:mt-4 sm:text-2xl md:text-3xl lg:text-4xl">
                    {t(`ping.features.${key}.title`)}
                  </h3>
                  <p className="mt-2.5 text-sm leading-relaxed text-white/65 sm:mt-3 sm:text-base md:text-lg">
                    {t(`ping.features.${key}.body`)}
                  </p>
                  <a
                    href={PLAY_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-4 inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-sky-500 to-blue-600 px-4 py-2 text-xs font-semibold text-white transition-transform hover:scale-[1.02] active:scale-[0.98] sm:mt-5 sm:px-5 sm:py-2.5 sm:text-sm"
                  >
                    {t('ping.tryPing')}
                    <ArrowRight size={15} />
                  </a>
                </PingScrollReveal>

                <PingScrollReveal delay={0.06 + index * 0.04}>
                  <PingFeatureImage src={image} alt={t(`ping.features.${key}.title`)} />
                </PingScrollReveal>
              </article>
            ))}
          </div>
        </section>

        <section className="border-t border-white/10 px-4 py-10 sm:px-6 sm:py-12 md:py-14 lg:px-8">
          <PingScrollReveal className="mx-auto max-w-3xl text-center">
            <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-sky-400/80 sm:text-xs sm:tracking-[0.25em]">
              {t('ping.cta.eyebrow')}
            </p>
            <h2 className="mt-2 font-display text-2xl font-bold sm:mt-3 sm:text-3xl md:text-4xl">
              {t('ping.cta.title')}
            </h2>
            <p className="mt-3 text-sm text-white/65 sm:mt-4 sm:text-base md:text-lg">{t('ping.cta.body')}</p>
            <div className="mt-5 flex flex-col items-center gap-2 sm:mt-6 sm:gap-3">
              <GooglePlayBadge />
              <p className="text-xs text-white/40 sm:text-sm">{t('ping.cta.footer')}</p>
            </div>
          </PingScrollReveal>
        </section>

        <footer className="border-t border-white/5 px-4 py-5 text-center text-[11px] text-white/35 sm:py-6 sm:text-xs">
          <p>{t('ping.builtBy')}</p>
          <p className="mt-0.5">v1.0.0</p>
        </footer>
      </div>
    </div>
  )
}
