import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../../contexts/AuthContext'
import { useCredits } from '../../contexts/CreditContext'
import { setSelectedPlan, persistFunnelStep, getActiveSubscription, clearFunnelCheckoutState } from '../../lib/funnelSession'
import FunnelPricingPlans from '../pricing/FunnelPricingPlans'
import { ROUTES } from '../../lib/routes'
import { trackEvent, planKey } from '../../lib/radar'

export default function FunnelPricing({ onGoSignup }) {
  const { t, i18n } = useTranslation()
  const [searchParams, setSearchParams] = useSearchParams()
  const [designCount, setDesignCount] = useState(1247)
  const [loading, setLoading] = useState(null)
  const [paymentNotice, setPaymentNotice] = useState(null)
  const navigate = useNavigate()
  const { isAuthenticated, user } = useAuth()
  const { addCredits } = useCredits()

  useEffect(() => {
    const status = searchParams.get('payment')
    if (status === 'canceled') {
      setPaymentNotice(t('funnel.pricing.paymentCanceled'))
      searchParams.delete('payment')
      setSearchParams(searchParams, { replace: true })
    } else if (status === 'failed') {
      setPaymentNotice(t('funnel.pricing.paymentFailed'))
      searchParams.delete('payment')
      setSearchParams(searchParams, { replace: true })
    }
  }, [searchParams, setSearchParams, t])

  useEffect(() => {
    const interval = setInterval(() => {
      setDesignCount((c) => c + Math.floor(Math.random() * 3))
    }, 8000)
    return () => clearInterval(interval)
  }, [])

  const handleSelect = async (planId) => {
    setSelectedPlan(planId)
    persistFunnelStep('signup')
    trackEvent('plan_selected', { plan: planKey(planId), placement: 'funnel_pricing' })

    if (!isAuthenticated) {
      if (onGoSignup) {
        onGoSignup()
      } else {
        navigate(ROUTES.signup)
      }
      return
    }

    const activeSub = user ? await getActiveSubscription(user.id) : null
    if (activeSub) {
      clearFunnelCheckoutState()
      navigate(ROUTES.dashboard, { replace: true })
      return
    }

    setLoading(planId)
    try {
      persistFunnelStep('checkout')
      await addCredits(planId)
    } catch (err) {
      console.error(err)
      setPaymentNotice(t('funnel.pricing.paymentError', {
        message: err?.message || t('funnel.checkout.paymentFailed'),
      }))
      setLoading(null)
    }
  }

  const numberLocale = i18n.language === 'en' ? 'en-US' : 'fr-FR'

  return (
    <div className="min-h-screen bg-gradient-to-b from-offwhite to-nude-light/30 px-4 py-10 md:py-12">
      <div className="max-w-lg mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <h1 className="font-heading text-3xl md:text-4xl font-bold text-brown mb-2">
            {t('funnel.pricing.title')}
          </h1>
          <p className="text-brown-light/60 text-sm">
            {t('funnel.pricing.subtitle')}
          </p>
        </motion.div>

        {paymentNotice && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 rounded-2xl bg-red-50 border border-red-100 px-4 py-3 text-sm text-red-600 text-center"
          >
            {paymentNotice}
          </motion.div>
        )}

        <FunnelPricingPlans loading={loading} onSelect={handleSelect} />

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
