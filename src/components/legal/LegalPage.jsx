import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowLeft, ShieldCheck } from 'lucide-react'

/**
 * Shared layout for legal pages (Privacy, Terms).
 * sections: [{ heading, body: string | string[] }]
 */
export default function LegalPage({
  icon: Icon = ShieldCheck,
  title,
  updated,
  intro,
  sections = [],
  contactEmail,
  contactNote,
}) {
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <section className="relative overflow-hidden bg-primary px-4 py-12 text-white sm:px-6 sm:py-16 lg:px-8">
        <div className="mx-auto max-w-3xl">
          <Link
            to="/"
            className="mb-6 inline-flex items-center gap-1.5 text-sm text-white/70 transition-colors hover:text-white"
          >
            <ArrowLeft size={15} />
            Back to home
          </Link>
          <div className="flex items-center gap-3">
            <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-accent/20 text-accent">
              <Icon size={26} strokeWidth={1.75} />
            </span>
            <div>
              <h1 className="font-display text-3xl font-bold sm:text-4xl">{title}</h1>
              {updated && <p className="mt-1 text-sm text-white/60">Last updated: {updated}</p>}
            </div>
          </div>
        </div>
      </section>

      <article className="mx-auto max-w-3xl px-4 py-10 sm:px-6 sm:py-12 lg:px-8">
        {intro && <p className="text-base leading-relaxed text-muted">{intro}</p>}

        <div className="mt-8 space-y-8">
          {sections.map((section, i) => (
            <section key={section.heading} className="scroll-mt-24">
              <h2 className="font-display text-xl font-semibold text-primary">
                <span className="mr-2 text-accent">{i + 1}.</span>
                {section.heading}
              </h2>
              <div className="mt-3 space-y-3 text-[15px] leading-relaxed text-muted">
                {Array.isArray(section.body)
                  ? section.body.map((para, j) =>
                      typeof para === 'string' || para?.items == null ? (
                        <p key={j}>{para}</p>
                      ) : (
                        <ul key={j} className="list-disc space-y-1.5 pl-5">
                          {para.items.map((item, k) => (
                            <li key={typeof item === 'string' ? item : k}>{item}</li>
                          ))}
                        </ul>
                      )
                    )
                  : <p>{section.body}</p>}
              </div>
            </section>
          ))}
        </div>

        {contactEmail && (
          <div className="mt-10 rounded-xl border border-border bg-surface p-5">
            <p className="text-sm text-muted">
              Questions about this policy? Contact us at{' '}
              <a href={`mailto:${contactEmail}`} className="font-semibold text-accent hover:underline">
                {contactEmail}
              </a>
              .
            </p>
            {contactNote && <p className="mt-2 text-sm text-muted">{contactNote}</p>}
          </div>
        )}
      </article>
    </motion.div>
  )
}
