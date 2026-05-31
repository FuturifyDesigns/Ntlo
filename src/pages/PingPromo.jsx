import { useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowLeft, Bus, MapPin, Route, Trophy, Users, Navigation, Sparkles } from 'lucide-react'
import PingStrandBackground from '../components/ping/PingStrandBackground'
import { PLAY_URL } from '../components/ping/PingNavButton'
import { useTranslation } from '../hooks/useTranslation'
import { useLocale } from '../context/LocaleContext'

const BASE = import.meta.env.BASE_URL

const reveal = {
  hidden: { opacity: 0, y: 28 },
  show: (i) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.7, delay: 0.12 + i * 0.08, ease: [0.22, 1, 0.36, 1] },
  }),
}

const features = [
  {
    key: 'stops',
    icon: MapPin,
    image: `${BASE}ping/feature-stops.png`,
  },
  {
    key: 'routes',
    icon: Route,
    image: `${BASE}ping/feature-routes.png`,
  },
  {
    key: 'details',
    icon: Bus,
    image: `${BASE}ping/feature-details.png`,
  },
  {
    key: 'community',
    icon: Users,
    image: `${BASE}ping/feature-community.png`,
  },
  {
    key: 'karma',
    icon: Trophy,
    image: `${BASE}ping/feature-karma.png`,
  },
]

function GooglePlayBadge({ className = '' }) {
  return (
    <a
      href={PLAY_URL}
      target="_blank"
      rel="noopener noreferrer"
      className={`inline-block transition-transform hover:scale-[1.03] active:scale-[0.98] ${className}`}
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

  useEffect(() => {
    window.scrollTo(0, 0)
  }, [])

  const motionProps = shouldReveal
    ? { initial: 'hidden', animate: 'show' }
    : { initial: false, animate: 'show' }

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#030308] text-white">
      <PingStrandBackground />

      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            'radial-gradient(ellipse 90% 60% at 50% 0%, rgba(15, 23, 42, 0.9) 0%, transparent 60%), linear-gradient(180deg, #030308 0%, #020617 45%, #000000 100%)',
        }}
        aria-hidden
      />

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

        <section className="mx-auto max-w-6xl px-4 pb-16 pt-6 sm:px-6 sm:pb-24 sm:pt-10 lg:px-8">
          <motion.div
            className="flex flex-col items-center text-center"
            variants={{ show: { transition: { staggerChildren: 0.08 } } }}
            {...motionProps}
          >
            <motion.div custom={0} variants={reveal} className="w-full max-w-3xl">
              <img
                src={`${BASE}ping/hero-logo.png`}
                alt="Ping — Find your stop, faster"
                className="mx-auto w-full max-w-2xl drop-shadow-[0_20px_60px_rgba(37,99,235,0.35)]"
              />
            </motion.div>

            <motion.p
              custom={1}
              variants={reveal}
              className="mt-6 max-w-2xl text-lg text-white/70 sm:text-xl"
            >
              {t('ping.heroSubtitle')}
            </motion.p>

            <motion.div custom={2} variants={reveal} className="mt-8 flex flex-col items-center gap-4">
              <GooglePlayBadge />
              <p className="text-sm text-white/45">{t('ping.freeOnAndroid')}</p>
            </motion.div>

            <motion.div
              custom={3}
              variants={reveal}
              className="mt-10 grid w-full max-w-4xl grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4"
            >
              {[
                { icon: MapPin, label: t('ping.stats.stops') },
                { icon: Route, label: t('ping.stats.routes') },
                { icon: Navigation, label: t('ping.stats.directions') },
                { icon: Sparkles, label: t('ping.stats.community') },
              ].map(({ icon: Icon, label }) => (
                <div
                  key={label}
                  className="rounded-2xl border border-white/10 bg-white/[0.04] px-3 py-4 backdrop-blur-sm"
                >
                  <Icon className="mx-auto text-sky-400" size={22} />
                  <p className="mt-2 text-xs font-medium text-white/75 sm:text-sm">{label}</p>
                </div>
              ))}
            </motion.div>
          </motion.div>
        </section>

        <section className="mx-auto max-w-6xl space-y-20 px-4 pb-20 sm:px-6 lg:px-8">
          {features.map(({ key, icon: Icon, image }, index) => (
            <motion.article
              key={key}
              initial={shouldReveal ? { opacity: 0, y: 40 } : false}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-80px' }}
              transition={{ duration: 0.65, delay: index * 0.05, ease: [0.22, 1, 0.36, 1] }}
              className={`grid items-center gap-8 lg:grid-cols-2 lg:gap-12 ${
                index % 2 === 1 ? 'lg:[&>*:first-child]:order-2' : ''
              }`}
            >
              <div>
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
              </div>
              <div className="overflow-hidden rounded-2xl border border-white/10 bg-white/5 shadow-[0_24px_80px_rgba(37,99,235,0.15)]">
                <img src={image} alt="" className="w-full object-cover" loading="lazy" />
              </div>
            </motion.article>
          ))}
        </section>

        <section className="border-t border-white/10 bg-black/40 px-4 py-16 sm:px-6 lg:px-8">
          <motion.div
            initial={shouldReveal ? { opacity: 0, y: 24 } : false}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="mx-auto max-w-3xl text-center"
          >
            <p className="text-xs font-semibold uppercase tracking-[0.25em] text-sky-400/80">
              {t('ping.cta.eyebrow')}
            </p>
            <h2 className="mt-3 font-display text-3xl font-bold sm:text-4xl">{t('ping.cta.title')}</h2>
            <p className="mt-4 text-lg text-white/65">{t('ping.cta.body')}</p>
            <div className="mt-8 flex flex-col items-center gap-3">
              <GooglePlayBadge />
              <p className="text-sm text-white/40">{t('ping.cta.footer')}</p>
            </div>
          </motion.div>
        </section>

        <footer className="border-t border-white/5 px-4 py-8 text-center text-xs text-white/35">
          <p>{t('ping.builtBy')}</p>
          <p className="mt-1">v1.0.0</p>
        </footer>
      </div>
    </div>
  )
}
