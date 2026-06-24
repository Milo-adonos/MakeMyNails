import { Sparkles } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useCredits } from '../../contexts/CreditContext'

export default function GenerationBanner() {
  const { t } = useTranslation()
  const { pendingGeneration } = useCredits()

  if (!['waiting', 'generating'].includes(pendingGeneration.status)) return null

  return (
    <div className="fixed top-16 left-0 right-0 z-40 bg-brown text-offwhite px-4 py-2.5 shadow-md">
      <div className="max-w-lg mx-auto flex items-center justify-center gap-2 text-sm">
        <Sparkles className="w-4 h-4 animate-pulse flex-shrink-0" />
        <p className="text-center leading-snug">
          {t('dashboard.backgroundGeneration')}
        </p>
      </div>
    </div>
  )
}
