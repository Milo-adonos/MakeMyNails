import { useState } from 'react'
import { motion } from 'framer-motion'
import { Sparkles, Lock } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useCredits } from '../../contexts/CreditContext'
import SubscriptionPlans from '../pricing/SubscriptionPlans'
import Button from '../common/Button'

export default function CreditCheck({ onNext, onBack }) {
  const { t } = useTranslation()
  const { credits, addCredits } = useCredits()
  const hasCredits = credits > 0
  const [loading, setLoading] = useState(null)

  const handleSubscribe = async (planId) => {
    setLoading(planId)
    try {
      await addCredits(planId)
    } catch {
      setLoading(null)
    }
  }

  if (hasCredits) {
    return (
      <div className="min-h-screen flex flex-col px-6 py-12 bg-gradient-to-b from-offwhite to-nude-light/30">
        <div className="flex-1 flex flex-col items-center justify-center max-w-md mx-auto w-full">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="w-24 h-24 rounded-3xl flex items-center justify-center mb-8 bg-gradient-to-br from-nude to-beige"
          >
            <Sparkles className="w-12 h-12 text-brown" />
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-center mb-8"
          >
            <h2 className="font-heading text-3xl font-bold text-brown mb-3">
              {t('creditCheck.readyTitle')}
            </h2>
            <p className="text-brown-light/70 mb-4">
              <span dangerouslySetInnerHTML={{ __html: t('creditCheck.readyCredits', { count: credits, plural: credits > 1 ? 's' : '' }) }} />
            </p>
            <p className="text-brown-light/60 text-sm">{t('creditCheck.readyCost')}</p>
          </motion.div>
          <div className="flex flex-col gap-3 w-full">
            <Button onClick={onNext} className="w-full">{t('creditCheck.launch')}</Button>
            <Button variant="ghost" onClick={onBack} className="w-full">{t('creditCheck.back')}</Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col px-5 py-10 bg-gradient-to-b from-offwhite to-nude-light/30 overflow-y-auto">
      <div className="max-w-md mx-auto w-full">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <div className="w-16 h-16 rounded-2xl bg-nude/50 flex items-center justify-center mx-auto mb-5">
            <Lock className="w-8 h-8 text-brown-light/50" />
          </div>
          <h2 className="font-heading text-3xl font-bold text-brown mb-3">
            {t('creditCheck.noCreditsTitle')}
          </h2>
          <p className="text-brown-light/60 text-base leading-relaxed">
            {t('creditCheck.noCreditsDesc')}
          </p>
        </motion.div>

        <SubscriptionPlans
          variant="compact"
          loading={loading}
          onSelect={handleSubscribe}
          ctaLabel={t('purchasePage.subscribeCta')}
          className="mb-4"
        />

        <button
          onClick={onBack}
          className="w-full text-center text-sm text-brown-light/40 hover:text-brown-light/60 transition-colors pb-4"
        >
          {t('creditCheck.back')}
        </button>

        <p className="text-center text-xs text-brown-light/30 pb-6">{t('purchasePage.securePayment')}</p>
      </div>
    </div>
  )
}
