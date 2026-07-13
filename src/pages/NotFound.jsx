import { useEffect } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import Button from '../components/ui/Button'
import { useTranslation } from '../hooks/useTranslation'

export default function NotFound() {
  const { t } = useTranslation()

  useEffect(() => {
    document.title = `${t('notFound.title')} — Ntlo`
  }, [t])

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="mx-auto flex max-w-lg flex-col items-center justify-center px-4 py-12 text-center sm:py-20"
    >
      <img
        src={`${import.meta.env.BASE_URL}mascot/thinking.png`}
        alt=""
        className="mb-4 h-24 w-24 object-contain"
        width={96}
        height={96}
      />
      <p className="font-display text-6xl font-bold text-accent" aria-hidden="true">404</p>
      <h1 className="mt-3 font-display text-2xl font-bold text-primary sm:text-3xl">
        {t('notFound.title')}
      </h1>
      <p className="mt-2 max-w-md text-sm leading-relaxed text-muted sm:text-base">
        {t('notFound.subtitle')}
      </p>
      <div className="mt-8 flex w-full flex-col gap-3 sm:w-auto sm:flex-row sm:justify-center">
        <Button as={Link} to="/" className="w-full sm:w-auto">
          {t('notFound.backHome')}
        </Button>
        <Button as={Link} to="/listings" variant="outline" className="w-full sm:w-auto">
          {t('notFound.browseListings')}
        </Button>
      </div>
    </motion.div>
  )
}
