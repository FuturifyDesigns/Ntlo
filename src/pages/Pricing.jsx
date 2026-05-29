import { useState } from 'react'
import { Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Check,
  Sparkles,
  Clock,
  GraduationCap,
  Building2,
  ChevronRight,
  Shield,
  Zap,
  Heart,
} from 'lucide-react'
import Button from '../components/ui/Button'
import { Reveal } from '../components/ui/Motion'
import { useTranslation } from '../hooks/useTranslation'

const LANDLORD_TIERS = [
  {
    id: 'basic',
    price: null,
    featured: false,
    features: ['tierBasicListings', 'tierBasicPhotos', 'tierBasicExtras'],
    whyKey: 'whyBasic',
  },
  {
    id: 'standard',
    price: 79,
    featured: true,
    features: ['tierStandardListings', 'tierStandardPhotos', 'tierStandardExtras'],
    whyKey: 'whyStandard',
  },
  {
    id: 'premium',
    price: 149,
    featured: false,
    features: ['tierPremiumListings', 'tierPremiumPhotos', 'tierPremiumExtras'],
    whyKey: 'whyPremium',
  },
]

const STUDENT_PERKS = ['studentPerk1', 'studentPerk2', 'studentPerk3']

function tierNameKey(id) {
  return `pricing.tier${id.charAt(0).toUpperCase() + id.slice(1)}Name`
}

