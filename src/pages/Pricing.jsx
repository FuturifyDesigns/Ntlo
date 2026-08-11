import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { GraduationCap, Building2, Check, ArrowRight } from 'lucide-react'
import { useTranslation } from '../hooks/useTranslation'
import { useLocale } from '../context/LocaleContext'
import Button from '../components/ui/Button'
import { useAuth } from '../hooks/useAuth'

const STUDENT_PERKS = [
  'studentsBrowse',
  'studentsContact',
  'studentsSave',
  'studentsApply',
]

const LANDLORD_PERKS = [
  'tierFreeListings',
  'tierFreePhotos',
  'tierFreeBadge',
  'tierFreeExtras',
]

export default function Pricing() {
  const { t } = useTranslation()
  const { prefs } = useLocale()
  const { user, isLandlord } = useAuth()
  const reduce = prefs.reduceMotion

  const landlordCta = user && isLandlord
    ? '/landlord/listings/new'
    : user
      ? '/landlord'
      : '/register?role=landlord'

  return (
    <div>
      <section className="relative overflow-hidden bg-primary px-4 py-16 text-center sm:py-20">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(200,168,75,0.18),transparent_55%)]" />
        <div className="relative mx-auto max-w-3xl">
          <span className="section-label mb-5 text-accent">{t('pricing.label')}</span>
          <h1 className="font-display text-4xl font-bold tracking-tight text-white sm:text-5xl">
            {t('pricing.title')}
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-lg text-white/65">{t('pricing.subtitle')}</p>
        </div>
      </section>

      <section className="mx-auto max-w-5xl px-4 py-12 sm:px-6 sm:py-16">
        <div className="grid gap-6 lg:grid-cols-2">
          <motion.div
            initial={reduce ? false : { opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-2xl border border-border bg-surface p-6 sm:p-8"
          >
            <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-xl bg-accent/15 text-accent">
              <GraduationCap size={24} />
            </div>
            <p className="text-sm font-semibold uppercase tracking-wide text-accent">{t('pricing.studentsBadge')}</p>
            <h2 className="mt-2 font-display text-2xl font-bold text-primary">{t('pricing.studentsTitle')}</h2>
            <p className="mt-1 font-display text-4xl font-bold text-success">{t('pricing.studentsFree')}</p>
            <p className="mt-3 text-muted">{t('pricing.studentsTagline')}</p>
            <ul className="mt-6 space-y-3">
              {STUDENT_PERKS.map((key) => (
                <li key={key} className="flex items-start gap-2 text-sm text-primary">
                  <Check className="mt-0.5 h-4 w-4 shrink-0 text-success" />
                  {t(`pricing.${key}`)}
                </li>
              ))}
            </ul>
            <Button as={Link} to={user ? '/listings' : '/register?role=student'} className="mt-8 w-full sm:w-auto">
              {t('pricing.studentsCta')}
              <ArrowRight size={16} />
            </Button>
          </motion.div>

          <motion.div
            initial={reduce ? false : { opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: reduce ? 0 : 0.08 }}
            className="rounded-2xl border-2 border-success/35 bg-surface p-6 sm:p-8"
          >
            <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-xl bg-success/15 text-success">
              <Building2 size={24} />
            </div>
            <p className="text-sm font-semibold uppercase tracking-wide text-success">{t('pricing.landlordsBadge')}</p>
            <h2 className="mt-2 font-display text-2xl font-bold text-primary">{t('pricing.landlordsTitle')}</h2>
            <p className="mt-1 font-display text-4xl font-bold text-success">{t('pricing.freeForever')}</p>
            <p className="mt-3 text-muted">{t('pricing.landlordsFreeBody')}</p>
            <ul className="mt-6 space-y-3">
              {LANDLORD_PERKS.map((key) => (
                <li key={key} className="flex items-start gap-2 text-sm text-primary">
                  <Check className="mt-0.5 h-4 w-4 shrink-0 text-success" />
                  {t(`pricing.${key}`)}
                </li>
              ))}
            </ul>
            <Button as={Link} to={landlordCta} className="mt-8 w-full sm:w-auto">
              {t('pricing.listFreeNow')}
              <ArrowRight size={16} />
            </Button>
          </motion.div>
        </div>

        <p className="mx-auto mt-10 max-w-2xl text-center text-sm text-muted">
          {t('pricing.freeNote')}
        </p>
      </section>
    </div>
  )
}
