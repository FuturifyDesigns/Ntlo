import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import Button from '../components/ui/Button'
import { useTranslation } from '../hooks/useTranslation'

export default function NotFound() {
  const { t } = useTranslation()

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="mx-auto flex max-w-lg flex-col items-center justify-center px-4 py-12 text-center sm:py-16"
    >
      <p className="font-display text-6xl font-bold text-accent">404</p>
      <h1 className="mt-4 font-display text-2xl font-bold text-primary">{t('notFound.title')}</h1>
      <p className="mt-2 text-muted">{t('notFound.subtitle')}</p>
      <Button as={Link} to="/" className="mt-6">
        {t('notFound.backHome')}
      </Button>
    </motion.div>
  )
}
