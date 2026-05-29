import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Accessibility, X, Type, Contrast, Minimize2, Underline, Languages, RotateCcw } from 'lucide-react'
import { useTranslation } from '../../hooks/useTranslation'

export default function AccessibilityMenu() {
  const [open, setOpen] = useState(false)
  const { t, lang, toggleLang, prefs, update, reset } = useTranslation()

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-[4.25rem] right-3 z-50 flex h-11 w-11 items-center justify-center rounded-full bg-primary text-white shadow-lg transition-transform hover:scale-105 sm:bottom-6 sm:right-4 sm:h-12 sm:w-12"
        aria-label={t('a11y.openMenu')}
      >
        <Accessibility size={22} />
      </button>

      <AnimatePresence>
        {open && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[60] bg-primary/40 backdrop-blur-sm"
              onClick={() => setOpen(false)}
            />
            <motion.div
              initial={{ opacity: 0, x: 40 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 40 }}
              transition={{ type: 'spring', damping: 28, stiffness: 320 }}
              className="fixed bottom-0 right-0 top-0 z-[70] w-full max-w-sm overflow-y-auto bg-surface shadow-2xl"
              role="dialog"
              aria-label={t('a11y.menu')}
            >
              <div className="sticky top-0 flex items-center justify-between border-b border-border bg-surface px-5 py-4">
                <div className="flex items-center gap-2">
                  <Accessibility size={20} className="text-accent" />
                  <h2 className="font-display text-lg font-semibold text-primary">{t('a11y.menu')}</h2>
                </div>
                <button
                  onClick={() => setOpen(false)}
                  className="rounded-lg p-2 text-muted hover:bg-background hover:text-primary"
                  aria-label={t('a11y.close')}
                >
                  <X size={20} />
                </button>
              </div>

              <div className="space-y-6 p-5">
                {/* Language */}
                <section>
                  <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-primary">
                    <Languages size={16} className="text-accent" />
                    {t('a11y.language')}
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { id: 'en', label: t('a11y.english') },
                      { id: 'tn', label: t('a11y.setswana') },
                    ].map(({ id, label }) => (
                      <button
                        key={id}
                        onClick={() => update('lang', id)}
                        className={`rounded-xl border py-3 text-sm font-medium transition-all ${
                          lang === id
                            ? 'border-accent bg-accent/15 text-primary'
                            : 'border-border text-muted hover:border-accent/40'
                        }`}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                </section>

                {/* Text size */}
                <section>
                  <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-primary">
                    <Type size={16} className="text-accent" />
                    {t('a11y.textSize')}
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { id: 'small', label: t('a11y.small') },
                      { id: 'medium', label: t('a11y.medium') },
                      { id: 'large', label: t('a11y.large') },
                    ].map(({ id, label }) => (
                      <button
                        key={id}
                        onClick={() => update('fontSize', id)}
                        className={`rounded-xl border py-2.5 text-sm font-medium transition-all ${
                          prefs.fontSize === id
                            ? 'border-accent bg-accent/15 text-primary'
                            : 'border-border text-muted hover:border-accent/40'
                        }`}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                </section>

                {/* Toggles */}
                <section className="space-y-3">
                  {[
                    { key: 'highContrast', icon: Contrast, label: t('a11y.highContrast') },
                    { key: 'reduceMotion', icon: Minimize2, label: t('a11y.reduceMotion') },
                    { key: 'underlineLinks', icon: Underline, label: t('a11y.underlineLinks') },
                  ].map(({ key, icon: Icon, label }) => (
                    <label
                      key={key}
                      className="flex cursor-pointer items-center justify-between rounded-xl border border-border p-4 transition-colors hover:bg-background"
                    >
                      <span className="flex items-center gap-2 text-sm font-medium text-primary">
                        <Icon size={16} className="text-accent" />
                        {label}
                      </span>
                      <input
                        type="checkbox"
                        checked={prefs[key]}
                        onChange={(e) => update(key, e.target.checked)}
                        className="h-5 w-5 accent-accent"
                      />
                    </label>
                  ))}
                </section>

                <button
                  onClick={reset}
                  className="flex w-full items-center justify-center gap-2 rounded-xl border border-border py-3 text-sm font-medium text-muted transition-colors hover:border-accent/40 hover:text-primary"
                >
                  <RotateCcw size={16} />
                  {t('a11y.reset')}
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  )
}
