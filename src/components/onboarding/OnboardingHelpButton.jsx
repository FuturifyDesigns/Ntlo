import { CircleHelp } from 'lucide-react'
import { useTranslation } from '../../hooks/useTranslation'
import Button from '../ui/Button'

export default function OnboardingHelpButton({ onClick, className = '' }) {
  const { t } = useTranslation()

  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      onClick={onClick}
      className={className}
      data-onboarding="onboarding-help"
    >
      <CircleHelp size={16} />
      {t('onboarding.replayTour')}
    </Button>
  )
}
