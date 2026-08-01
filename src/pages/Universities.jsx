import { motion } from 'framer-motion'
import UniversityShowcase from '../components/universities/UniversityShowcase'
import { useUniversities } from '../hooks/useUniversities'
import { useLiveListingStats } from '../hooks/useLiveListingStats'
import { RevealText } from '../components/ui/Motion'
import { useTranslation } from '../hooks/useTranslation'

export default function Universities() {
  const { t } = useTranslation()
  const { universities } = useUniversities()
  const { campusCounts, listings: totalLiveListings } = useLiveListingStats()

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <section className="relative overflow-hidden bg-primary">
        <div className="absolute inset-0 grid grid-cols-3 opacity-30">
          {universities.slice(0, 3).map((uni) => (
            <img key={uni.id} src={uni.image} alt="" className="h-full w-full object-cover" />
          ))}
        </div>
        <div className="absolute inset-0 bg-primary/85" />
        <div className="relative mx-auto max-w-7xl px-4 py-10 text-center sm:py-14 sm:px-6 lg:px-8 lg:py-16">
          <motion.h1
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="font-display text-4xl font-semibold tracking-tight text-white sm:text-5xl lg:text-6xl"
          >
            <RevealText text={t('universities.title1')} delay={0.1} />
            <span className="mt-2 block text-accent">
              <RevealText text={t('universities.title2')} delay={0.4} />
            </span>
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 }}
            className="mx-auto mt-5 max-w-xl text-lg text-white/65"
          >
            {t('universities.subtitle', { count: universities.length })}
          </motion.p>
        </div>
      </section>

      <UniversityShowcase counts={campusCounts} totalListings={totalLiveListings} />
    </motion.div>
  )
}
