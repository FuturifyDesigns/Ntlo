import { useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Plus } from 'lucide-react'
import { useUniversities } from '../../hooks/useUniversities'
import { IconUniversity, IconLocation } from '../ui/Icons'
import OtherUniversityModal from '../universities/OtherUniversityModal'
import { Reveal } from '../ui/Motion'

const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.06 } },
}

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.45, ease: [0.22, 1, 0.36, 1] } },
}

export default function UniversityGrid({ counts = {}, showHeader = true }) {
  const [otherOpen, setOtherOpen] = useState(false)
  const { universities } = useUniversities()

  return (
    <>
      <section id="universities" className="py-16 sm:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          {showHeader && (
            <Reveal className="mb-12 text-center">
              <span className="section-label mb-4">Campuses</span>
              <h2 className="font-display text-3xl font-semibold tracking-tight text-primary sm:text-4xl">
                Browse by university
              </h2>
              <p className="mx-auto mt-3 max-w-lg text-muted">
                Find rooms near your campus across Botswana
              </p>
            </Reveal>
          )}

          <motion.div
            variants={container}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, margin: '-60px' }}
            className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4"
          >
            {universities.map((uni) => (
              <motion.div key={uni.id} variants={item}>
                <Link to={`/universities/${uni.slug}`} className="group block h-full">
                  <div className="card-elevated relative h-full overflow-hidden p-5">
                    <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-accent to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
                    <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-primary/5 ring-1 ring-primary/10 transition-colors group-hover:bg-accent/15 group-hover:ring-accent/30">
                      <IconUniversity className="h-5 w-5 text-accent" />
                    </div>
                    <h3 className="font-display text-lg font-semibold text-primary">{uni.short_name}</h3>
                    <p className="mt-1 line-clamp-2 text-sm text-muted">{uni.name}</p>
                    <p className="mt-3 flex items-center gap-1.5 text-xs text-muted">
                      <IconLocation className="h-3.5 w-3.5 shrink-0" />
                      {uni.city}
                    </p>
                    <p className="mt-4 text-sm font-semibold text-accent transition-transform group-hover:translate-x-0.5">
                      {counts[uni.id] > 0
                        ? `${counts[uni.id]} listing${counts[uni.id] !== 1 ? 's' : ''} →`
                        : 'View listings →'}
                    </p>
                  </div>
                </Link>
              </motion.div>
            ))}

            <motion.div variants={item}>
              <button
                type="button"
                onClick={() => setOtherOpen(true)}
                className="group h-full w-full text-left"
              >
                <div className="card-elevated relative flex h-full min-h-[180px] flex-col items-center justify-center overflow-hidden border-dashed p-5 text-center">
                  <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-xl border border-dashed border-accent/40 bg-accent/5 transition-colors group-hover:bg-accent/15">
                    <Plus className="h-5 w-5 text-accent" />
                  </div>
                  <h3 className="font-display text-lg font-semibold text-primary">Other university</h3>
                  <p className="mt-1 text-sm text-muted">Not listed? Request to add yours</p>
                </div>
              </button>
            </motion.div>
          </motion.div>
        </div>
      </section>

      <OtherUniversityModal open={otherOpen} onClose={() => setOtherOpen(false)} />
    </>
  )
}
