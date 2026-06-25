import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../../contexts/AuthContext'
import { useCredits } from '../../contexts/CreditContext'
import { setSelectedPlan } from '../../lib/funnelSession'
import SubscriptionPlans from '../pricing/SubscriptionPlans'
import { ROUTES } from '../../lib/routes'
import { trackEvent, planKey } from '../../lib/radar'

export default function FunnelPricing({ onGoSignup }) {
  const { t, i18n } = useTranslation()
  const [designCount, setDesignCount] = useState(1247)
  const [loading, setLoading] = useState(null)
  const navigate = useNavigate()
  const { isAuthenticated } = useAuth()
  const { addCredits } = useCredits()

  useEffect(() => {
    const interval = setInterval(() => {
      setDesignCount((c) => c + Math.floor(Math.random() * 3))
    }, 8000)
    return () => clearInterval(interval)
  }, [])

  const handleSelect = async (planId) => {
    setSelectedPlan(planId)
    trackEvent('plan_selected', { plan: planKey(planId), placement: 'funnel_pricing' })

    if (!isAuthenticated) {
      if (onGoSignup) {
        onGoSignup()
      } else {
        navigate(ROUTES.signup)
      }
      return
    }

    setLoading(planId)
    try {
      await addCredits(planId)
    } catch (err) {
      console.error(err)
      alert(t('funnel.pricing.paymentError', { message: err?.message || t('funnel.checkout.paymentFailed') }))
      setLoading(null)
    }
  }

  const numberLocale = i18n.language === 'en' ? 'en-US' : 'fr-FR'

  return (
    <div className="min-h-screen bg-gradient-to-b from-offwhite to-nude-light/30 px-4 py-12">
      <div className="max-w-4xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-10"
        >
          <h1 className="font-heading text-3xl md:text-4xl font-bold text-brown mb-2">
            {t('funnel.pricing.title')}
          </h1>
          <p className="text-brown-light/60 text-sm">
            {t('funnel.pricing.subtitle')}
          </p>
        </motion.div>

        <SubscriptionPlans
          variant="funnel"
          loading={loading}
          onSelect={handleSelect}
          ctaLabel={t('funnel.pricing.cta')}
        />

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="flex items-center justify-center gap-2 mt-8"
        >
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500" />
          </span>
          <p className="text-xs text-brown-light/60">
            <span className="font-semibold text-brown">{designCount.toLocaleString(numberLocale)}</span>
            {' '}{t('funnel.pricing.designsToday')}
          </p>
        </motion.div>
      </div>
    </div>
  )
}
