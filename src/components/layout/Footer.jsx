import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowRight, Mail, Globe, Search, GraduationCap, Tag, Home, ShieldCheck, FileText, Users } from 'lucide-react'
import { useTranslation } from '../../hooks/useTranslation'
import { useCookieConsent } from '../../context/CookieConsentContext'
import { PatternBotswana } from '../ui/Icons'

const exploreLinks = [
  { to: '/listings', labelKey: 'footer.browseListings', icon: Search },
  { to: '/universities', labelKey: 'nav.universities', icon: GraduationCap },
  { to: '/pricing', labelKey: 'nav.pricing', icon: Tag },
  { to: '/register?role=landlord', labelKey: 'footer.listRoom', icon: Home },
]

function FooterLink({ to, icon: Icon, children }) {
  return (
    <Link
      to={to}
      className="group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-white/60 transition-all hover:bg-white/5 hover:text-white"
    >
      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white/5 text-accent transition-colors group-hover:bg-accent/15">
        <Icon size={16} strokeWidth={1.75} />
      </span>
      <span className="flex-1">{children}</span>
      <ArrowRight
        size={14}
        className="shrink-0 opacity-0 transition-all group-hover:translate-x-0.5 group-hover:opacity-100"
      />
    </Link>
  )
}

function ContactLink({ href, icon: Icon, children, external }) {
  const className =
    'group flex items-start gap-3 rounded-lg px-2 py-2 text-sm transition-colors hover:text-white'

  const inner = (
    <>
      <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white/5 text-accent transition-colors group-hover:bg-accent/15">
        <Icon size={18} strokeWidth={1.75} />
      </span>
      <span className="min-w-0 pt-1.5 leading-snug text-white/60 transition-colors group-hover:text-white break-words">
        {children}
      </span>
    </>
  )

  if (external || href.startsWith('http') || href.startsWith('mailto')) {
    return (
      <a
        href={href}
        target={href.startsWith('http') ? '_blank' : undefined}
        rel={href.startsWith('http') ? 'noopener noreferrer' : undefined}
        className={className}
      >
        {inner}
      </a>
    )
  }

  return (
    <Link to={href} className={className}>
      {inner}
    </Link>
  )
}

export default function Footer() {
  const { t } = useTranslation()
  const { openPreferences } = useCookieConsent()

  return (
    <footer className="relative mt-auto overflow-hidden bg-primary text-white">
      <PatternBotswana className="pointer-events-none absolute inset-0 opacity-[0.07]" />
      <div className="gold-divider relative opacity-30" />

      <div className="relative mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-10 lg:px-8 lg:py-12">
        <div className="grid gap-8 md:grid-cols-5 md:gap-10">
          <motion.div
            className="md:col-span-2"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            <Link to="/" className="inline-block transition-opacity hover:opacity-90">
              <img
                src={`${import.meta.env.BASE_URL}logo-brand.png`}
                alt="Ntlo"
                className="mb-5 h-16 w-auto max-w-[240px] object-contain sm:h-20"
              />
            </Link>
            <p className="max-w-sm text-sm leading-relaxed text-white/60">{t('footer.tagline')}</p>
            <p className="mt-3 font-display text-base text-accent">{t('footer.slogan')}</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.08 }}
          >
            <h3 className="mb-4 text-xs font-semibold uppercase tracking-[0.15em] text-accent">
              {t('footer.explore')}
            </h3>
            <ul className="space-y-1">
              {exploreLinks.map(({ to, labelKey, icon }) => (
                <li key={to}>
                  <FooterLink to={to} icon={icon}>
                    {t(labelKey)}
                  </FooterLink>
                </li>
              ))}
            </ul>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.16 }}
          >
            <h3 className="mb-4 text-xs font-semibold uppercase tracking-[0.15em] text-accent">
              {t('footer.contact')}
            </h3>
            <ul className="space-y-2">
              <li>
                <ContactLink href="mailto:futurifydesigns@gmail.com" icon={Mail}>
                  futurifydesigns@gmail.com
                </ContactLink>
              </li>
              <li>
                <ContactLink href="https://futurifydesigns.com" icon={Globe} external>
                  futurifydesigns.com
                </ContactLink>
              </li>
            </ul>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.24 }}
          >
            <h3 className="mb-4 text-xs font-semibold uppercase tracking-[0.15em] text-accent">
              {t('footer.legal')}
            </h3>
            <ul className="space-y-1">
              <li>
                <FooterLink to="/privacy" icon={ShieldCheck}>
                  {t('footer.privacy')}
                </FooterLink>
              </li>
              <li>
                <FooterLink to="/terms" icon={FileText}>
                  {t('footer.terms')}
                </FooterLink>
              </li>
              <li>
                <FooterLink to="/guidelines" icon={Users}>
                  {t('footer.guidelines')}
                </FooterLink>
              </li>
            </ul>
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.3 }}
          className="mt-8 border-t border-white/8 pt-5 text-center text-xs text-white/40 sm:mt-10 sm:pt-6"
        >
          <p>{t('footer.copyright')}</p>
          <button
            type="button"
            onClick={openPreferences}
            className="mt-2 text-white/50 underline-offset-2 transition-colors hover:text-accent hover:underline"
          >
            {t('footer.cookieSettings')}
          </button>
        </motion.div>
      </div>
    </footer>
  )
}
