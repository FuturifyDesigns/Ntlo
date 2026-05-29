import { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  IconSearch,
  IconLocation,
  IconWhatsApp,
  IconUpload,
  IconShield,
  IconVerified,
  IconHeart,
} from '../ui/Icons'
import { useStats } from '../../hooks/useStats'
import { AnimatedCounter, Reveal } from '../ui/Motion'
import { useTranslation } from '../../hooks/useTranslation'

export default function HowItWorks() {
  const [tab, setTab] = useState('student')
  const stats = useStats()
  const { t } = useTranslation()

  const studentSteps = useMemo(() => [
    { icon: IconSearch, title: t('howItWorks.studentStep1Title'), desc: t('howItWorks.studentStep1Desc') },
    { icon: IconLocation, title: t('howItWorks.studentStep2Title'), desc: t('howItWorks.studentStep2Desc') },
    { icon: IconWhatsApp, title: t('howItWorks.studentStep3Title'), desc: t('howItWorks.studentStep3Desc') },
  ], [t])

  const landlordSteps = useMemo(() => [
    { icon: IconUpload, title: t('howItWorks.landlordStep1Title'), desc: t('howItWorks.landlordStep1Desc') },
    { icon: IconShield, title: t('howItWorks.landlordStep2Title'), desc: t('howItWorks.landlordStep2Desc') },
    { icon: IconVerified, title: t('howItWorks.landlordStep3Title'), desc: t('howItWorks.landlordStep3Desc') },
  ], [t])

  const steps = tab === 'student' ? studentSteps : landlordSteps

  const liveStats = [
    { value: stats.listings, label: t('howItWorks.activeListings') },
    { value: stats.universitiesWithListings || stats.universities, label: t('howItWorks.campusesCovered') },
    { value: stats.landlords, label: t('howItWorks.landlordsOnNtlo') },
  ]

  return (
    <section className="bg-surface py-8 sm:py-12 lg:py-16">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <Reveal className="mb-8 text-center sm:mb-10">
          <span className="section-label mb-4">{t('howItWorks.label')}</span>
          <h2 className="font-display text-3xl font-semibold tracking-tight text-primary sm:text-4xl">{t('howItWorks.title')}</h2>
          <p className="mt-3 text-muted">{t('howItWorks.subtitle')}</p>
        </Reveal>

        <div className="mb-6 flex justify-center sm:mb-8">
          <div className="inline-flex rounded-xl border border-border bg-background p-1">
            {[
              { id: 'student', label: t('howItWorks.forStudents') },
              { id: 'landlord', label: t('howItWorks.forLandlords') },
            ].map(({ id, label }) => (
              <button
                key={id}
                onClick={() => setTab(id)}
                className={`rounded-lg px-6 py-2.5 text-sm font-semibold transition-all ${
                  tab === id ? 'bg-primary text-white shadow-md' : 'text-muted hover:text-primary'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={tab}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.3 }}
            className="grid gap-6 md:grid-cols-3"
          >
            {steps.map(({ icon: Icon, title, desc }, i) => (
              <div key={title} className="card-elevated relative p-5 text-center sm:p-7">
                <span className="absolute right-5 top-5 font-display text-4xl font-bold text-primary/5">
                  {String(i + 1).padStart(2, '0')}
                </span>
                <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-accent/10 ring-1 ring-accent/20">
                  <Icon className="h-6 w-6 text-accent" />
                </div>
                <h3 className="font-display text-lg font-semibold text-primary">{title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted">{desc}</p>
              </div>
            ))}
          </motion.div>
        </AnimatePresence>

        <Reveal delay={0.2} className="mt-8 sm:mt-12">
          <div className="grid grid-cols-3 divide-x divide-white/10 overflow-hidden rounded-2xl bg-primary">
            {liveStats.map(({ value, label }) => (
              <div key={label} className="px-4 py-8 text-center">
                <p className="font-display text-3xl font-semibold text-accent sm:text-4xl">
                  {stats.loading ? '—' : <AnimatedCounter value={value} />}
                </p>
                <p className="mt-1.5 text-xs text-white/55 sm:text-sm">{label}</p>
              </div>
            ))}
          </div>
          <p className="mt-3 text-center text-xs text-muted">{t('howItWorks.statsNote')}</p>
        </Reveal>
      </div>
    </section>
  )
}

export function TrustFeatures() {
  const { t } = useTranslation()

  const features = [
    { icon: IconVerified, label: t('trust.verified') },
    { icon: IconLocation, label: t('trust.distance') },
    { icon: IconShield, label: t('trust.trusted') },
    { icon: IconHeart, label: t('trust.save') },
    { icon: IconWhatsApp, label: t('trust.whatsapp') },
  ]

  return (
    <section className="border-y border-border bg-background py-8 sm:py-10">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 gap-8 md:grid-cols-5 md:gap-6">
          {features.map(({ icon: Icon, label }) => (
            <div key={label} className="flex flex-col items-center text-center">
              <div className="mb-3.5 flex h-12 w-12 items-center justify-center rounded-2xl bg-surface shadow-sm ring-1 ring-border">
                <Icon className="h-6 w-6 text-accent" />
              </div>
              <p className="text-xs font-medium leading-snug text-primary sm:text-sm">{label}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