export default function Pricing() {
  const { t } = useTranslation()
  const [audience, setAudience] = useState('students')
  const [selectedTier, setSelectedTier] = useState('standard')
  const [hoveredTier, setHoveredTier] = useState(null)

  const activeTier = LANDLORD_TIERS.find((tier) => tier.id === selectedTier)

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      {/* Hero */}
      <section className="relative overflow-hidden bg-primary px-4 py-10 sm:py-14 sm:px-6 lg:px-8 lg:py-16">
        <div className="hero-orb hero-orb-1 opacity-40" />
        <div className="hero-orb hero-orb-2 opacity-30" />
        <div className="relative mx-auto max-w-3xl text-center">
          <span className="section-label mb-5 text-accent">{t('pricing.label')}</span>
          <h1 className="font-display text-3xl font-semibold tracking-tight text-white sm:text-4xl lg:text-5xl">
            {t('pricing.title')}
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-lg text-white/65">{t('pricing.subtitle')}</p>

          {/* Audience toggle */}
          <div className="mx-auto mt-6 flex w-full max-w-sm flex-col rounded-xl border border-white/15 bg-white/5 p-1 backdrop-blur-sm sm:mt-8 sm:inline-flex sm:w-auto sm:max-w-none sm:flex-row">
            {[
              { id: 'students', icon: GraduationCap, label: t('pricing.tabStudents') },
              { id: 'landlords', icon: Building2, label: t('pricing.tabLandlords') },
            ].map(({ id, icon: Icon, label }) => (
              <button
                key={id}
                onClick={() => setAudience(id)}
                className={`relative flex w-full items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold transition-colors sm:w-auto sm:px-5 ${
                  audience === id ? 'text-primary' : 'text-white/70 hover:text-white'
                }`}
              >
                {audience === id && (
                  <motion.span
                    layoutId="pricing-audience"
                    className="absolute inset-0 rounded-lg bg-accent shadow-lg shadow-accent/25"
                    transition={{ type: 'spring', stiffness: 380, damping: 32 }}
                  />
                )}
                <span className="relative flex items-center gap-2">
                  <Icon size={16} />
                  {label}
                </span>
              </button>
            ))}
          </div>
        </div>
      </section>

      <AnimatePresence mode="wait">
        {audience === 'students' ? (
          <motion.section
            key="students"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -16 }}
            transition={{ duration: 0.35 }}
            className="border-b border-border bg-gradient-to-b from-accent/20 to-accent/5 py-8 sm:py-12 lg:py-16"
          >
            <div className="mx-auto max-w-4xl px-4 text-center sm:px-6 lg:px-8">
              <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.1 }}
                className="inline-flex items-center gap-2 rounded-full bg-accent px-4 py-1.5 text-xs font-bold uppercase tracking-widest text-primary shadow-md shadow-accent/30"
              >
                <Sparkles size={14} />
                {t('pricing.studentsBadge')}
              </motion.div>

              <h2 className="mt-4 font-display text-2xl font-bold text-primary sm:mt-6 sm:text-3xl lg:text-4xl">
                {t('pricing.studentsTitle')}
              </h2>
              <motion.p
                className="mx-auto mt-3 font-display text-3xl font-bold text-accent sm:mt-4 sm:text-4xl lg:text-5xl"
                animate={{ scale: [1, 1.02, 1] }}
                transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
              >
                {t('pricing.studentsFree')}
              </motion.p>
              <p className="mx-auto mt-5 max-w-2xl text-base leading-relaxed text-muted sm:text-lg">
                {t('pricing.studentsTagline')}
              </p>

              <div className="mx-auto mt-6 flex max-w-xl flex-wrap justify-center gap-2 sm:mt-8 sm:gap-3">
                {STUDENT_PERKS.map((key, i) => (
                  <motion.div
                    key={key}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.15 + i * 0.08 }}
                    whileHover={{ scale: 1.05, y: -2 }}
                    className="flex items-center gap-2 rounded-full border border-accent/30 bg-surface px-4 py-2 text-sm font-medium text-primary shadow-sm"
                  >
                    <Shield size={15} className="text-accent" />
                    {t(`pricing.${key}`)}
                  </motion.div>
                ))}
              </div>

              <div className="mt-6 flex flex-col justify-center gap-3 sm:mt-8 sm:flex-row">
                <Button as={Link} to="/listings" variant="primary" size="lg">
                  {t('hero.browseListings')}
                </Button>
                <Button as={Link} to="/register" variant="outline" size="lg">
                  {t('auth.register')}
                </Button>
              </div>
            </div>
          </motion.section>
        ) : (
          <motion.div
            key="landlords"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -16 }}
            transition={{ duration: 0.35 }}
          >
            <section className="py-8 sm:py-12 lg:py-16">
              <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                <Reveal className="mb-6 text-center sm:mb-8">
                  <h2 className="font-display text-3xl font-semibold text-primary sm:text-4xl">
                    {t('pricing.landlordsTitle')}
                  </h2>
                  <motion.div
                    className="mx-auto mt-4 inline-flex items-center gap-2 rounded-full border border-accent/40 bg-accent/10 px-4 py-2 text-sm font-medium text-primary"
                    animate={{ opacity: [1, 0.75, 1] }}
                    transition={{ duration: 2.5, repeat: Infinity }}
                  >
                    <Clock size={16} className="text-accent" />
                    {t('pricing.comingSoon')}
                  </motion.div>
                  <p className="mx-auto mt-3 max-w-xl text-sm text-muted">{t('pricing.comingSoonNote')}</p>
                  <p className="mt-4 text-xs font-medium uppercase tracking-wider text-accent">
                    {t('pricing.selectPlan')}
                  </p>
                </Reveal>

                <div className="grid gap-6 lg:grid-cols-3">
                  {LANDLORD_TIERS.map((tier, i) => {
                    const isSelected = selectedTier === tier.id
                    const isHovered = hoveredTier === tier.id

                    return (
                      <motion.button
                        key={tier.id}
                        type="button"
                        initial={{ opacity: 0, y: 24 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.08 }}
                        whileHover={{ y: -6 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => setSelectedTier(tier.id)}
                        onMouseEnter={() => setHoveredTier(tier.id)}
                        onMouseLeave={() => setHoveredTier(null)}
                        className={`relative flex h-full w-full flex-col rounded-2xl border p-6 text-left transition-shadow sm:p-8 ${
                          isSelected
                            ? 'border-accent bg-surface shadow-xl shadow-accent/15 ring-2 ring-accent/40'
                            : tier.featured
                              ? 'border-accent/50 bg-surface shadow-lg shadow-accent/5'
                              : 'border-border bg-surface hover:border-accent/30 hover:shadow-lg'
                        }`}
                      >
                        {tier.featured && (
                          <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-accent px-4 py-1 text-xs font-bold uppercase tracking-wide text-primary">
                            {t('pricing.popular')}
                          </span>
                        )}

                        {isSelected && (
                          <motion.span
                            layoutId="tier-selected-ring"
                            className="pointer-events-none absolute inset-0 rounded-2xl ring-2 ring-accent/60"
                            transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                          />
                        )}

                        <div className="mb-6">
                          <h3 className="font-display text-xl font-semibold text-primary">
                            {t(tierNameKey(tier.id))}
                          </h3>
                          <div className="mt-3 flex items-baseline gap-1">
                            {tier.price === null ? (
                              <span className="font-display text-4xl font-bold text-accent">{t('pricing.free')}</span>
                            ) : (
                              <>
                                <motion.span
                                  key={`${tier.id}-${isHovered}`}
                                  className="font-display text-4xl font-bold text-primary"
                                  initial={{ scale: 0.9, opacity: 0.5 }}
                                  animate={{ scale: 1, opacity: 1 }}
                                >
                                  P{tier.price}
                                </motion.span>
                                <span className="text-muted">{t('pricing.perMonth')}</span>
                              </>
                            )}
                          </div>
                        </div>

                        <ul className="mb-8 flex-1 space-y-3">
                          {tier.features.map((key, fi) => (
                            <motion.li
                              key={key}
                              initial={false}
                              animate={{ x: isSelected ? 4 : 0 }}
                              transition={{ delay: fi * 0.04 }}
                              className="flex items-start gap-2.5 text-sm text-primary"
                            >
                              <Check size={18} className="mt-0.5 shrink-0 text-accent" />
                              {t(`pricing.${key}`)}
                            </motion.li>
                          ))}
                        </ul>

                        <span
                          className={`inline-flex w-full items-center justify-center gap-2 rounded-lg py-2.5 text-sm font-semibold ${
                            isSelected ? 'bg-accent text-primary' : 'border border-border bg-background text-muted'
                          }`}
                        >
                          {t('pricing.comingSoon')}
                          {isSelected && <ChevronRight size={16} />}
                        </span>
                      </motion.button>
                    )
                  })}
                </div>

                {/* Selected plan detail panel */}
                <AnimatePresence mode="wait">
                  {activeTier && (
                    <motion.div
                      key={activeTier.id}
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.3 }}
                      className="overflow-hidden"
                    >
                      <div className="mt-8 rounded-2xl border border-accent/30 bg-gradient-to-br from-accent/10 to-surface p-6 sm:p-8">
                        <div className="flex items-start gap-4">
                          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-accent/20">
                            <Zap className="h-6 w-6 text-accent" />
                          </div>
                          <div>
                            <p className="text-xs font-semibold uppercase tracking-wider text-accent">
                              {t('pricing.planDetails')}
                            </p>
                            <h3 className="mt-1 font-display text-xl font-semibold text-primary">
                              {t(tierNameKey(activeTier.id))}
                            </h3>
                            <p className="mt-2 text-sm leading-relaxed text-muted">
                              {t(`pricing.${activeTier.whyKey}`)}
                            </p>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                <p className="mt-8 text-center text-sm text-muted">
                  {t('pricing.freeForNow')}{' '}
                  <Link to="/register?role=landlord" className="font-semibold text-accent hover:underline">
                    {t('pricing.listFreeNow')}
                  </Link>
                </p>
              </div>
            </section>

            {/* Why these numbers — accordion style cards */}
            <section className="border-t border-border bg-background py-8 sm:py-12 lg:py-16">
              <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
                <Reveal className="text-center">
                  <span className="section-label mb-4">{t('pricing.whyLabel')}</span>
                  <h2 className="font-display text-3xl font-semibold text-primary">{t('pricing.whyTitle')}</h2>
                </Reveal>

                <div className="mt-6 space-y-3 sm:mt-8">
                  {LANDLORD_TIERS.map((tier, i) => {
                    const isOpen = selectedTier === tier.id
                    return (
                      <motion.div
                        key={tier.id}
                        initial={{ opacity: 0, y: 12 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true, margin: '-40px' }}
                        transition={{ delay: i * 0.06 }}
                      >
                        <button
                          type="button"
                          onClick={() => setSelectedTier(tier.id)}
                          className={`w-full rounded-xl border p-5 text-left transition-all ${
                            isOpen
                              ? 'border-accent bg-surface shadow-md'
                              : 'border-border bg-surface hover:border-accent/40 hover:bg-surface/80'
                          }`}
                        >
                          <div className="flex items-center justify-between gap-4">
                            <h3 className="font-display text-lg font-semibold text-primary">
                              {t(tierNameKey(tier.id))}
                            </h3>
                            <motion.span
                              animate={{ rotate: isOpen ? 90 : 0 }}
                              transition={{ duration: 0.2 }}
                            >
                              <ChevronRight size={20} className="text-accent" />
                            </motion.span>
                          </div>
                          <AnimatePresence>
                            {isOpen && (
                              <motion.p
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                exit={{ opacity: 0, height: 0 }}
                                className="mt-3 overflow-hidden text-sm leading-relaxed text-muted"
                              >
                                {t(`pricing.${tier.whyKey}`)}
                              </motion.p>
                            )}
                          </AnimatePresence>
                        </button>
                      </motion.div>
                    )
                  })}
                </div>
              </div>
            </section>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Always-visible student free strip */}
      <section className="border-t border-border bg-primary py-6 sm:py-8">
        <div className="mx-auto flex max-w-4xl flex-col items-center gap-3 px-4 text-center sm:flex-row sm:justify-between sm:gap-4 sm:text-left">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-full bg-accent/20">
              <Heart className="h-5 w-5 text-accent" />
            </div>
            <div>
              <p className="font-display text-lg font-semibold text-white">{t('pricing.studentsTitle')}</p>
              <p className="text-sm text-white/60">{t('pricing.studentsTagline')}</p>
            </div>
          </div>
          <Button as={Link} to="/listings" variant="accent" size="md">
            {t('hero.browseListings')}
          </Button>
        </div>
      </section>
    </motion.div>
  )
}
